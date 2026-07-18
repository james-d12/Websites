/** A wikilink as it appears in the list page (target article + display text). */
export interface WikiLink {
  /** Wikipedia article title (link target, e.g. "Battle of Westerplatte"). */
  title: string;
  /** Display text as shown on the page (e.g. "Westerplatte"). */
  display: string;
}

/** A battle article linked from the "Battle" column of the list page's tables. */
export interface BattleListEntry extends WikiLink {
  /**
   * The front/theatre this battle is grouped under in the page's "Theatre"
   * column (e.g. "Western Front", "Pacific Front") — the page's own
   * historical-front categorisation, distinct from the geographic
   * continent that `inferTheater()` derives from coordinates.
   */
  front?: WikiLink;
  /** Start/end dates straight from the page's own "Start"/"End" columns. */
  date?: string;
  endDate?: string;
}
