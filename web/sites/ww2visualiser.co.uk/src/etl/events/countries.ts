import type { Country } from "../../types/events.ts";
import type { EventSides } from "./types.ts";

// Maps Wikidata country QIDs to our Country type.
// Both modern-state QIDs (Q183 Germany) and WW2-era state QIDs (Q7318 Nazi Germany)
// are included since Wikidata uses both inconsistently.
export const COUNTRY_QID_TO_COUNTRY: Partial<Record<string, Country>> = {
  // Germany — P710 uses both Q7318 (Nazi Germany) and Q1206012 (German Reich)
  // depending on which editor wrote the Wikidata item (verified via live query)
  Q183: "germany", // Germany (general/modern)
  Q7318: "germany", // Nazi Germany
  Q1206012: "germany", // German Reich (used directly as P710 on e.g. Battle of Stalingrad)
  Q43287: "germany", // Third Reich (alt)
  Q202215: "germany", // German Reich (alt)
  Q40: "germany", // Austria (under Anschluss — acts as part of Germany militarily)
  // Soviet Union — Q15180 is what Wikidata actually returns on battles (verified)
  Q15180: "ussr",
  Q34266: "ussr", // alt, kept for safety
  // United Kingdom
  Q145: "uk",
  Q174193: "uk", // United Kingdom of Great Britain (historical alt)
  // Commonwealth — tracked individually
  Q16: "canada",
  Q408: "australia",
  Q664: "new_zealand",
  Q668: "india", // British India
  // United States
  Q30: "usa",
  // Italy — historical state QIDs verified from Battle of Stalingrad query
  Q38: "italy",
  Q172579: "italy", // Kingdom of Italy (WW2-era QID used in battles)
  Q6764: "italy", // Kingdom of Italy (alt)
  Q45095: "italy", // Italian Social Republic
  // Japan
  Q17: "japan",
  Q16849950: "japan", // Empire of Japan
  // France — Free France vs Vichy tracked separately
  Q142: "france",
  Q235547: "france", // Free France
  Q34981: "vichy_france", // Vichy France (Axis-aligned)
  // Allied nations — individual countries, not lumped together
  Q36: "poland",
  Q55: "netherlands",
  Q29999: "netherlands", // Kingdom of the Netherlands (P17 of Q55)
  Q31: "belgium",
  Q20: "norway",
  Q35: "denmark",
  Q756617: "denmark", // Kingdom of Denmark (P17 of Q35)
  Q191: "estonia",
  Q211: "latvia",
  Q37: "lithuania",
  Q41: "greece",
  Q148: "china",
  Q865: "china", // Republic of China
  Q83286: "yugoslavia", // Kingdom of Yugoslavia
  Q36704: "yugoslavia", // Yugoslavia (general)
  // Axis allies — individual countries
  Q218: "romania",
  Q203493: "romania", // Kingdom of Romania (WW2-era QID)
  Q28: "hungary",
  Q600018: "hungary", // Kingdom of Hungary (WW2-era QID)
  Q214: "slovakia",
  Q153128: "croatia", // Independent State of Croatia
  Q33: "finland",
  Q797278: "finland", // Finland (WW2-era alt)
  Q222: "albania",
  Q13474305: "spain", // Francoist Spain
};

const ALLIED_COUNTRIES = new Set<Country>([
  "uk",
  "usa",
  "ussr",
  "france",
  "canada",
  "australia",
  "new_zealand",
  "india",
  "poland",
  "netherlands",
  "belgium",
  "norway",
  "denmark",
  "greece",
  "china",
  "estonia",
  "latvia",
  "lithuania",
  "yugoslavia",
]);
const AXIS_COUNTRIES = new Set<Country>([
  "germany",
  "italy",
  "japan",
  "romania",
  "hungary",
  "slovakia",
  "croatia",
  "vichy_france",
  "finland",
  "albania",
  "spain",
]);

export function mapSides(countryQIDs: Iterable<string>): EventSides | undefined {
  const allied = new Set<Country>();
  const axis = new Set<Country>();
  for (const qid of countryQIDs) {
    const c = COUNTRY_QID_TO_COUNTRY[qid];
    if (!c) continue;
    if (ALLIED_COUNTRIES.has(c)) allied.add(c);
    else if (AXIS_COUNTRIES.has(c)) axis.add(c);
  }
  if (allied.size === 0 && axis.size === 0) return undefined;
  return {
    allied: [...allied].slice(0, 6),
    axis: [...axis].slice(0, 6),
  };
}
