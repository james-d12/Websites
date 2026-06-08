import { useState, useCallback, useRef, useMemo } from "react";
import Map, { Marker, Source, Layer, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  WW2Event,
  EventCategory,
  TerritorySnapshot,
} from "../types/events";
import { COUNTRY_LABELS } from "../types/events";
import eventsData from "../data/events.json";
import territoriesData from "../data/territories.json";
import EventPanel from "./EventPanel";
import Timeline from "./Timeline";
import FilterSidebar from "./FilterSidebar";

const events = eventsData as WW2Event[];
const territories = territoriesData as TerritorySnapshot[];

// Palette for territory shading — distinct from COUNTRY_COLORS (flag-derived
// colours, which cluster heavily around red/blue and make adjacent powers like
// USA/USSR/China hard to tell apart on a filled map). Hues are spread by
// adjacency: countries that border each other or share a theatre get the most
// separated colours; rarely-co-occurring "minor" nations share a quieter,
// less saturated secondary set.
const TERRITORY_COLORS: Record<string, string> = {
  germany: "#52525b",
  ussr: "#bc2f2f",
  italy: "#bc5e2f",
  poland: "#bcab2f",
  japan: "#52bc2f",
  vichy_france: "#2fbc59",
  usa: "#2fa4bc",
  uk: "#362fbc",
  china: "#812fbc",
  france: "#bc2f7a",
  finland: "#c37465",
  greece: "#65c390",
  yugoslavia: "#ab65c3",
  romania: "#bfc365",
  hungary: "#65a4c3",
  netherlands: "#c36588",
  belgium: "#6dc365",
  norway: "#7865c3",
  denmark: "#c39465",
  croatia: "#65c3af",
  albania: "#c365bb",
  slovakia: "#a0c365",
  estonia: "#6584c3",
  latvia: "#c36569",
  lithuania: "#65c37d",
  canada: "#9865c3",
  australia: "#c3b465",
  new_zealand: "#65b7c3",
  neutral: "#9aa0a6",
};

const TERRITORY_LABELS: Record<string, string> = {
  ...COUNTRY_LABELS,
  neutral: "Neutral",
};

const COUNTRY_FILL_EXPRESSION = [
  "match",
  ["get", "country"],
  ...Object.entries(TERRITORY_COLORS).flat(),
  "#888888",
] as any;

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
  const [showTerritories, setShowTerritories] = useState(true);
  const mapRef = useRef<MapRef>(null);

  const currentDate = new Date(WAR_START.getTime() + currentDay * 86_400_000);

  const activeTerritories = useMemo(() => {
    let active: TerritorySnapshot | null = null;
    for (const snapshot of territories) {
      if (new Date(snapshot.date) <= currentDate) active = snapshot;
      else break;
    }
    return active;
  }, [currentDay]);

  const territoryLegend = useMemo(() => {
    if (!activeTerritories) return [];
    const seen = new Set<string>();
    const entries: { key: string; label: string; color: string }[] = [];
    for (const feature of activeTerritories.regions.features) {
      const key = feature.properties.country;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({
        key,
        label: TERRITORY_LABELS[key] ?? key,
        color: TERRITORY_COLORS[key] ?? "#888888",
      });
    }
    return entries.sort((a, b) => a.label.localeCompare(b.label));
  }, [activeTerritories]);

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

          <a
            href="/divisions"
            className="shrink-0 px-3 py-1.5 text-xs font-medium rounded border border-rim text-muted hover:text-ink hover:border-accent/60 transition-colors duration-150"
          >
            Divisions
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
          {showTerritories && activeTerritories && (
            <Source
              id="territories"
              type="geojson"
              data={activeTerritories.regions as any}
            >
              <Layer
                id="territory-fill"
                type="fill"
                paint={{
                  "fill-color": COUNTRY_FILL_EXPRESSION,
                  "fill-opacity": 0.22,
                }}
              />
              <Layer
                id="territory-outline"
                type="line"
                paint={{
                  "line-color": COUNTRY_FILL_EXPRESSION,
                  "line-width": 1,
                  "line-opacity": 0.5,
                }}
              />
            </Source>
          )}

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
          showTerritories={showTerritories}
          onShowTerritoriesChange={setShowTerritories}
          territoryLegend={territoryLegend}
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
