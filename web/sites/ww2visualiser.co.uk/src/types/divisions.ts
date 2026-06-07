import type { Country } from "./events.ts";

export interface Division {
  id: string;
  name: string;
  qid: string;
  country: Country;
  /** Wikidata P31 label, e.g. "Wehrmacht infantry division", "Panzer division". */
  type?: string;
  /** Wikidata P361 (part of) label, e.g. "German Army", "Waffen-SS", "Luftwaffe". */
  branch?: string;
  formed?: string; // ISO date YYYY-MM-DD
  disbanded?: string; // ISO date YYYY-MM-DD
  article: string;
  links: { label: string; url: string }[];
}
