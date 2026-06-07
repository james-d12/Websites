import { useState, useMemo } from "react";
import divisionsData from "../data/divisions.json";
import type { Division } from "../types/divisions";
import DivisionPanel from "./DivisionPanel";

const divisions = divisionsData as Division[];

const UNCLASSIFIED = "Unclassified";

// A handful of Wikidata P31 values are noise (list articles, abstract size
// classes) rather than meaningful division types — fold them in with the
// untyped divisions so the tree stays readable.
const NOISE_TYPES = new Set([
  "Wikimedia list article",
  "military unit size class",
  "branch of service",
]);

function groupLabel(type: string | undefined) {
  if (!type || NOISE_TYPES.has(type)) return UNCLASSIFIED;
  return type;
}

function formatYear(iso: string | undefined) {
  if (!iso) return undefined;
  return iso.slice(0, 4);
}

function dateRange(division: Division) {
  const start = formatYear(division.formed);
  const end = formatYear(division.disbanded);
  if (!start && !end) return null;
  if (start && end) return `${start}–${end}`;
  return start ?? end ?? null;
}

export default function DivisionsTree() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Division | null>(null);

  const groups = useMemo(() => {
    const q = query.toLowerCase().trim();
    const matches = q
      ? divisions.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.article.toLowerCase().includes(q),
        )
      : divisions;

    const byType = new Map<string, Division[]>();
    for (const d of matches) {
      const label = groupLabel(d.type);
      const list = byType.get(label);
      if (list) {
        list.push(d);
      } else {
        byType.set(label, [d]);
      }
    }

    return [...byType.entries()]
      .map(([label, members]) => ({
        label,
        members: members.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => b.members.length - a.members.length);
  }, [query]);

  const searching = query.trim().length > 0;

  function toggleGroup(label: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-deep text-dim font-sans">
      {/* Header */}
      <header className="bg-surface border-b border-rim sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <a
            href="/"
            className="text-muted hover:text-ink transition-colors text-sm shrink-0"
          >
            ← Map
          </a>
          <h1 className="text-ink font-semibold text-lg">WW2 Divisions</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-muted text-sm mb-4">
          {divisions.length} divisions grouped by type. Expand a group to
          browse, or select one for the full picture.
        </p>

        <input
          type="search"
          placeholder="Search divisions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface border border-rim rounded-md px-4 py-2.5 mb-6 text-dim placeholder-faint focus:outline-none focus:border-accent transition-colors"
        />

        <div className="flex flex-col gap-3">
          {groups.length === 0 && (
            <p className="text-muted text-center py-16">
              No divisions match your search.
            </p>
          )}
          {groups.map(({ label, members }) => {
            const isOpen = searching || open.has(label);
            return (
              <div
                key={label}
                className="bg-surface border border-rim rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(label)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-rim/30 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-faint text-xs transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                    >
                      ▶
                    </span>
                    <span className="text-ink font-semibold text-sm">
                      {label}
                    </span>
                  </span>
                  <span className="text-muted text-xs shrink-0">
                    {members.length} division{members.length !== 1 ? "s" : ""}
                  </span>
                </button>

                {isOpen && (
                  <ul className="border-t border-rim divide-y divide-rim">
                    {members.map((division) => {
                      const range = dateRange(division);
                      return (
                        <li key={division.id}>
                          <button
                            onClick={() => setSelected(division)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-2 pl-9 text-left hover:bg-rim/20 transition-colors group"
                          >
                            <span className="text-dim text-sm group-hover:text-ink transition-colors">
                              {division.name}
                            </span>
                            <span className="flex items-center gap-2 shrink-0">
                              {division.branch && (
                                <span className="text-faint text-xs">
                                  {division.branch}
                                </span>
                              )}
                              {range && (
                                <span className="text-muted text-xs tabular-nums">
                                  {range}
                                </span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {selected && (
        <DivisionPanel division={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
