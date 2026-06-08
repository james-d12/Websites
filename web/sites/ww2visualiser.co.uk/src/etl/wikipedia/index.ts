#!/usr/bin/env tsx
/**
 * Parses Wikipedia's hand-curated "List of World War II battles" page
 * directly — rather than via Wikidata cross-referencing — to get the
 * authoritative set of battle articles it links to. First step towards
 * checking whether the current SPARQL-driven events.json is missing any.
 *
 * Usage:
 *   tsx src/etl/wikipedia/index.ts
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchBattleList, BATTLE_LIST_PAGE } from "./battle-list.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "battle-list.json");

async function main(): Promise<void> {
  console.log(`Fetching "${BATTLE_LIST_PAGE}"…`);
  const battles = await fetchBattleList();
  console.log(`Found ${battles.length} unique battles`);

  const fronts = new Map<string, number>();
  for (const b of battles) {
    const key = b.front?.display ?? "(none)";
    fronts.set(key, (fronts.get(key) ?? 0) + 1);
  }
  console.log(`\nFronts (${fronts.size}):`);
  for (const [front, count] of [...fronts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${front}`);
  }

  writeFileSync(OUT_PATH, JSON.stringify(battles, null, 2));
  console.log(`\nWrote ${battles.length} entries → ${OUT_PATH}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
