import { fetchWikitext } from "./fetch.ts";
import { parseBattleList } from "./parse-battle-list.ts";
import type { BattleListEntry } from "./types.ts";

export const BATTLE_LIST_PAGE = "List of World War II battles";

/** Fetches and parses the page's hand-curated battle list (see parse-battle-list.ts). */
export async function fetchBattleList(): Promise<BattleListEntry[]> {
  const wikitext = await fetchWikitext(BATTLE_LIST_PAGE);
  return parseBattleList(wikitext);
}
