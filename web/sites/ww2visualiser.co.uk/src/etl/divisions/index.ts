import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Division } from "../../types/divisions.ts";
import { fetchRowsByQid } from "../lib/sparql.ts";
import { fetchLinkedTitles, resolveTitlesToQids } from "../lib/wikipedia.ts";
import { loadCache } from "../lib/cache.ts";
import { fetchMissingSummaries } from "../lib/enrich.ts";
import { assignSlugIds } from "../lib/slug.ts";
import { DIVISION_LIST_PAGE, divisionsQuery } from "./queries.ts";
import { isDivision } from "./filter.ts";
import { parseDate } from "./dates.ts";
import type { DivisionBinding, ParsedDivision } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../../data/divisions.json");

/**
 * Resolves Wikipedia's "List of German divisions in World War II" — which has
 * no infobox/table data, just bulleted wikilinks — to Wikidata QIDs, then
 * pulls basic facts (type, branch, formed/disbanded dates) for those QIDs.
 */
async function collectRows(): Promise<DivisionBinding[]> {
  console.log(`Cross-referencing "${DIVISION_LIST_PAGE}"…`);
  const titles = await fetchLinkedTitles(DIVISION_LIST_PAGE);
  console.log(`  ${titles.length} linked articles`);
  const qids = await resolveTitlesToQids(titles);
  console.log(`  ${qids.length} resolved to Wikidata items`);

  console.log("Querying Wikidata for division facts…");
  const rows = await fetchRowsByQid<DivisionBinding>("divisions", qids, divisionsQuery);
  console.log(`  ${rows.length} rows`);
  return rows;
}

/** Deduplicates by QID — a unit can have multiple sitelinks/labels match. */
function dedupe(rows: DivisionBinding[]): Map<string, DivisionBinding> {
  const byQid = new Map<string, DivisionBinding>();
  for (const row of rows) {
    const qid = row.item.value.split("/").pop()!;
    if (!byQid.has(qid)) byQid.set(qid, row);
  }
  return byQid;
}

/** Parses rows into divisions, dropping anything missing a usable label or failing the division filter. */
function parseDivisions(byQid: Map<string, DivisionBinding>): ParsedDivision[] {
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
  return parsed;
}

function toDivisions(
  parsed: ParsedDivision[],
  cache: Record<string, { summary: string; article: string }>,
): Division[] {
  const ids = assignSlugIds(parsed);
  return parsed.map((d, i): Division => {
    const wp = d.wpTitle ? (cache[d.wpTitle] ?? null) : null;
    return {
      id: ids[i],
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
}

export async function fetchDivisions(dryRun: boolean): Promise<void> {
  const rows = await collectRows();
  const byQid = dedupe(rows);
  console.log(`After dedup: ${byQid.size} unique divisions`);

  const parsed = parseDivisions(byQid);
  console.log(`After filtering: ${parsed.length} divisions with a label`);

  if (dryRun) {
    for (const d of parsed.slice(0, 20)) {
      console.log(
        `  ${d.label.padEnd(40)} type: ${(d.type ?? "—").padEnd(28)} branch: ${d.branch ?? "—"}  ${d.formed ?? "?"}–${d.disbanded ?? "?"}`,
      );
    }
    console.log(`Total: ${parsed.length} divisions. No file written (--dry-run).`);
    return;
  }

  const cache = loadCache();
  await fetchMissingSummaries(parsed, cache);

  const divisions = toDivisions(parsed, cache);

  if (divisions.length === 0) {
    console.error("No divisions produced — keeping existing divisions.json.");
    process.exit(1);
  }

  console.log(`Writing ${divisions.length} divisions → ${OUT_PATH}`);
  writeFileSync(OUT_PATH, JSON.stringify(divisions, null, 2));
  console.log("Done.");
}
