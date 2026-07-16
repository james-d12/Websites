import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WW2Event } from "../../types/events.ts";
import { sleep } from "../lib/async.ts";
import { sparql } from "../lib/sparql.ts";
import { loadCache, saveCache } from "../lib/cache.ts";
import { fetchMissingSummaries } from "../lib/enrich.ts";
import { fetchWpSummary } from "../lib/wikipedia.ts";
import { assignSlugIds } from "../lib/slug.ts";
import { QUERIES } from "./queries.ts";
import { fetchListBattleRows } from "./list-cross-reference.ts";
import { mapSides } from "./countries.ts";
import { parseCoords, inferTheater } from "./geo.ts";
import { parseDate } from "./dates.ts";
import type {
  SparqlBinding,
  QuerySpec,
  ParsedEvent,
  EnrichedEvent,
} from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../../data/events.json");
const UNKNOWNS_PATH = join(__dirname, "../../data/unknowns.json");

const BATCH = 10;

type TaggedBinding = SparqlBinding & { _spec: QuerySpec; _qid: string };

function tag(spec: QuerySpec, rows: SparqlBinding[]): TaggedBinding[] {
  return rows.map((r) => ({
    ...r,
    _spec: spec,
    _qid: r.item.value.split("/").pop()!,
  }));
}

