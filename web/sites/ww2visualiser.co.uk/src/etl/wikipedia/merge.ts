#!/usr/bin/env tsx
/**
 * Merges battles from Wikipedia's hand-curated "List of World War II
 * battles" that the SPARQL/Wikidata pipeline misses entirely into
 * events.json / unknowns.json.
 *
 * Unlike the main pipeline, dates come straight from the page's own
 * Start/End columns (always present) rather than Wikidata — Wikidata
 * coverage for these long-tail battles turns out to be too patchy to rely
 * on for dates, and patchier still for coordinates, so coordinates are
 * resolved from Wikidata P625 first and the Wikipedia page-coordinates API
 * second. Anything with neither is dropped, matching the main pipeline's
 * "no coords, no event" rule.
 *
 * Usage:
 *   tsx src/etl/wikipedia/merge.ts          # merge and write files
 *   tsx src/etl/wikipedia/merge.ts --dry-run
 */
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WW2Event } from "../../types/events.ts";
import type { EventSides } from "../events/types.ts";
import type { SparqlValue } from "../lib/sparql.ts";
import { UA, WP_API } from "../lib/constants.ts";
import { sleep, withRetry } from "../lib/async.ts";
import { fetchRowsByQid } from "../lib/sparql.ts";
import { loadCache, saveCache } from "../lib/cache.ts";
import { fetchMissingSummaries } from "../lib/enrich.ts";
import { toSlug } from "../lib/slug.ts";
import { mapSides } from "../events/countries.ts";
import { parseCoords, inferTheater } from "../events/geo.ts";
import { fetchBattleList, BATTLE_LIST_PAGE } from "./battle-list.ts";
import type { BattleListEntry } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = join(__dirname, "../../data/events.json");
const UNKNOWNS_PATH = join(__dirname, "../../data/unknowns.json");

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 50;

interface Coords {
  lat: number;
  lng: number;
}

interface MergedEvent {
  qid: string;
  title: string;
  date: string;
  endDate?: string;
  lat: number;
  lng: number;
  sides?: EventSides;
  wpTitle: string;
}

// ── Step 1: which listed battles aren't already represented ────────────────

/** Wikipedia article titles already referenced via any event's links[]. */
function articleTitlesOf(events: WW2Event[]): Set<string> {
  const titles = new Set<string>();
  for (const e of events) {
    for (const link of e.links ?? []) {
      const slug = link.url.split("/wiki/")[1];
      if (!slug) continue;
      titles.add(decodeURIComponent(slug).replace(/_/g, " "));
    }
  }
  return titles;
}

// ── Step 2: resolve article titles to Wikidata QIDs (title-preserving) ─────

interface PagePropsResponse {
  query: {
    redirects?: { from: string; to: string }[];
    pages: Record<
      string,
      { title: string; pageprops?: { wikibase_item?: string } }
    >;
  };
}

/** Like lib/wikipedia's resolveTitlesToQids, but keeps the title→QID mapping. */
async function resolveTitleToQidMap(
  titles: string[],
): Promise<Map<string, string>> {
  const byTitle = new Map<string, string>();
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const url = new URL(WP_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("titles", batch.join("|"));
    url.searchParams.set("prop", "pageprops");
    url.searchParams.set("ppprop", "wikibase_item");
    url.searchParams.set("redirects", "1");
    const data = await withRetry(async () => {
      const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
      return (await res.json()) as PagePropsResponse;
    });

    const qidByResolvedTitle = new Map<string, string>();
    for (const page of Object.values(data.query.pages)) {
      if (page.pageprops?.wikibase_item) {
        qidByResolvedTitle.set(page.title, page.pageprops.wikibase_item);
      }
    }
    const redirectTo = new Map(
      (data.query.redirects ?? []).map((r) => [r.from, r.to]),
    );
    for (const original of batch) {
      const resolved = redirectTo.get(original) ?? original;
      const qid = qidByResolvedTitle.get(resolved);
      if (qid) byTitle.set(original, qid);
    }
    if (i + BATCH < titles.length) await sleep(300);
  }
  return byTitle;
}

// ── Step 3: coordinates + combatants from Wikidata, by QID ─────────────────

