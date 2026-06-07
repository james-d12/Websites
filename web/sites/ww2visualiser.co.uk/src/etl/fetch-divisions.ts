#!/usr/bin/env tsx
/**
 * Fetches German WW2 military divisions from Wikipedia's "List of German
 * divisions in World War II", resolves each to its Wikidata item for basic
 * facts (type, branch, formed/disbanded dates), and enriches with Wikipedia
 * summaries.
 *
 * Usage:
 *   pnpm fetch-divisions       # fetch and write src/data/divisions.json
 *   pnpm fetch-divisions:dry   # print counts only, no file written
 */

import { writeFileSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Division } from "../types/divisions.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/divisions.json");
const CACHE_PATH = join(__dirname, "wiki-cache.json");
const DRY_RUN = process.argv.includes("--dry-run");

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const WP_API = "https://en.wikipedia.org/w/api.php";
const WP_SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const DIVISION_LIST_PAGE = "List of German divisions in World War II";
const UA =
  "WW2Visualiser/1.0 (build-time data fetcher; contact james_d02@protonmail.com)";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SparqlValue {
  type: "uri" | "literal" | "bnode";
  value: string;
  datatype?: string;
}

interface DivisionBinding {
  item: SparqlValue;
  itemLabel: SparqlValue;
  typeLabel?: SparqlValue;
  branchLabel?: SparqlValue;
  inception?: SparqlValue;
  dissolved?: SparqlValue;
  wpTitle?: SparqlValue;
}

interface SparqlResponse {
  results: { bindings: DivisionBinding[] };
}

interface WpEntry {
  summary: string;
  article: string;
}

type WikiCache = Record<string, WpEntry>;

interface WpApiResponse {
  extract?: string;
}

