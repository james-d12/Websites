#!/usr/bin/env tsx
/**
 * Cross-references Wikipedia's hand-curated "List of World War II battles"
 * against the SPARQL/Wikidata-driven events.json + unknowns.json, to find
 * battles the page links to that the current pipeline doesn't surface at
 * all (as opposed to ones it surfaced but parked in unknowns.json for
 * lacking a usable summary).
 *
 * Usage:
 *   tsx src/etl/wikipedia/missing.ts
 */
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WW2Event } from "../../types/events.ts";
import { fetchBattleList, BATTLE_LIST_PAGE } from "./battle-list.ts";
import type { BattleListEntry } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = join(__dirname, "../../data/events.json");
const UNKNOWNS_PATH = join(__dirname, "../../data/unknowns.json");
const OUT_PATH = join(__dirname, "missing-battles.json");

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

async function main(): Promise<void> {
  console.log(`Fetching "${BATTLE_LIST_PAGE}"…`);
  const battles = await fetchBattleList();
  console.log(`Page lists ${battles.length} unique battles`);

  const events = JSON.parse(readFileSync(EVENTS_PATH, "utf8")) as WW2Event[];
  const unknowns = JSON.parse(
    readFileSync(UNKNOWNS_PATH, "utf8"),
  ) as WW2Event[];
  const known = articleTitlesOf([...events, ...unknowns]);
  console.log(
    `events.json (${events.length}) + unknowns.json (${unknowns.length}) reference ${known.size} Wikipedia articles\n`,
  );

  const missing = battles.filter((b) => !known.has(b.title));
  console.log(
    `${missing.length} listed battles have no matching event at all:\n`,
  );

  const byFront = new Map<string, BattleListEntry[]>();
  for (const b of missing) {
    const key = b.front?.display ?? "(no front)";
    const list = byFront.get(key) ?? [];
    list.push(b);
    byFront.set(key, list);
  }
  for (const [front, list] of [...byFront].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`  ${String(list.length).padStart(4)}  ${front}`);
  }

  writeFileSync(OUT_PATH, JSON.stringify(missing, null, 2));
  console.log(`\nWrote ${missing.length} missing battles → ${OUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
