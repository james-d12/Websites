#!/usr/bin/env tsx
/**
 * Fetches WW2 battles, naval engagements, air campaigns, and political events
 * from the Wikidata SPARQL endpoint and enriches them with Wikipedia summaries.
 *
 * Usage:
 *   pnpm fetch-data           # fetch and write src/data/events.json
 *   pnpm fetch-data:dry       # print counts only, no file written
 */

import { writeFileSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  WW2Event,
  EventCategory,
  Theater,
  Country,
} from "../types/events.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/events.json");
const CACHE_PATH = join(__dirname, "wiki-cache.json");
const DRY_RUN = process.argv.includes("--dry-run");

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const WP_API = "https://en.wikipedia.org/w/api.php";
const WP_SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const BATTLE_LIST_PAGE = "List of World War II battles";
const UA =
  "WW2Visualiser/1.0 (build-time data fetcher; contact james_d02@protonmail.com)";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SparqlValue {
  type: "uri" | "literal" | "bnode";
  value: string;
  datatype?: string;
}

/** One result row from our SPARQL SELECT queries. */
interface SparqlBinding {
  item: SparqlValue;
  itemLabel: SparqlValue;
  startTime?: SparqlValue;
  endTime?: SparqlValue;
  pointInTime?: SparqlValue;
  inception?: SparqlValue; // P571 — used as date fallback for camps
  coords?: SparqlValue;
  wpTitle?: SparqlValue;
  countryQID?: SparqlValue; // one combatant country QID per row (e.g. "Q183")
}

interface SparqlResponse {
  results: { bindings: SparqlBinding[] };
}

interface WpEntry {
  summary: string;
  article: string;
}

type WikiCache = Record<string, WpEntry>;

interface WpApiResponse {
  extract?: string;
}

/** The categories our queries produce — a subset of EventCategory. */
type QueryCategory = Extract<
  EventCategory,
  "battle" | "naval" | "air" | "political" | "atrocity"
>;

/** A single SPARQL query spec — key for logging, category for output mapping. */
interface QuerySpec {
  key: string;
  category: QueryCategory;
  query: string;
  /** If true, events with no date get a fallback of WW2 start rather than being dropped. */
  dateFallback?: boolean;
}

interface EventSides {
  allied: Country[];
  axis: Country[];
}

/** Intermediate shape after parsing SPARQL bindings, before Wikipedia enrichment. */
interface ParsedEvent {
  qid: string;
  label: string;
  date: string;
  endDate?: string;
  lat: number;
  lng: number;
  category: QueryCategory;
  theater: Theater;
  wpTitle?: string;
  sides?: EventSides;
}

interface EnrichedEvent extends ParsedEvent {
  wp: WpEntry | null;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  retrying (${attempt}/${retries - 1}): ${msg}`);
      await sleep(delayMs * attempt);
    }
  }
  throw new Error("withRetry exhausted");
}

// ── SPARQL ────────────────────────────────────────────────────────────────────

async function sparql(label: string, query: string): Promise<SparqlBinding[]> {
  return withRetry(async () => {
    const url = new URL(SPARQL_ENDPOINT);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("format", "json");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/sparql-results+json", "User-Agent": UA },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SPARQL [${label}] ${res.status}: ${body.slice(0, 300)}`);
    }
    return ((await res.json()) as SparqlResponse).results.bindings;
  });
}

// ── Queries ───────────────────────────────────────────────────────────────────

const WW2_START = '"1939-09-01"^^xsd:dateTime';
const WW2_END = '"1945-09-02"^^xsd:dateTime';

const DATE_OPTIONALS = `
  OPTIONAL { ?item wdt:P580 ?startTime.   }
  OPTIONAL { ?item wdt:P582 ?endTime.     }
  OPTIONAL { ?item wdt:P585 ?pointInTime. }`;

const DATE_FILTER = `
  BIND(COALESCE(?startTime, ?pointInTime) AS ?eventDate)
  FILTER(BOUND(?eventDate))
  FILTER(?eventDate >= ${WW2_START} && ?eventDate <= ${WW2_END})`;

const WP_OPTIONAL = `
  OPTIONAL {
    ?art schema:about ?item; schema:inLanguage "en"; schema:name ?wpTitle.
    FILTER(STRSTARTS(str(?art), "https://en.wikipedia.org/wiki/"))
  }`;

