import { useState, useCallback, useRef } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { WW2Event, EventCategory } from "../types/events";
import eventsData from "../data/events.json";
import EventPanel from "./EventPanel";
import Timeline from "./Timeline";
import FilterSidebar from "./FilterSidebar";

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
  const [currentDay, setCurrentDay] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<WW2Event | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<EventCategory>>(
    new Set(Object.keys(CATEGORY_COLORS) as EventCategory[]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [speed, setSpeed] = useState(1); // days per second
  const mapRef = useRef<MapRef>(null);

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

  const handleMapLoad = useCallback(() => {
    const eventId = new URLSearchParams(window.location.search).get("event");
    if (!eventId) return;

    const target = events.find((ev) => ev.id === eventId);
    if (!target) return;

    const day = Math.round(
      (new Date(target.date).getTime() - WAR_START.getTime()) / 86_400_000,
    );
    setCurrentDay(Math.min(Math.max(day, 0), TOTAL_DAYS));
    setSelectedEvent(target);
    mapRef.current?.flyTo({ center: [target.lng, target.lat], zoom: 6 });

    history.replaceState(null, "", "/");
  }, []);

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
      <header className="bg-surface border-b border-rim px-5 pt-2 pb-1.5 shrink-0 flex flex-col gap-1.5">
        {/* Title row */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Close filters" : "Open filters"}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded border border-rim text-muted hover:text-ink hover:border-accent/60 bg-transparent cursor-pointer transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3.5" width="12" height="1.6" rx="0.8" />
              <rect x="2" y="7.2" width="12" height="1.6" rx="0.8" />
              <rect x="2" y="10.9" width="12" height="1.6" rx="0.8" />
            </svg>
          </button>
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
      </header>

      <div className="flex-1 relative overflow-hidden">
        <Map
          ref={mapRef}
          onLoad={handleMapLoad}
          initialViewState={{ longitude: 10, latitude: 30, zoom: 3 }}
          minZoom={2}
          maxZoom={10}
          mapStyle={CARTO_DARK}
          style={{ width: "100%", height: "100%" }}
        >
          {visibleEvents.map((ev) => {
            const isSelected = selectedEvent?.id === ev.id;
            const size = isSelected ? 46 : 38;
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
                    background: CATEGORY_COLORS[ev.category],
                    border: `2px solid ${isSelected ? "#fff" : "rgba(255,255,255,0.5)"}`,
                  }}
                  className="rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-150 select-none"
                >
                  <span style={{ fontSize: isSelected ? 18 : 14 }}>
                    {CATEGORY_ICONS[ev.category]}
                  </span>
                </div>
              </Marker>
            );
          })}
        </Map>

        <FilterSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          categories={Object.keys(CATEGORY_COLORS) as EventCategory[]}
          activeFilters={activeFilters}
          colors={CATEGORY_COLORS}
          icons={CATEGORY_ICONS}
          onToggle={toggleFilter}
          speed={speed}
          onSpeedChange={setSpeed}
        />

        {selectedEvent && (
          <EventPanel
            event={selectedEvent}
            flags={flags}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>

      <Timeline
        totalDays={TOTAL_DAYS}
        currentDay={currentDay}
        warStart={WAR_START}
        onChange={setCurrentDay}
        speed={speed}
      />
    </div>
  );
}
