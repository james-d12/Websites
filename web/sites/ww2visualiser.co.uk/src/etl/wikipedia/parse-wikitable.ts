/** A table row, keyed by column header, holding each cell's raw wikitext. */
export type WikiTableRow = Record<string, string | undefined>;

const TABLE_RE = /\{\|.*?\n\|\}/gs;
const ROW_RE = /\n\|-\n(.*?)(?=\n\|-|\n\|\})/gs;
const HEADER_BLOCK_RE = /\n((?:!.*\n?)+)/;
const CELL_LINE_RE = /^\|(?![-}])/;
const ATTR_PREFIX_RE = /^((?:\s*[a-zA-Z-]+\s*=\s*"[^"]*")+)\s*\|(.*)/s;

interface ParsedCell {
  text: string;
  rowspan: number;
  colspan: number;
}

function parseCell(line: string): ParsedCell {
  const content = line.replace(/^\|/, "");
  const attrMatch = content.match(ATTR_PREFIX_RE);
  if (!attrMatch) return { text: content.trim(), rowspan: 1, colspan: 1 };
  const [, attrs, rest] = attrMatch;
  const rowspan = Number(attrs.match(/rowspan\s*=\s*"(\d+)"/)?.[1] ?? 1);
  const colspan = Number(attrs.match(/colspan\s*=\s*"(\d+)"/)?.[1] ?? 1);
  return { text: rest.trim(), rowspan, colspan };
}

function parseHeaders(table: string): string[] {
  const block = table.match(HEADER_BLOCK_RE)?.[1];
  if (!block) return [];
  return block
    .split("\n")
    .flatMap((line) => line.split("!!"))
    .map((h) => h.replace(/^!/, "").trim())
    .filter(Boolean);
}

/**
 * Parses MediaWiki wikitables into rows keyed by column header, resolving
 * rowspan/colspan so each row carries the value that visually applies to it
 * — mirroring how the rendered table reads, since the raw wikitext omits
 * cells that a previous row's rowspan already covers.
 */
export function parseWikiTables(wikitext: string): WikiTableRow[] {
  const rows: WikiTableRow[] = [];
  for (const [table] of wikitext.matchAll(TABLE_RE)) {
    const columns = parseHeaders(table);
    if (columns.length === 0) continue;

    const pending = new Map<number, { text: string; remaining: number }>();
    for (const [, rowText] of table.matchAll(ROW_RE)) {
      const cellLines = rowText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => CELL_LINE_RE.test(l));

      const values: (string | undefined)[] = new Array(columns.length);
      for (const [col, entry] of pending) {
        values[col] = entry.text;
        if (--entry.remaining === 0) pending.delete(col);
      }

      let cellIndex = 0;
      for (let col = 0; col < columns.length; col++) {
        if (values[col] !== undefined) continue;
        if (cellIndex >= cellLines.length) break;
        const { text, rowspan, colspan } = parseCell(cellLines[cellIndex++]);
        for (
          let offset = 0;
          offset < colspan && col + offset < columns.length;
          offset++
        ) {
          values[col + offset] = text;
          if (rowspan > 1) {
            pending.set(col + offset, { text, remaining: rowspan - 1 });
          }
        }
        col += colspan - 1;
      }

      const row: WikiTableRow = {};
      columns.forEach((name, i) => (row[name] = values[i]));
      rows.push(row);
    }
  }
  return rows;
}
