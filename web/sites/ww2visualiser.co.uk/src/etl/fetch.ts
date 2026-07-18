#!/usr/bin/env tsx
/**
 * Fetches WW2 events and German divisions from Wikidata/Wikipedia, links
 * divisions to the events they fought in, and writes src/data/events.json
 * and src/data/divisions.json.
 *
 * Usage:
 *   pnpm fetch-data        # fetch, cross-reference, and write data files
 *   pnpm fetch-data:dry    # print counts only, no files written
 */

import { fetchEvents } from "./events/index.ts";
import { fetchDivisions } from "./divisions/index.ts";
import { crossReferenceDivisions } from "./cross-reference/index.ts";

const DRY_RUN = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  await fetchEvents(DRY_RUN);
  await fetchDivisions(DRY_RUN);
  await crossReferenceDivisions(DRY_RUN);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
