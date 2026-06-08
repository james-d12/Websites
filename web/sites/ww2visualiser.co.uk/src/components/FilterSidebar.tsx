import type { EventCategory } from "../types/events";
import FilterBar from "./FilterBar";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: EventCategory[];
  activeFilters: Set<EventCategory>;
  colors: Record<EventCategory, string>;
  icons: Record<EventCategory, string>;
  onToggle: (cat: EventCategory) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  showTerritories: boolean;
  onShowTerritoriesChange: (show: boolean) => void;
  territoryLegend: { key: string; label: string; color: string }[];
}

export default function FilterSidebar({
  open,
  onClose,
  categories,
  activeFilters,
  colors,
  icons,
  onToggle,
  speed,
  onSpeedChange,
  showTerritories,
  onShowTerritoriesChange,
  territoryLegend,
}: Props) {
  return (
    <div
      style={{
        transform: open ? "translateX(0)" : "translateX(-110%)",
      }}
      className="absolute top-4 left-4 z-[1000] w-[260px] max-h-[calc(100%-2rem)] bg-surface border border-rim rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden transition-transform duration-200"
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2.5 border-b border-rim shrink-0 flex items-center justify-between">
        <h2 className="m-0 text-sm font-bold tracking-[0.06em] uppercase text-ink">
          Filters
        </h2>
        <button
          onClick={onClose}
          className="bg-transparent border-none text-faint text-lg cursor-pointer px-1 leading-none hover:text-dim transition-colors duration-150"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="px-3.5 py-3 overflow-y-auto flex-1 flex flex-col gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-2">
            Categories
          </div>
          <FilterBar
            categories={categories}
            activeFilters={activeFilters}
            colors={colors}
            icons={icons}
            onToggle={onToggle}
          />
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-2">
            Map Layers
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showTerritories}
              onChange={(e) => onShowTerritoriesChange(e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[12px] text-dim">Territorial control</span>
          </label>

          {showTerritories && territoryLegend.length > 0 && (
            <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
              {territoryLegend.map((entry) => (
                <div key={entry.key} className="flex items-center gap-1.5 min-w-0">
                  <span
                    style={{ background: entry.color }}
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                  />
                  <span className="text-[11px] text-faint truncate">
                    {entry.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.06em] uppercase text-faint mb-2">
            Playback Speed
          </div>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full bg-deep text-dim border border-rim rounded-md px-2.5 py-2 text-sm cursor-pointer"
          >
            <option value={1}>Slow (1 day/s)</option>
            <option value={7}>Normal (1 wk/s)</option>
            <option value={30}>Fast (1 month/s)</option>
            <option value={90}>Very fast (1 qtr/s)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
