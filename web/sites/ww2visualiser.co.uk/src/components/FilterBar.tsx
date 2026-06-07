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
    <div className="flex flex-col gap-1.5">
      {categories.map((cat) => {
        const active = activeFilters.has(cat);
        return (
          <label
            key={cat}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => onToggle(cat)}
              style={{ accentColor: colors[cat] }}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span
              style={{ color: active ? colors[cat] : "#6e7681" }}
              className={`flex items-center gap-1.5 text-[12px] transition-colors duration-150 ${active ? "font-semibold" : "font-normal"}`}
            >
              <span>{icons[cat]}</span>
              <span>{LABELS[cat]}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
