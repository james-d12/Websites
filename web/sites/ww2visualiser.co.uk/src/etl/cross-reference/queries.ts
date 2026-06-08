/**
 * P607 ("conflict" / "participated in conflict") is how Wikidata links a
 * military unit to the specific battles/operations it fought in — e.g.
 * "10th Panzer Division" -> "Battle of Hürtgen Forest". Almost every unit
 * also links to "World War II" itself via this property, but that QID won't
 * appear in our events dataset (it's the war, not a battle), so it's filtered
 * out naturally by the QID intersection rather than needing an explicit FILTER.
 */
export function divisionConflictsQuery(qids: string[]): string {
  return `
    SELECT ?item ?event WHERE {
      VALUES ?item { ${qids.map((q) => `wd:${q}`).join(" ")} }
      ?item wdt:P607 ?event.
    }`;
}