// Adds one row per combatant. Wikidata P710 can point to either a modern country
// (e.g. Q36 Poland) or a historical-state entity (e.g. Q1206012 German Reich).
// Historical states sometimes lack P17, so we COALESCE: if P17 exists use that
// country, otherwise treat the participant itself as the country entity.
const COMBATANT_OPTIONAL = `
  OPTIONAL {
    ?item wdt:P710 ?participant.
    OPTIONAL { ?participant wdt:P17 ?participantCountry. }
    BIND(COALESCE(?participantCountry, ?participant) AS ?effectiveCountry)
    BIND(STRAFTER(STR(?effectiveCountry), "http://www.wikidata.org/entity/") AS ?countryQID)
  }`;

const QUERIES: QuerySpec[] = [
  // ── Land battles, sieges, military offensives ──────────────────────────────
  // Q178561 battle · Q15275719 military operation · Q188055 offensive
  // Q890701 siege · Q180684 conflict · Q3272563 airborne operation
  // Q2001676 military operation (alt) · Q831663 military campaign
  {
    key: "battle",
    category: "battle",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 ?t; wdt:P625 ?coords.
        VALUES ?t { wd:Q178561 wd:Q15275719 wd:Q188055 wd:Q890701 wd:Q180684 wd:Q3272563 wd:Q2001676 wd:Q831663 }
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Explicitly tagged as "part of WW2" — battle subclasses ────────────────
  // Uses P279* subclass traversal scoped to the ~10k WW2-tagged items so it
  // catches any battle-subtype (amphibious assault, airborne op, raid, etc.)
  // that editors tagged with P361=Q362 but typed with an uncommon P31 value.
  {
    key: "ww2-battle-tagged",
    category: "battle",
    dateFallback: true,
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P361 wd:Q362; wdt:P625 ?coords.
        ?item wdt:P31/wdt:P279* wd:Q178561.
        ${DATE_OPTIONALS}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Naval engagements — direct type + WW2-tagged subclasses ───────────────
  {
    key: "naval",
    category: "naval",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 wd:Q1261499; wdt:P625 ?coords.
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  {
    key: "ww2-naval-tagged",
    category: "naval",
    dateFallback: true,
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P361 wd:Q362; wdt:P625 ?coords.
        ?item wdt:P31/wdt:P279* wd:Q1261499.
        ${DATE_OPTIONALS}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Air campaigns and aerial bombings ─────────────────────────────────────
  {
    key: "air",
    category: "air",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 ?t; wdt:P625 ?coords.
        VALUES ?t { wd:Q189760 wd:Q4688003 }
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Diplomatic conferences, treaties, armistices ───────────────────────────
  {
    key: "political",
    category: "political",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 ?t.
        VALUES ?t { wd:Q625994 wd:Q15279819 wd:Q1307987 wd:Q7432 }
        OPTIONAL { ?item wdt:P625 ?directCoords.       }
        OPTIONAL { ?item wdt:P276/wdt:P625 ?locCoords. }
        BIND(COALESCE(?directCoords, ?locCoords) AS ?coords)
        FILTER(BOUND(?coords))
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Massacres ──────────────────────────────────────────────────────────────
  {
    key: "massacre",
    category: "atrocity",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle WHERE {
        ?item wdt:P31 wd:Q3199915; wdt:P625 ?coords.
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Concentration & extermination camps ───────────────────────────────────
  {
    key: "camp",
    category: "atrocity",
    dateFallback: true,
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?inception ?coords ?wpTitle WHERE {
        ?item wdt:P31 ?t; wdt:P625 ?coords.
        VALUES ?t { wd:Q328468 wd:Q153813 }
        OPTIONAL { ?item wdt:P580 ?startTime. }
        OPTIONAL { ?item wdt:P582 ?endTime.   }
        OPTIONAL { ?item wdt:P571 ?inception. }
        ${WP_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },
];

// ── "List of World War II battles" cross-reference ───────────────────────────
//
// The type-based SPARQL queries above miss battles that Wikidata editors typed
// or tagged inconsistently. Wikipedia's "List of World War II battles" article
// is hand-curated and links to (almost) every battle article, so we resolve
// each linked article to its Wikidata QID via the Wikipedia API, then pull
// those QIDs through Wikidata (via SPARQL VALUES) so they go through the same
// coords/date/combatant enrichment as everything else.

interface WpLinksPage {
  links?: { title: string }[];
}
interface WpLinksResponse {
  continue?: { plcontinue: string };
  query: { pages: Record<string, WpLinksPage> };
}

interface WpPagePropsPage {
  pageprops?: { wikibase_item?: string };
}
interface WpPagePropsResponse {
  query: { pages: Record<string, WpPagePropsPage> };
}

async function wpApiGet<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(WP_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return withRetry(async () => {
    const res = await fetch(url.toString(), { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
    return (await res.json()) as T;
  });
}

/** All article titles linked from the WW2 battle list page (paginated). */
async function fetchListedBattleTitles(): Promise<string[]> {
  const titles: string[] = [];
  let plcontinue: string | undefined;
  do {
    const data = await wpApiGet<WpLinksResponse>({
      titles: BATTLE_LIST_PAGE,
      prop: "links",
      plnamespace: "0",
      pllimit: "500",
      ...(plcontinue ? { plcontinue } : {}),
    });
    for (const page of Object.values(data.query.pages)) {
      for (const link of page.links ?? []) titles.push(link.title);
    }
    plcontinue = data.continue?.plcontinue;
  } while (plcontinue);
  return titles;
}

/** Resolves Wikipedia article titles to their Wikidata QIDs (follows redirects). */
async function resolveTitlesToQids(titles: string[]): Promise<string[]> {
  const qids = new Set<string>();
  const BATCH = 50;
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const data = await wpApiGet<WpPagePropsResponse>({
      titles: batch.join("|"),
      prop: "pageprops",
      ppprop: "wikibase_item",
      redirects: "1",
    });
    for (const page of Object.values(data.query.pages)) {
      const qid = page.pageprops?.wikibase_item;
      if (qid) qids.add(qid);
    }
    if (i + BATCH < titles.length) await sleep(300);
  }
  return [...qids];
}

function listBattlesQuery(qids: string[]): string {
  return `
    SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
      ?item wdt:P625 ?coords.
      ${DATE_OPTIONALS}
      ${WP_OPTIONAL}
      ${COMBATANT_OPTIONAL}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`;
}

/** Pulls the given QIDs through Wikidata in URL-length-safe chunks. */
async function fetchListBattleRows(qids: string[]): Promise<SparqlBinding[]> {
  const CHUNK = 80;
  const rows: SparqlBinding[] = [];
  for (let i = 0; i < qids.length; i += CHUNK) {
    const chunk = qids.slice(i, i + CHUNK);
    rows.push(...(await sparql("list-battles", listBattlesQuery(chunk))));
    if (i + CHUNK < qids.length) await sleep(500);
  }
  return rows;
}

// ── Country mapping ───────────────────────────────────────────────────────────

// Maps Wikidata country QIDs to our Country type.
// Both modern-state QIDs (Q183 Germany) and WW2-era state QIDs (Q7318 Nazi Germany)
// are included since Wikidata uses both inconsistently.
const COUNTRY_QID_TO_COUNTRY: Partial<Record<string, Country>> = {
  // Germany — P710 uses both Q7318 (Nazi Germany) and Q1206012 (German Reich)
  // depending on which editor wrote the Wikidata item (verified via live query)
  Q183: "germany", // Germany (general/modern)
  Q7318: "germany", // Nazi Germany
  Q1206012: "germany", // German Reich (used directly as P710 on e.g. Battle of Stalingrad)
  Q43287: "germany", // Third Reich (alt)
  Q202215: "germany", // German Reich (alt)
  Q40: "germany", // Austria (under Anschluss — acts as part of Germany militarily)
  // Soviet Union — Q15180 is what Wikidata actually returns on battles (verified)
  Q15180: "ussr",
  Q34266: "ussr", // alt, kept for safety
  // United Kingdom
  Q145: "uk",
  Q174193: "uk", // United Kingdom of Great Britain (historical alt)
  // Commonwealth — tracked individually
  Q16: "canada",
  Q408: "australia",
  Q664: "new_zealand",
  Q668: "india", // British India
  // United States
  Q30: "usa",
  // Italy — historical state QIDs verified from Battle of Stalingrad query
  Q38: "italy",
  Q172579: "italy", // Kingdom of Italy (WW2-era QID used in battles)
  Q6764: "italy", // Kingdom of Italy (alt)
  Q45095: "italy", // Italian Social Republic
  // Japan
  Q17: "japan",
  Q16849950: "japan", // Empire of Japan
  // France — Free France vs Vichy tracked separately
  Q142: "france",
  Q235547: "france", // Free France
  Q34981: "vichy_france", // Vichy France (Axis-aligned)
  // Allied nations — individual countries, not lumped together
  Q36: "poland",
  Q55: "netherlands",
  Q29999: "netherlands", // Kingdom of the Netherlands (P17 of Q55)
  Q31: "belgium",
  Q20: "norway",
  Q35: "denmark",
  Q756617: "denmark", // Kingdom of Denmark (P17 of Q35)
  Q191: "estonia",
  Q211: "latvia",
  Q37: "lithuania",
  Q41: "greece",
  Q148: "china",
  Q865: "china", // Republic of China
  Q83286: "yugoslavia", // Kingdom of Yugoslavia
  Q36704: "yugoslavia", // Yugoslavia (general)
  // Axis allies — individual countries
  Q218: "romania",
  Q203493: "romania", // Kingdom of Romania (WW2-era QID)
  Q28: "hungary",
  Q600018: "hungary", // Kingdom of Hungary (WW2-era QID)
  Q214: "slovakia",
  Q153128: "croatia", // Independent State of Croatia
  Q33: "finland",
  Q797278: "finland", // Finland (WW2-era alt)
  Q222: "albania",
  Q13474305: "spain", // Francoist Spain
};

const ALLIED_COUNTRIES = new Set<Country>([
  "uk",
  "usa",
  "ussr",
  "france",
  "canada",
  "australia",
  "new_zealand",
  "india",
  "poland",
  "netherlands",
  "belgium",
  "norway",
  "denmark",
  "greece",
  "china",
  "estonia",
  "latvia",
  "lithuania",
  "yugoslavia",
]);
const AXIS_COUNTRIES = new Set<Country>([
  "germany",
  "italy",
  "japan",
  "romania",
  "hungary",
  "slovakia",
  "croatia",
  "vichy_france",
  "finland",
  "albania",
  "spain",
]);

function mapSides(countryQIDs: Iterable<string>): EventSides | undefined {
  const allied = new Set<Country>();
  const axis = new Set<Country>();
  for (const qid of countryQIDs) {
    const c = COUNTRY_QID_TO_COUNTRY[qid];
    if (!c) continue;
    if (ALLIED_COUNTRIES.has(c)) allied.add(c);
    else if (AXIS_COUNTRIES.has(c)) axis.add(c);
  }
  if (allied.size === 0 && axis.size === 0) return undefined;
  return {
    allied: [...allied].slice(0, 6),
    axis: [...axis].slice(0, 6),
  };
}

// ── Geo helpers ───────────────────────────────────────────────────────────────

function parseCoords(
  raw: string | undefined,
): { lat: number; lng: number } | null {
  if (!raw) return null;
  const m = raw.match(/Point\(([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\)/);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

function inferTheater(lat: number, lng: number): Theater {
  if (lat >= 34 && lat <= 72 && lng >= -12 && lng <= 42) return "europe";
  if (lat >= -36 && lat <= 38 && lng >= -18 && lng <= 55) return "africa";
  if (lat >= 0 && lat <= 55 && lng >= 42 && lng <= 100) return "asia";
  if (lat >= -55 && lat <= 65 && (lng >= 100 || lng <= -60)) return "pacific";
  return "atlantic";
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/([+-]?\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const year = parseInt(m[1], 10);
  if (year < 1930 || year > 1950) return undefined;
  const month = m[2] === "00" ? "01" : m[2];
  const day = m[3] === "00" ? "01" : m[3];
  return `${String(year).padStart(4, "0")}-${month}-${day}`;
}

// ── Slug helper ───────────────────────────────────────────────────────────────

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// ── Wikipedia ─────────────────────────────────────────────────────────────────

async function fetchWpSummary(title: string): Promise<WpEntry | null> {
  try {
    const res = await fetch(
      `${WP_SUMMARY_API}/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as WpApiResponse;
    const extract = data.extract ?? "";
    const sentences = extract.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
    const summary =
      sentences.slice(0, 2).join("").trim() || extract.slice(0, 200);
    return { summary, article: extract };
  } catch {
    return null;
  }
}

async function resolveWpTitle(
  label: string,
  year: string,
): Promise<string | null> {
  const withYear = `${label} (${year})`;
  const res = await fetchWpSummary(withYear);
  if (res) return withYear;
  const plain = await fetchWpSummary(label);
  if (plain) return label;
  return null;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

function loadCache(): WikiCache {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as WikiCache;
  } catch {
    return {};
  }
}

function saveCache(cache: WikiCache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("Querying Wikidata SPARQL…");

  type TaggedBinding = SparqlBinding & { _spec: QuerySpec; _qid: string };

  const settled = await Promise.allSettled(
    QUERIES.map((spec) =>
      sparql(spec.key, spec.query).then((rows) =>
        rows.map((r) => ({
          ...r,
          _spec: spec,
          _qid: r.item.value.split("/").pop()!,
        })),
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

  console.log(`Cross-referencing "${BATTLE_LIST_PAGE}"…`);
  try {
    const titles = await fetchListedBattleTitles();
    console.log(`  ${titles.length} linked articles`);
    const qids = await resolveTitlesToQids(titles);
    console.log(`  ${qids.length} resolved to Wikidata items`);
    const listSpec: QuerySpec = {
      key: "list-battles",
      category: "battle",
      dateFallback: true,
      query: "",
    };
    const listRows = (await fetchListBattleRows(qids)).map((r) => ({
      ...r,
      _spec: listSpec,
      _qid: r.item.value.split("/").pop()!,
    }));
    console.log(`  [list-battles] ${listRows.length} rows`);
    allRows.push(...listRows);
  } catch (err) {
    console.warn(
      `  [list-battles] failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Deduplicate by QID, accumulating combatant country QIDs across rows.
  // Queries with COMBATANT_OPTIONAL return one row per (event × country), so the
  // same event QID appears multiple times — one per combatant country.
  type Accumulated = { binding: TaggedBinding; countryQIDs: Set<string> };
  const accum = new Map<string, Accumulated>();
  for (const row of allRows) {
    const qid = row._qid;
    if (!accum.has(qid)) {
      accum.set(qid, { binding: row, countryQIDs: new Set() });
    }
    const cqid = row.countryQID?.value;
    if (cqid) accum.get(qid)!.countryQIDs.add(cqid);
  }
  console.log(`After dedup: ${accum.size} unique items`);

  // Parse — drop anything missing a label, valid coords, or a date
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

    const sides = mapSides(countryQIDs);

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
      sides,
    });
  }

  parsed.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`After filtering: ${parsed.length} events with date + coords`);

  const withSides = parsed.filter(
    (e) => e.sides && e.sides.allied.length + e.sides.axis.length > 0,
  ).length;
  console.log(`Events with sides data: ${withSides} / ${parsed.length}`);

  if (DRY_RUN) {
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

  // Wikipedia summaries — cache-first, batch-fetch only what's missing
  const cache = loadCache();
  const needed = parsed.filter(
    (e) => e.wpTitle !== undefined && !cache[e.wpTitle],
  );
  console.log(
    `\nWikipedia: ${Object.keys(cache).length} cached, ${needed.length} to fetch…`,
  );

  const BATCH = 10;
  let fetched = 0;
  for (let i = 0; i < needed.length; i += BATCH) {
    const batch = needed.slice(i, i + BATCH);
    const entries = await Promise.all(
      batch.map((e) => fetchWpSummary(e.wpTitle!)),
    );
    batch.forEach((e, j) => {
      if (entries[j]) cache[e.wpTitle!] = entries[j]!;
    });
    fetched += batch.length;
    process.stdout.write(`\r  ${fetched}/${needed.length}`);
    if (i + BATCH < needed.length) await sleep(500);
  }
  if (needed.length > 0) {
    console.log();
    saveCache(cache);
  }

  const noLink = parsed.filter((e) => e.wpTitle === undefined);
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
  for (const e of noLink) {
    if (e.wpTitle !== undefined) continue;
    const year = e.date.slice(0, 4);
    if (cache[`${e.label} (${year})`]) e.wpTitle = `${e.label} (${year})`;
    else if (cache[e.label]) e.wpTitle = e.label;
  }
  console.log();
  saveCache(cache);

  const enriched: EnrichedEvent[] = parsed.map((e) => ({
    ...e,
    wp: e.wpTitle ? (cache[e.wpTitle] ?? null) : null,
  }));

  // Assign stable IDs — append QID only on slug collision
  const slugCount = enriched.reduce<Record<string, number>>((acc, e) => {
    const s = toSlug(e.label);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const events: WW2Event[] = enriched.map((e): WW2Event => {
    const baseSlug = toSlug(e.label);
    const id =
      slugCount[baseSlug] > 1 ? `${baseSlug}-${e.qid.toLowerCase()}` : baseSlug;

    return {
      id,
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
    };
  });

  if (events.length === 0) {
    console.error("No events produced — keeping existing events.json.");
    process.exit(1);
  }

  console.log(`Writing ${events.length} events → ${OUT_PATH}`);
  writeFileSync(OUT_PATH, JSON.stringify(events, null, 2));
  console.log("Done.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