interface WdRow {
  item: SparqlValue;
  coords?: SparqlValue;
  countryQID?: SparqlValue;
}

function coordsAndCombatantsQuery(qids: string[]): string {
  return `
    SELECT DISTINCT ?item ?coords ?countryQID WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
      OPTIONAL { ?item wdt:P625 ?coords. }
      OPTIONAL {
        ?item wdt:P710 ?participant.
        OPTIONAL { ?participant wdt:P17 ?participantCountry. }
        BIND(COALESCE(?participantCountry, ?participant) AS ?effectiveCountry)
        BIND(STRAFTER(STR(?effectiveCountry), "http://www.wikidata.org/entity/") AS ?countryQID)
      }
    }`;
}

interface WikidataInfo {
  coords?: Coords;
  countryQIDs: Set<string>;
}

async function fetchWikidataInfo(
  qids: string[],
): Promise<Map<string, WikidataInfo>> {
  const rows = await fetchRowsByQid<WdRow>(
    "wiki-merge",
    qids,
    coordsAndCombatantsQuery,
  );
  const byQid = new Map<string, WikidataInfo>();
  for (const row of rows) {
    const qid = row.item.value.split("/").pop()!;
    const info = byQid.get(qid) ?? { countryQIDs: new Set<string>() };
    if (!info.coords && row.coords?.value) {
      const c = parseCoords(row.coords.value);
      if (c) info.coords = c;
    }
    if (row.countryQID?.value) info.countryQIDs.add(row.countryQID.value);
    byQid.set(qid, info);
  }
  return byQid;
}

// ── Step 4: fall back to Wikipedia's own page-coordinates for the rest ─────

interface CoordResponse {
  query: {
    pages: Record<
      string,
      { title: string; coordinates?: { lat: number; lon: number }[] }
    >;
  };
}

async function fetchWikipediaCoords(
  titles: string[],
): Promise<Map<string, Coords>> {
  const byTitle = new Map<string, Coords>();
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const url = new URL(WP_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("titles", batch.join("|"));
    url.searchParams.set("prop", "coordinates");
    url.searchParams.set("redirects", "1");
    const data = await withRetry(async () => {
      const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
      return (await res.json()) as CoordResponse;
    });
    for (const page of Object.values(data.query.pages)) {
      const c = page.coordinates?.[0];
      if (c) byTitle.set(page.title, { lat: c.lat, lng: c.lon });
    }
    if (i + BATCH < titles.length) await sleep(300);
  }
  return byTitle;
}

// ── Step 5: assemble + write ────────────────────────────────────────────────

/** Slugifies new items' labels, avoiding collisions with existing IDs or each other. */
function assignNewIds(
  items: { label: string; qid: string }[],
  existingIds: Iterable<string>,
): string[] {
  const used = new Set(existingIds);
  return items.map((item) => {
    let id = toSlug(item.label);
    if (used.has(id)) id = `${id}-${item.qid.toLowerCase()}`;
    used.add(id);
    return id;
  });
}

function toWW2Event(
  e: MergedEvent,
  id: string,
  wp: { summary: string; article: string } | null,
): WW2Event {
  return {
    id,
    qid: e.qid,
    title: e.title,
    date: e.date,
    ...(e.endDate !== undefined ? { endDate: e.endDate } : {}),
    ...(e.sides !== undefined ? { sides: e.sides } : {}),
    lat: e.lat,
    lng: e.lng,
    category: "battle",
    theater: inferTheater(e.lat, e.lng),
    article: wp?.article ?? "",
    links: [
      {
        label: `Wikipedia: ${e.title}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(e.wpTitle.replace(/ /g, "_"))}`,
      },
    ],
  };
}

