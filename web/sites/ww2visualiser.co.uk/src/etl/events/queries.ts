import { WP_OPTIONAL } from "../lib/wikipedia.ts";
import type { QuerySpec } from "./types.ts";

export const BATTLE_LIST_PAGE = "List of World War II battles";

const WW2_START = '"1939-09-01"^^xsd:dateTime';
const WW2_END = '"1945-09-02"^^xsd:dateTime';

const DATE_OPTIONALS = `
  OPTIONAL { ?item wdt:P580 ?startTime.   }
  OPTIONAL { ?item wdt:P582 ?endTime.     }
  OPTIONAL { ?item wdt:P585 ?pointInTime. }`;

const DATE_FILTER = `
  BIND(COALESCE(?startTime, ?pointInTime) AS ?eventDate)
  FILTER(BOUND(?eventDate))
  FILTER(?eventDate >= ${WW2_START} && ?eventDate <= ${WW2_END})`;

// Adds one row per combatant. Wikidata P710 can point to either a modern country
// (e.g. Q36 Poland) or a historical-state entity (e.g. Q1206012 German Reich).
// Historical states sometimes lack P17, so we COALESCE: if P17 exists use that
// country, otherwise treat the participant itself as the country entity.
const COMBATANT_OPTIONAL = `
  OPTIONAL {
    ?item wdt:P710 ?participant.
    OPTIONAL { ?participant wdt:P17 ?participantCountry. }
    BIND(COALESCE(?participantCountry, ?participant) AS ?effectiveCountry)
    BIND(STRAFTER(STR(?effectiveCountry), "http://www.wikidata.org/entity/") AS ?countryQID)
  }`;

export const QUERIES: QuerySpec[] = [
  // ── Land battles, sieges, military offensives ──────────────────────────────
  // Q178561 battle · Q15275719 military operation · Q188055 offensive
  // Q890701 siege · Q180684 conflict · Q3272563 airborne operation
  // Q2001676 military operation (alt) · Q831663 military campaign
  {
    key: "battle",
    category: "battle",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 ?t; wdt:P625 ?coords.
        VALUES ?t { wd:Q178561 wd:Q15275719 wd:Q188055 wd:Q890701 wd:Q180684 wd:Q3272563 wd:Q2001676 wd:Q831663 }
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Explicitly tagged as "part of WW2" — battle subclasses ────────────────
  // Uses P279* subclass traversal scoped to the ~10k WW2-tagged items so it
  // catches any battle-subtype (amphibious assault, airborne op, raid, etc.)
  // that editors tagged with P361=Q362 but typed with an uncommon P31 value.
  {
    key: "ww2-battle-tagged",
    category: "battle",
    dateFallback: true,
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P361 wd:Q362; wdt:P625 ?coords.
        ?item wdt:P31/wdt:P279* wd:Q178561.
        ${DATE_OPTIONALS}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Naval engagements — direct type + WW2-tagged subclasses ───────────────
  {
    key: "naval",
    category: "naval",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 wd:Q1261499; wdt:P625 ?coords.
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  {
    key: "ww2-naval-tagged",
    category: "naval",
    dateFallback: true,
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P361 wd:Q362; wdt:P625 ?coords.
        ?item wdt:P31/wdt:P279* wd:Q1261499.
        ${DATE_OPTIONALS}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Air campaigns and aerial bombings ─────────────────────────────────────
  {
    key: "air",
    category: "air",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 ?t; wdt:P625 ?coords.
        VALUES ?t { wd:Q189760 wd:Q4688003 }
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Diplomatic conferences, treaties, armistices ───────────────────────────
  {
    key: "political",
    category: "political",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
        ?item wdt:P31 ?t.
        VALUES ?t { wd:Q625994 wd:Q15279819 wd:Q1307987 wd:Q7432 }
        OPTIONAL { ?item wdt:P625 ?directCoords.       }
        OPTIONAL { ?item wdt:P276/wdt:P625 ?locCoords. }
        BIND(COALESCE(?directCoords, ?locCoords) AS ?coords)
        FILTER(BOUND(?coords))
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        ${COMBATANT_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Massacres ──────────────────────────────────────────────────────────────
  {
    key: "massacre",
    category: "atrocity",
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle WHERE {
        ?item wdt:P31 wd:Q3199915; wdt:P625 ?coords.
        ${DATE_OPTIONALS}
        ${DATE_FILTER}
        ${WP_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },

  // ── Concentration & extermination camps ───────────────────────────────────
  {
    key: "camp",
    category: "atrocity",
    dateFallback: true,
    query: `
      SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?inception ?coords ?wpTitle WHERE {
        ?item wdt:P31 ?t; wdt:P625 ?coords.
        VALUES ?t { wd:Q328468 wd:Q153813 }
        OPTIONAL { ?item wdt:P580 ?startTime. }
        OPTIONAL { ?item wdt:P582 ?endTime.   }
        OPTIONAL { ?item wdt:P571 ?inception. }
        ${WP_OPTIONAL}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }`,
  },
];

// ── "List of World War II battles" cross-reference ───────────────────────────
//
// The type-based SPARQL queries above miss battles that Wikidata editors typed
// or tagged inconsistently. Wikipedia's "List of World War II battles" article
// is hand-curated and links to (almost) every battle article, so we resolve
// each linked article to its Wikidata QID via the Wikipedia API, then pull
// those QIDs through Wikidata (via SPARQL VALUES) so they go through the same
// coords/date/combatant enrichment as everything else.

// Wikipedia's battle list links to plenty of non-battle articles too (places,
// units, leaders, occupied territories…). Restrict to the same battle/naval/air
// conflict types the rest of the pipeline recognises (transitively via P279*)
// so things like "Guangzhouwan" — a leased territory with coordinates — don't
// slip in as a "battle" via the WW2-start date fallback.
const BATTLE_LIKE_TYPES = `
  wd:Q178561 wd:Q15275719 wd:Q188055 wd:Q890701 wd:Q180684 wd:Q3272563 wd:Q2001676 wd:Q831663
  wd:Q1261499
  wd:Q189760 wd:Q4688003`;

export function listBattlesQuery(qids: string[]): string {
  return `
    SELECT DISTINCT ?item ?itemLabel ?startTime ?endTime ?pointInTime ?coords ?wpTitle ?countryQID WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
      ?item wdt:P31/wdt:P279* ?broadType; wdt:P625 ?coords.
      VALUES ?broadType { ${BATTLE_LIKE_TYPES} }
      ${DATE_OPTIONALS}
      ${WP_OPTIONAL}
      ${COMBATANT_OPTIONAL}
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`;
}
