import divisionsData from "../data/divisions.json";
import eventsData from "../data/events.json";
import type { Division } from "../types/divisions";
import type { WW2Event } from "../types/events";

const divisions = divisionsData as Division[];
const events = eventsData as WW2Event[];

const divisionById = new Map(divisions.map((d) => [d.id, d]));

const eventsByDivisionId = new Map<string, WW2Event[]>();
for (const event of events) {
  for (const divisionId of event.divisionIds ?? []) {
    const list = eventsByDivisionId.get(divisionId);
    if (list) list.push(event);
    else eventsByDivisionId.set(divisionId, [event]);
  }
}

/** Divisions known to have fought in the given event (via Wikidata P607). */
export function divisionsForEvent(event: WW2Event): Division[] {
  return (event.divisionIds ?? [])
    .map((id) => divisionById.get(id))
    .filter((d): d is Division => d !== undefined);
}

/** Events a division is known to have fought in, in chronological order. */
export function eventsForDivision(division: Division): WW2Event[] {
  return eventsByDivisionId.get(division.id) ?? [];
}