async function main(): Promise<void> {
  console.log(`Fetching "${BATTLE_LIST_PAGE}"…`);
  const battles = await fetchBattleList();

  const events = JSON.parse(readFileSync(EVENTS_PATH, "utf8")) as WW2Event[];
  const unknowns = JSON.parse(
    readFileSync(UNKNOWNS_PATH, "utf8"),
  ) as WW2Event[];
  const known = articleTitlesOf([...events, ...unknowns]);
  const existingQids = new Set([...events, ...unknowns].map((e) => e.qid));

  const candidates = battles.filter((b: BattleListEntry) => !known.has(b.title));
  console.log(`${candidates.length} listed battles have no matching article link`);

  console.log("Resolving Wikidata QIDs…");
  const qidByTitle = await resolveTitleToQidMap(candidates.map((b) => b.title));
  console.log(`  ${qidByTitle.size}/${candidates.length} resolved`);

  // Some list-page articles are redirects/renames of items already present
  // under a different title (verified: same Wikidata QID, e.g. "Battle for
  // The Hague" vs. the existing "Battle of the Hague (1940)"). Skip those —
  // they're already represented, not actually missing.
  const missing = candidates.filter((b) => {
    const qid = qidByTitle.get(b.title);
    return !qid || !existingQids.has(qid);
  });
  const dupes = candidates.length - missing.length;
  if (dupes > 0) {
    console.log(`  ${dupes} are duplicates of existing events under another title — skipping`);
  }

  console.log("Querying Wikidata for coordinates + combatants…");
  const wikidata = await fetchWikidataInfo([...new Set(qidByTitle.values())]);

  const stillNoCoords = missing.filter((b) => {
    const qid = qidByTitle.get(b.title);
    return !wikidata.get(qid ?? "")?.coords;
  });
  console.log(
    `Falling back to Wikipedia page-coordinates for ${stillNoCoords.length} articles…`,
  );
  const wpCoords = await fetchWikipediaCoords(stillNoCoords.map((b) => b.title));

  const merged: MergedEvent[] = [];
  let noQid = 0;
  let noCoords = 0;
  for (const battle of missing) {
    if (!battle.date) continue;
    const qid = qidByTitle.get(battle.title);
    if (!qid) {
      noQid++;
      continue;
    }
    const wd = wikidata.get(qid);
    const coords = wd?.coords ?? wpCoords.get(battle.title);
    if (!coords) {
      noCoords++;
      continue;
    }
    merged.push({
      qid,
      title: battle.display,
      date: battle.date,
      endDate: battle.endDate,
      lat: coords.lat,
      lng: coords.lng,
      sides: wd ? mapSides(wd.countryQIDs) : undefined,
      wpTitle: battle.title,
    });
  }
  console.log(
    `\n${merged.length} mergeable (${noQid} had no Wikidata QID, ${noCoords} had no coordinates from either source)`,
  );

  if (DRY_RUN) {
    for (const e of merged.slice(0, 20)) {
      console.log(`  ${e.date}  ${e.title}  (${e.lat.toFixed(2)}, ${e.lng.toFixed(2)})`);
    }
    console.log("\nNo files written (--dry-run).");
    return;
  }

  const cache = loadCache();
  await fetchMissingSummaries(merged, cache);
  saveCache(cache);

  const existingIds = new Set([...events, ...unknowns].map((e) => e.id));
  const ids = assignNewIds(
    merged.map((e) => ({ label: e.title, qid: e.qid })),
    existingIds,
  );

  const newEvents: WW2Event[] = [];
  const newUnknowns: WW2Event[] = [];
  merged.forEach((e, i) => {
    const wp = cache[e.wpTitle] ?? null;
    const event = toWW2Event(e, ids[i], wp);
    (wp?.article ? newEvents : newUnknowns).push(event);
  });
  console.log(
    `\n${newEvents.length} → events.json, ${newUnknowns.length} → unknowns.json (no usable summary)`,
  );

  const sortByDate = (a: WW2Event, b: WW2Event) => a.date.localeCompare(b.date);
  const mergedEvents = [...events, ...newEvents].sort(sortByDate);
  const mergedUnknowns = [...unknowns, ...newUnknowns].sort(sortByDate);

  writeFileSync(EVENTS_PATH, JSON.stringify(mergedEvents, null, 2));
  writeFileSync(UNKNOWNS_PATH, JSON.stringify(mergedUnknowns, null, 2));
  console.log(`Wrote ${mergedEvents.length} events → ${EVENTS_PATH}`);
  console.log(`Wrote ${mergedUnknowns.length} unknowns → ${UNKNOWNS_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
