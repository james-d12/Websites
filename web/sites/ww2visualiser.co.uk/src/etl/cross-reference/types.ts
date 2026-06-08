import type { SparqlValue } from "../lib/sparql.ts";

/** One (division, conflict) row from the P607 "participated in conflict" query. */
export interface ParticipationBinding {
  item: SparqlValue;
  event: SparqlValue;
}
