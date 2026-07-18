import { parseWikiTables } from "./parse-wikitable.ts";
import { parseTableDate } from "./dates.ts";
import type { BattleListEntry, WikiLink } from "./types.ts";

const LINK_RE = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g;

function links(cell: string | undefined): WikiLink[] {
  if (!cell) return [];
  return [...cell.matchAll(LINK_RE)].map(([, target, display]) => ({
    title: target.trim(),
    display: (display ?? target).trim(),
  }));
}

/**
 * Parses the wikitext of "List of World War II battles" into the set of
 * unique battle articles linked from the "Battle" column of every row,
 * each tagged with the front/theatre it's grouped under in the "Theatre"
 * column. This is the page's hand-curated ground truth — distinct from
 * (and more complete than) the Wikidata-typed queries, which miss battles
 * with inconsistent typing.
 */
export function parseBattleList(wikitext: string): BattleListEntry[] {
  const seen = new Map<string, BattleListEntry>();
  for (const row of parseWikiTables(wikitext)) {
    const front = links(row["Theatre"])[0];
    const date = parseTableDate(row["Start"]);
    const endDate = parseTableDate(row["End"]) ?? date;
    for (const battle of links(row["Battle"])) {
      if (!seen.has(battle.title)) {
        seen.set(battle.title, {
          ...battle,
          front,
          ...(date ? { date } : {}),
          ...(endDate && endDate !== date ? { endDate } : {}),
        });
      }
    }
  }
  return [...seen.values()];
}
