import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WW2Event } from "../../types/events.ts";
import type { Division } from "../../types/divisions.ts";
import { fetchRowsByQid } from "../lib/sparql.ts";
import { divisionConflictsQuery } from "./queries.ts";
import type { ParticipationBinding } from "./types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = join(__dirname, "../../data/events.json");
const DIVISIONS_PATH = join(__dirname, "../../data/divisions.json");

function qidOf(value: { value: string }): string {
  return value.value.split("/").pop()!;
}

/**
 * Links each division to the events it fought in by querying Wikidata's P607
 * ("participated in conflict") for every division QID, then intersecting the
 * resulting conflict QIDs against the QIDs already present in events.json.
 * Matches are stamped onto events as `divisionIds`; the inverse (which
 * battles a division fought in) is derived at render time from that.
 */
export async function crossReferenceDivisions(dryRun: boolean): Promise<void> {
  const events = JSON.parse(readFileSync(EVENTS_PATH, "utf-8")) as WW2Event[];
  const divisions = JSON.parse(
    readFileSync(DIVISIONS_PATH, "utf-8"),
  ) as Division[];

  const eventIdByQid = new Map(events.map((e) => [e.qid, e.id]));
  const divisionIdByQid = new Map(divisions.map((d) => [d.qid, d.id]));

  console.log(
    `Querying Wikidata for conflicts linked to ${divisions.length} divisions…`,
  );
  const rows = await fetchRowsByQid<ParticipationBinding>(
    "division-conflicts",
    divisions.map((d) => d.qid),
    divisionConflictsQuery,
  );
  console.log(`  ${rows.length} division↔conflict rows`);

  const eventToDivisionIds = new Map<string, Set<string>>();
  for (const row of rows) {
    const eventId = eventIdByQid.get(qidOf(row.event));
    if (!eventId) continue;
    const divisionId = divisionIdByQid.get(qidOf(row.item))!;

    const ids = eventToDivisionIds.get(eventId) ?? new Set();
    ids.add(divisionId);
    eventToDivisionIds.set(eventId, ids);
  }

  const linkCount = [...eventToDivisionIds.values()].reduce(
    (sum, ids) => sum + ids.size,
    0,
  );
  console.log(
    `Matched ${linkCount} division↔event links across ${eventToDivisionIds.size} events`,
  );

  if (dryRun) {
    let shown = 0;
    for (const [eventId, ids] of eventToDivisionIds) {
      if (shown++ >= 15) break;
      console.log(`  ${eventId}: ${[...ids].join(", ")}`);
    }
    console.log("No file written (--dry-run).");
    return;
  }

  const updated = events.map((e): WW2Event => {
    const ids = eventToDivisionIds.get(e.id);
    return ids ? { ...e, divisionIds: [...ids] } : e;
  });

  console.log(`Writing ${linkCount} division links → ${EVENTS_PATH}`);
  writeFileSync(EVENTS_PATH, JSON.stringify(updated, null, 2));
  console.log("Done.");
}
