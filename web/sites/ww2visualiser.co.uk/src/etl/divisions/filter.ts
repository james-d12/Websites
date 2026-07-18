import type { ParsedDivision } from "./types.ts";

// The list page links to far more than division articles: unit-type/branch
// concept pages (e.g. "Panzer division", "Luftwaffe Field Division"), generic
// military terms, corps/brigades/regiments, lists, people, and places. We
// filter those out so divisions.json contains only actual division entities.

// Wikidata P31 (instance of) labels that signal "not a specific division" —
// abstract classifications, branches, terms, people, places, lists, etc.
const NON_DIVISION_TYPES = new Set([
  "wikimedia list article",
  "term",
  "specialized term",
  "military term",
  "abbreviation",
  "human",
  "historical period",
  "world war",
  "war",
  "war front",
  "armed forces",
  "military branch",
  "branch of service",
  "navy",
  "air force",
  "army",
  "military organization",
  "organization",
  "military profession",
  "profession",
  "occupation",
  "military rank",
  "weapon type",
  "vehicle functional class",
  "artillery family",
  "iso standard",
  "publication identifier",
  "word",
  "board wargame",
  "board game publishing company",
  "sequence",
  "aspect of history",
  "activity",
  "historical country",
  "city-state",
  "metropolis",
  "federal capital",
  "hanseatic city",
  "federated state of germany",
  "seat of government",
  "unitary municipality in germany",
  "urban municipality in germany",
  "largest city",
  "town divided by border",
  "independent city in berlin",
  // "class of unit" meta-types — these describe what KIND of classifier an
  // entity is, and are themselves the P31 value of real division instances
  // (e.g. "Panzer division" classifies "10th Panzer Division"), not divisions.
  "military unit size class",
  "military unit type-size class",
  "military unit branch-size class",
  "military unit branch-type-size class",
  "military unit type class",
]);

/**
 * True if `d` looks like an actual division entity rather than a unit-type
 * concept, branch, term, list, person, or place that the cross-reference
 * picked up incidentally.
 */
export function isDivision(d: ParsedDivision, all: ParsedDivision[]): boolean {
  if (!d.type) return false;
  const type = d.type.toLowerCase();
  if (NON_DIVISION_TYPES.has(type)) return false;

  // Drop entities whose own name matches a P31/P361 label seen elsewhere —
  // those are the unit-type/branch concept articles themselves
  // (e.g. "Panzer division", "Security Division", "Wehrmacht").
  const name = d.label.toLowerCase();
  for (const other of all) {
    if (other.type?.toLowerCase() === name) return false;
    if (other.branch?.toLowerCase() === name) return false;
  }

  // Require "division" in the name or Wikidata's own type label —
  // excludes corps, brigades, regiments, special-forces units, and concepts
  // that are real military formations but not divisions.
  if (!/division/i.test(d.label) && !/division/i.test(d.type)) return false;

  return true;
}
