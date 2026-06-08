const FULL_DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})/;
const MONTH_DATE_RE = /^(\d{4})-(\d{1,2})$/;

/**
 * Parses the list page's own Start/End cell values — mostly ISO
 * `YYYY-MM-DD`, but with stragglers like `YYYY-MM`, `YYYY-M-D`, and
 * `YYYY-MM-DD (local)`. Defaults a missing day to the 1st, mirroring
 * `events/dates.ts`'s handling of imprecise Wikidata dates.
 */
export function parseTableDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim();

  const full = cleaned.match(FULL_DATE_RE);
  if (full) {
    const [, year, month, day] = full;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthOnly = cleaned.match(MONTH_DATE_RE);
  if (monthOnly) {
    const [, year, month] = monthOnly;
    return `${year}-${month.padStart(2, "0")}-01`;
  }

  return undefined;
}
