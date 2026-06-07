// Division formation dates can predate WW2 by decades (Reichswehr-era units),
// so we allow a much wider range than the WW2Event date filter.
export function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/([+-]?\d{4})-(\d{2})-(\d{2})/);
  if (!m) return undefined;
  const year = parseInt(m[1], 10);
  if (year < 1900 || year > 1950) return undefined;
  const month = m[2] === "00" ? "01" : m[2];
  const day = m[3] === "00" ? "01" : m[3];
  return `${String(year).padStart(4, "0")}-${month}-${day}`;
}
