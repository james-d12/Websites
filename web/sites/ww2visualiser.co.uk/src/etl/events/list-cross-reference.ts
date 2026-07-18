import { fetchRowsByQid } from "../lib/sparql.ts";
import { fetchLinkedTitles, resolveTitlesToQids } from "../lib/wikipedia.ts";
import { BATTLE_LIST_PAGE, listBattlesQuery } from "./queries.ts";
import type { SparqlBinding } from "./types.ts";

/**
 * Resolves Wikipedia's hand-curated "List of World War II battles" article to
 * Wikidata rows, so battles that the type-based SPARQL queries miss (due to
 * inconsistent Wikidata typing/tagging) still go through the same
 * coords/date/combatant enrichment as everything else.
 */
export async function fetchListBattleRows(): Promise<SparqlBinding[]> {
  console.log(`Cross-referencing "${BATTLE_LIST_PAGE}"…`);
  const titles = await fetchLinkedTitles(BATTLE_LIST_PAGE);
  console.log(`  ${titles.length} linked articles`);
  const qids = await resolveTitlesToQids(titles);
  console.log(`  ${qids.length} resolved to Wikidata items`);
  const rows = await fetchRowsByQid<SparqlBinding>(
    "list-battles",
    qids,
    listBattlesQuery,
  );
  console.log(`  [list-battles] ${rows.length} rows`);
  return rows;
}
