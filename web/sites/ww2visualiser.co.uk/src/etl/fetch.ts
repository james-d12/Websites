#!/usr/bin/env tsx
/**
 * Fetches WW2 events and German divisions from Wikidata/Wikipedia and writes
 * src/data/events.json and src/data/divisions.json.
 *
 * Usage:
 *   pnpm fetch-data        # fetch and write events.json + divisions.json
 *   pnpm fetch-data:dry    # print counts only, no files written
 */

import { fetchEvents } from "./events/index.ts";
import { fetchDivisions } from "./divisions/index.ts";

const DRY_RUN = process.argv.includes("--dry-run");

async function main(): Promise<void> {
  await fetchEvents(DRY_RUN);
  await fetchDivisions(DRY_RUN);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
