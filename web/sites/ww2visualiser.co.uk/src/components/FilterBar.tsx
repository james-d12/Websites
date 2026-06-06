import type { EventCategory } from "../types/events";

interface Props {
  categories: EventCategory[];
  activeFilters: Set<EventCategory>;
  colors: Record<EventCategory, string>;
  icons: Record<EventCategory, string>;
  onToggle: (cat: EventCategory) => void;
}

const LABELS: Record<EventCategory, string> = {
  battle: "Battles",
  naval: "Naval",
  air: "Air",
  political: "Political",
  atrocity: "Atrocities",
};

export default function FilterBar({
  categories,
  activeFilters,
  colors,
  icons,
  onToggle,
}: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => {
        const active = activeFilters.has(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            style={{
              border: `1px solid ${active ? colors[cat] : "#30363d"}`,
              background: active ? `${colors[cat]}22` : "transparent",
              color: active ? colors[cat] : "#6e7681",
            }}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs cursor-pointer transition-all duration-150 ${active ? "font-semibold" : "font-normal"}`}
          >
            <span>{icons[cat]}</span>
            <span>{LABELS[cat]}</span>
          </button>
        );
      })}
    </div>
  );
}