async function collectRows(): Promise<TaggedBinding[]> {
  console.log("Querying Wikidata SPARQL…");

  const settled = await Promise.allSettled(
    QUERIES.map((spec) =>
      sparql<SparqlBinding>(spec.key, spec.query).then((rows) =>
        tag(spec, rows),
      ),
    ),
  );

  const allRows: TaggedBinding[] = [];
  for (const [i, result] of settled.entries()) {
    const { key } = QUERIES[i];
    if (result.status === "rejected") {
      console.warn(
        `  [${key}] failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      );
    } else {
      console.log(`  [${key}] ${result.value.length} rows`);
      allRows.push(...result.value);
    }
  }

  // No dateFallback: unlike the WW2-tagged queries (whose items are vetted
  // WW2 conflicts simply missing precise dates), these cross-referenced
  // items are often near-empty Wikidata stubs. Defaulting them to the WW2
  // start date would misplace real, well-documented battles (e.g. "Battle
  // of Vercors" — July 1944 — has no Wikidata date claims at all). Better
  // to drop an event than to show it on the wrong date.
  const listSpec: QuerySpec = {
    key: "list-battles",
    category: "battle",
    query: "",
  };
  try {
    allRows.push(...tag(listSpec, await fetchListBattleRows()));
  } catch (err) {
    console.warn(
      `  [list-battles] failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return allRows;
}

/**
 * Deduplicates rows by QID, accumulating combatant country QIDs across rows.
 * Queries with COMBATANT_OPTIONAL return one row per (event × country), so the
 * same event QID appears multiple times — one per combatant country.
 */
function dedupe(
  rows: TaggedBinding[],
): Map<string, { binding: TaggedBinding; countryQIDs: Set<string> }> {
  const accum = new Map<
    string,
    { binding: TaggedBinding; countryQIDs: Set<string> }
  >();
  for (const row of rows) {
    const qid = row._qid;
    if (!accum.has(qid))
      accum.set(qid, { binding: row, countryQIDs: new Set() });
    const cqid = row.countryQID?.value;
    if (cqid) accum.get(qid)!.countryQIDs.add(cqid);
  }
  return accum;
}

/** Parses accumulated rows into events, dropping anything missing a label, coords, or date. */
function parseEvents(
  accum: Map<string, { binding: TaggedBinding; countryQIDs: Set<string> }>,
): ParsedEvent[] {
  const parsed: ParsedEvent[] = [];
  for (const { binding: row, countryQIDs } of accum.values()) {
    const label = row.itemLabel?.value;
    if (!label || /^Q\d+$/.test(label)) continue;

    const rawDate =
      row.startTime?.value ?? row.pointInTime?.value ?? row.inception?.value;
    const date =
      parseDate(rawDate) ?? (row._spec.dateFallback ? "1939-09-01" : undefined);
    if (!date) continue;

    const endDate = parseDate(row.endTime?.value);
    const coords = parseCoords(row.coords?.value);
    if (!coords) continue;

    parsed.push({
      qid: row._qid,
      label,
      date,
      endDate,
      lat: coords.lat,
      lng: coords.lng,
      category: row._spec.category,
      theater: inferTheater(coords.lat, coords.lng),
      wpTitle: row.wpTitle?.value,
      sides: mapSides(countryQIDs),
    });
  }
  parsed.sort((a, b) => a.date.localeCompare(b.date));
  return parsed;
}

/** For events with no Wikipedia sitelink, guesses an article title (with/without year). */
async function resolveMissingWpTitles(
  events: ParsedEvent[],
  cache: Record<string, { summary: string; article: string }>,
): Promise<void> {
  const noLink = events.filter((e) => e.wpTitle === undefined);
  console.log(`Resolving ${noLink.length} events with no sitelink…`);
  let resolved = 0;
  for (let i = 0; i < noLink.length; i += BATCH) {
    const batch = noLink.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (e) => {
        const year = e.date.slice(0, 4);
        const cacheKey = `${e.label} (${year})`;
        if (cache[cacheKey] || cache[e.label]) return;
        const title = await resolveWpTitle(e.label, year);
        if (title) {
          const entry = await fetchWpSummary(title);
          if (entry) {
            cache[title] = entry;
            e.wpTitle = title;
          }
        }
      }),
    );
    resolved += batch.length;
    process.stdout.write(`\r  ${resolved}/${noLink.length}`);
    if (i + BATCH < noLink.length) await sleep(500);
  }
  console.log();
  for (const e of noLink) {
    if (e.wpTitle !== undefined) continue;
    const year = e.date.slice(0, 4);
    if (cache[`${e.label} (${year})`]) e.wpTitle = `${e.label} (${year})`;
    else if (cache[e.label]) e.wpTitle = e.label;
  }
}

async function resolveWpTitle(
  label: string,
  year: string,
): Promise<string | null> {
  const withYear = `${label} (${year})`;
  if (await fetchWpSummary(withYear)) return withYear;
  if (await fetchWpSummary(label)) return label;
  return null;
}

function toWW2Events(enriched: EnrichedEvent[]): WW2Event[] {
  const ids = assignSlugIds(enriched);
  return enriched.map((e, i): WW2Event => ({
    id: ids[i],
    qid: e.qid,
    title: e.label,
    date: e.date,
    ...(e.endDate !== undefined ? { endDate: e.endDate } : {}),
    ...(e.sides !== undefined ? { sides: e.sides } : {}),
    lat: e.lat,
    lng: e.lng,
    category: e.category,
    theater: e.theater,
    article: e.wp?.article ?? "",
    links: e.wpTitle
      ? [
          {
            label: `Wikipedia: ${e.label}`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(e.wpTitle.replace(/ /g, "_"))}`,
          },
        ]
      : [],
  }));
}

export async function fetchEvents(dryRun: boolean): Promise<void> {
  const allRows = await collectRows();

  const accum = dedupe(allRows);
  console.log(`After dedup: ${accum.size} unique items`);

  const parsed = parseEvents(accum);
  console.log(`After filtering: ${parsed.length} events with date + coords`);

  const withSides = parsed.filter(
    (e) => e.sides && e.sides.allied.length + e.sides.axis.length > 0,
  ).length;
  console.log(`Events with sides data: ${withSides} / ${parsed.length}`);

  if (dryRun) {
    for (const e of parsed.slice(0, 15)) {
      const allied = e.sides?.allied.join("+") ?? "—";
      const axis = e.sides?.axis.join("+") ?? "—";
      console.log(
        `  [${e.category.padEnd(9)}] ${e.date}  ${e.label}  (${e.theater})  allied: ${allied}  axis: ${axis}`,
      );
    }
    const breakdown = parsed.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {});
    console.log("\nBreakdown:", breakdown);
    console.log(`Total: ${parsed.length} events. No file written (--dry-run).`);
    return;
  }

  const cache = loadCache();
  await fetchMissingSummaries(parsed, cache);
  await resolveMissingWpTitles(parsed, cache);
  saveCache(cache);

  const enriched: EnrichedEvent[] = parsed.map((e) => ({
    ...e,
    wp: e.wpTitle ? (cache[e.wpTitle] ?? null) : null,
  }));

  // Events with neither a Wikipedia summary nor an article extract are too
  // thin to show on the map. Park them in unknowns.json rather than dropping
  // them entirely or polluting events.json with empty descriptions.
  const known = enriched.filter((e) => e.wp?.article);
  const unknown = enriched.filter((e) => !e.wp?.article);
  console.log(
    `Events with no summary/article: ${unknown.length} → unknowns.json`,
  );

  const events = toWW2Events(known);
  const unknowns = toWW2Events(unknown);

  if (events.length === 0) {
    console.error("No events produced — keeping existing events.json.");
    process.exit(1);
  }

  console.log(`Writing ${events.length} events → ${OUT_PATH}`);
  writeFileSync(OUT_PATH, JSON.stringify(events, null, 2));
  console.log(`Writing ${unknowns.length} unknowns → ${UNKNOWNS_PATH}`);
  writeFileSync(UNKNOWNS_PATH, JSON.stringify(unknowns, null, 2));
  console.log("Done.");
}
