import { useState, useCallback } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { WW2Event, EventCategory } from "../types/events";
import { COUNTRY_COLORS, COUNTRY_FLAGS } from "../types/events";
import eventsData from "../data/events.json";
import EventPanel from "./EventPanel";
import Timeline from "./Timeline";
import FilterBar from "./FilterBar";

const events = eventsData as WW2Event[];

const WAR_START = new Date("1939-09-01");
const WAR_END = new Date("1945-09-02");

const TOTAL_DAYS = Math.round(
  (WAR_END.getTime() - WAR_START.getTime()) / 86_400_000,
);

const CARTO_DARK =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const CATEGORY_COLORS: Record<EventCategory, string> = {
  battle: "#e63946",
  naval: "#457b9d",
  air: "#a8dadc",
  political: "#6a4c93",
  atrocity: "#2d2d2d",
};

const CATEGORY_ICONS: Record<EventCategory, string> = {
  battle: "⚔",
  naval: "⚓",
  air: "✈",
  political: "🏛",
  atrocity: "✝",
};

export default function WW2Map({ flags }: { flags: Record<string, string> }) {
  const flagImages: Record<string, string> = flags;
  const [currentDay, setCurrentDay] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<WW2Event | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(
    new Set(Object.keys(CATEGORY_COLORS) as EventCategory[]),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const currentDate = new Date(WAR_START.getTime() + currentDay * 86_400_000);

  const isEventVisible = useCallback(
    (ev: WW2Event) => {
      if (!activeFilters.has(ev.category)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          ev.title.toLowerCase().includes(q) ||
          ev.article.toLowerCase().includes(q);
        if (!matches) return false;
      }
      const start = new Date(ev.date);
      const end = ev.endDate ? new Date(ev.endDate) : start;
      return start <= currentDate && currentDate <= end;
    },
    [currentDay, activeFilters, searchQuery],
  );

  const visibleEvents = events.filter(isEventVisible);

  const toggleFilter = useCallback((cat: EventCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);

      const hasId = next.has(cat);

      if (hasId) {
        next.delete(cat);
      } else {
        next.add(cat);
      }

      return next;
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-deep text-dim font-sans">
      <header className="bg-surface border-b border-rim px-5 pt-3 pb-2.5 shrink-0 flex flex-col gap-2.5">
        {/* Title row */}
        <div className="flex items-center gap-4">
          <h1 className="m-0 text-lg font-bold tracking-[0.05em] text-ink shrink-0">
            WW2 <span className="text-accent">Interactive Map</span>
          </h1>
          <span className="text-[13px] text-muted shrink-0">1939 – 1945</span>

          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, places, countries…"
              className="w-full bg-deep border border-rim rounded-md pl-9 pr-8 py-1.5 text-sm text-dim placeholder:text-faint focus:outline-none focus:border-accent transition-colors duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-dim text-base leading-none cursor-pointer bg-transparent border-none transition-colors duration-150"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="text-[13px] text-muted shrink-0">
            {searchQuery
              ? `${visibleEvents.length} match${visibleEvents.length !== 1 ? "es" : ""} on this date`
              : `${visibleEvents.length} event${visibleEvents.length !== 1 ? "s" : ""} visible`}
          </div>

          <a
            href="/events"
            className="ml-auto shrink-0 px-3 py-1.5 text-xs font-medium rounded border border-rim text-muted hover:text-ink hover:border-accent/60 transition-colors duration-150"
          >
            Events list
          </a>
        </div>

        {/* Category filter pills */}
        <FilterBar
          categories={Object.keys(CATEGORY_COLORS) as EventCategory[]}
          activeFilters={activeFilters}
          colors={CATEGORY_COLORS}
          icons={CATEGORY_ICONS}
          onToggle={toggleFilter}
        />
      </header>

      <div className="flex-1 relative overflow-hidden">
        <Map
          initialViewState={{ longitude: 10, latitude: 30, zoom: 3 }}
          minZoom={2}
          maxZoom={10}
          mapStyle={CARTO_DARK}
          style={{ width: "100%", height: "100%" }}
        >
          {visibleEvents.map((ev) => {
            const isSelected = selectedEvent?.id === ev.id;
            const size = isSelected ? 46 : 38;
            const flagSize = isSelected ? 20 : 15;
            const f1 = ev.sides?.allied[0];
            const f2 = ev.sides?.axis[0];
            const c1 = f1 ? COUNTRY_COLORS[f1] : CATEGORY_COLORS[ev.category];
            const c2 = f2 ? COUNTRY_COLORS[f2] : null;
            const img1 = f1 ? flagImages[f1] : undefined;
            const img2 = f2 ? flagImages[f2] : undefined;
            return (
              <Marker
                key={ev.id}
                longitude={ev.lng}
                latitude={ev.lat}
                anchor="center"
                style={{ zIndex: isSelected ? 1000 : 1 }}
              >
                <div
                  onClick={() => setSelectedEvent(ev)}
                  style={{
                    width: size,
                    height: size,
                    background:
                      img1 || img2
                        ? "transparent"
                        : c2
                          ? `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`
                          : c1,
                    border: `2px solid ${isSelected ? "#fff" : "rgba(255,255,255,0.5)"}`,
                  }}
                  className="rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-150 overflow-hidden relative select-none"
                >
                  {/* No factions: category icon */}
                  {!f1 && (
                    <span style={{ fontSize: isSelected ? 18 : 14 }}>
                      {CATEGORY_ICONS[ev.category]}
                    </span>
                  )}

                  {/* Single faction */}
                  {f1 &&
                    !f2 &&
                    (img1 ? (
                      <img
                        src={img1}
                        alt={f1}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <span style={{ fontSize: flagSize }}>
                        {COUNTRY_FLAGS[f1]}
                      </span>
                    ))}

                  {/* Dual faction: each half fills its side */}
                  {f1 && f2 && (
                    <>
                      <div
                        className="absolute left-0 top-0 w-1/2 h-full overflow-hidden"
                        style={{ background: c1 }}
                      >
                        {img1 ? (
                          <img
                            src={img1}
                            alt={f1}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ fontSize: flagSize }}
                          >
                            {COUNTRY_FLAGS[f1]}
                          </span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 w-1/2 h-full overflow-hidden"
                        style={{ background: c2 ?? undefined }}
                      >
                        {img2 ? (
                          <img
                            src={img2}
                            alt={f2}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ fontSize: flagSize }}
                          >
                            {COUNTRY_FLAGS[f2]}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Marker>
            );
          })}
        </Map>

        {selectedEvent && (
          <EventPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>

      <Timeline
        totalDays={TOTAL_DAYS}
        currentDay={currentDay}
        warStart={WAR_START}
        onChange={setCurrentDay}
      />
    </div>
  );
}