interface ParsedDivision {
  qid: string;
  label: string;
  type?: string;
  branch?: string;
  formed?: string;
  disbanded?: string;
  wpTitle?: string;
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

async function sparql(
  label: string,
  query: string,
): Promise<DivisionBinding[]> {
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

const WP_OPTIONAL = `
  OPTIONAL {
    ?art schema:about ?item; schema:inLanguage "en"; schema:name ?wpTitle.
    FILTER(STRSTARTS(str(?art), "https://en.wikipedia.org/wiki/"))
  }`;

function divisionsQuery(qids: string[]): string {
  return `
    SELECT DISTINCT ?item ?itemLabel ?typeLabel ?branchLabel ?inception ?dissolved ?wpTitle WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
      OPTIONAL { ?item wdt:P31 ?type.     }
      OPTIONAL { ?item wdt:P361 ?branch.  }
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P576 ?dissolved. }
      ${WP_OPTIONAL}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`;
}

/** Pulls the given QIDs through Wikidata in URL-length-safe chunks. */
async function fetchDivisionRows(qids: string[]): Promise<DivisionBinding[]> {
  const CHUNK = 80;
  const rows: DivisionBinding[] = [];
  for (let i = 0; i < qids.length; i += CHUNK) {
    const chunk = qids.slice(i, i + CHUNK);
    rows.push(...(await sparql("divisions", divisionsQuery(chunk))));
    if (i + CHUNK < qids.length) await sleep(500);
  }
  return rows;
}

// ── "List of German divisions in World War II" cross-reference ───────────────
//
// The list page has no infobox/table data — just bulleted wikilinks grouped by
// branch and type. We resolve each linked article to its Wikidata QID via the
// Wikipedia API, then pull basic facts (type, branch, formed/disbanded dates)
// for those QIDs from Wikidata.

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

/** All article titles linked from the division list page (paginated). */
async function fetchListedDivisionTitles(): Promise<string[]> {
  const titles: string[] = [];
  let plcontinue: string | undefined;
  do {
    const data = await wpApiGet<WpLinksResponse>({
      titles: DIVISION_LIST_PAGE,
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

// ── Date helpers ──────────────────────────────────────────────────────────────

// Division formation dates can predate WW2 by decades (Reichswehr-era units),
// so we allow a much wider range than the WW2Event date filter.
function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/([+-]?\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const year = parseInt(m[1], 10);
  if (year < 1900 || year > 1950) return undefined;
  const month = m[2] === "00" ? "01" : m[2];
  const day = m[3] === "00" ? "01" : m[3];
  return `${String(year).padStart(4, "0")}-${month}-${day}`;
}

// ── Division filter ───────────────────────────────────────────────────────────
//
// The list page links to far more than division articles: unit-type/branch
// concept pages (e.g. "Panzer division", "Luftwaffe Field Division"), generic
// military terms, corps/brigades/regiments, lists, people, and places. We
// filter those out so divisions.json contains only actual division entities.

// Wikidata P31 (instance of) labels that signal "not a specific division" —
// abstract classifications, branches, terms, people, places, lists, etc.
const NON_DIVISION_TYPES = new Set([
  "wikimedia list article",
  "term",
  "specialized term",
  "military term",
  "abbreviation",
  "human",
  "historical period",
  "world war",
  "war",
  "war front",
  "armed forces",
  "military branch",
  "branch of service",
  "navy",
  "air force",
  "army",
  "military organization",
  "organization",
  "military profession",
  "profession",
  "occupation",
  "military rank",
  "weapon type",
  "vehicle functional class",
  "artillery family",
  "iso standard",
  "publication identifier",
  "word",
  "board wargame",
  "board game publishing company",
  "sequence",
  "aspect of history",
  "activity",
  "historical country",
  "city-state",
  "metropolis",
  "federal capital",
  "hanseatic city",
  "federated state of germany",
  "seat of government",
  "unitary municipality in germany",
  "urban municipality in germany",
  "largest city",
  "town divided by border",
  "independent city in berlin",
  // "class of unit" meta-types — these describe what KIND of classifier an
  // entity is, and are themselves the P31 value of real division instances
  // (e.g. "Panzer division" classifies "10th Panzer Division"), not divisions.
  "military unit size class",
  "military unit type-size class",
  "military unit branch-size class",
  "military unit branch-type-size class",
  "military unit type class",
]);

/**
 * True if `d` looks like an actual division entity rather than a unit-type
 * concept, branch, term, list, person, or place that the cross-reference
 * picked up incidentally.
 */
function isDivision(d: ParsedDivision, all: ParsedDivision[]): boolean {
  if (!d.type) return false;
  const type = d.type.toLowerCase();
  if (NON_DIVISION_TYPES.has(type)) return false;

  // Drop entities whose own name matches a P31/P361 label seen elsewhere —
  // those are the unit-type/branch concept articles themselves
  // (e.g. "Panzer division", "Security Division", "Wehrmacht").
  const name = d.label.toLowerCase();
  for (const other of all) {
    if (other.type?.toLowerCase() === name) return false;
    if (other.branch?.toLowerCase() === name) return false;
  }

  // Require "division" in the name or Wikidata's own type label —
  // excludes corps, brigades, regiments, special-forces units, and concepts
  // that are real military formations but not divisions.
  if (!/division/i.test(d.label) && !/division/i.test(d.type)) return false;

  return true;
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
  console.log(`Cross-referencing "${DIVISION_LIST_PAGE}"…`);
  const titles = await fetchListedDivisionTitles();
  console.log(`  ${titles.length} linked articles`);
  const qids = await resolveTitlesToQids(titles);
  console.log(`  ${qids.length} resolved to Wikidata items`);

  console.log("Querying Wikidata for division facts…");
  const rows = await fetchDivisionRows(qids);
  console.log(`  ${rows.length} rows`);

  // Deduplicate by QID — a unit can have multiple sitelinks/labels match.
  const byQid = new Map<string, DivisionBinding>();
  for (const row of rows) {
    const qid = row.item.value.split("/").pop()!;
    if (!byQid.has(qid)) byQid.set(qid, row);
  }
  console.log(`After dedup: ${byQid.size} unique divisions`);

  // Parse — drop anything missing a usable label
  const candidates: ParsedDivision[] = [];
  for (const [qid, row] of byQid) {
    const label = row.itemLabel?.value;
    if (!label || /^Q\d+$/.test(label)) continue;

    candidates.push({
      qid,
      label,
      type: row.typeLabel?.value,
      branch: row.branchLabel?.value,
      formed: parseDate(row.inception?.value),
      disbanded: parseDate(row.dissolved?.value),
      wpTitle: row.wpTitle?.value,
    });
  }

  const parsed = candidates.filter((d) => isDivision(d, candidates));
  console.log(
    `After filtering non-divisions: ${parsed.length} (dropped ${candidates.length - parsed.length} terms/lists/branches/people/etc.)`,
  );

  parsed.sort((a, b) => a.label.localeCompare(b.label));
  console.log(`After filtering: ${parsed.length} divisions with a label`);

  if (DRY_RUN) {
    for (const d of parsed.slice(0, 20)) {
      console.log(
        `  ${d.label.padEnd(40)} type: ${(d.type ?? "—").padEnd(28)} branch: ${d.branch ?? "—"}  ${d.formed ?? "?"}–${d.disbanded ?? "?"}`,
      );
    }
    console.log(`Total: ${parsed.length} divisions. No file written (--dry-run).`);
    return;
  }

  // Wikipedia summaries — cache-first, batch-fetch only what's missing
  const cache = loadCache();
  const needed = parsed.filter(
    (d) => d.wpTitle !== undefined && !cache[d.wpTitle],
  );
  console.log(
    `\nWikipedia: ${Object.keys(cache).length} cached, ${needed.length} to fetch…`,
  );

  const BATCH = 10;
  let fetched = 0;
  for (let i = 0; i < needed.length; i += BATCH) {
    const batch = needed.slice(i, i + BATCH);
    const entries = await Promise.all(
      batch.map((d) => fetchWpSummary(d.wpTitle!)),
    );
    batch.forEach((d, j) => {
      if (entries[j]) cache[d.wpTitle!] = entries[j]!;
    });
    fetched += batch.length;
    process.stdout.write(`\r  ${fetched}/${needed.length}`);
    if (i + BATCH < needed.length) await sleep(500);
  }
  if (needed.length > 0) {
    console.log();
    saveCache(cache);
  }

  // Assign stable IDs — append QID only on slug collision
  const slugCount = parsed.reduce<Record<string, number>>((acc, d) => {
    const s = toSlug(d.label);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const divisions: Division[] = parsed.map((d): Division => {
    const baseSlug = toSlug(d.label);
    const id =
      slugCount[baseSlug] > 1 ? `${baseSlug}-${d.qid.toLowerCase()}` : baseSlug;
    const wp = d.wpTitle ? (cache[d.wpTitle] ?? null) : null;

    return {
      id,
      name: d.label,
      qid: d.qid,
      country: "germany",
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.branch !== undefined ? { branch: d.branch } : {}),
      ...(d.formed !== undefined ? { formed: d.formed } : {}),
      ...(d.disbanded !== undefined ? { disbanded: d.disbanded } : {}),
      article: wp?.article ?? "",
      links: d.wpTitle
        ? [
            {
              label: `Wikipedia: ${d.label}`,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(d.wpTitle.replace(/ /g, "_"))}`,
            },
          ]
        : [],
    };
  });

  if (divisions.length === 0) {
    console.error("No divisions produced — keeping existing divisions.json.");
    process.exit(1);
  }

  console.log(`Writing ${divisions.length} divisions → ${OUT_PATH}`);
  writeFileSync(OUT_PATH, JSON.stringify(divisions, null, 2));
  console.log("Done.");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
