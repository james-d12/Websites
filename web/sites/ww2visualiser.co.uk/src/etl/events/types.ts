import type { EventCategory, Theater, Country } from "../../types/events.ts";
import type { SparqlValue } from "../lib/sparql.ts";
import type { WpEntry } from "../lib/wikipedia.ts";

/** One result row from our SPARQL SELECT queries. */
export interface SparqlBinding {
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

/** The categories our queries produce — a subset of EventCategory. */
export type QueryCategory = Extract<
  EventCategory,
  "battle" | "naval" | "air" | "political" | "atrocity"
>;

/** A single SPARQL query spec — key for logging, category for output mapping. */
export interface QuerySpec {
  key: string;
  category: QueryCategory;
  query: string;
  /** If true, events with no date get a fallback of WW2 start rather than being dropped. */
  dateFallback?: boolean;
}

export interface EventSides {
  allied: Country[];
  axis: Country[];
}

/** Intermediate shape after parsing SPARQL bindings, before Wikipedia enrichment. */
export interface ParsedEvent {
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

export interface EnrichedEvent extends ParsedEvent {
  wp: WpEntry | null;
}
