# Migration: Leaflet → MapLibre GL JS

## Why

The current Leaflet integration is showing structural friction:

- `(window as any).L` is a global side-channel to share the Leaflet instance between `WW2Map` and `makeDivIcon` — a sign the library isn't fitting the React model
- Marker visibility is controlled by `setOpacity(0/1)` — all markers always exist in the DOM, they're just invisible, which doesn't scale
- Leaflet has no native support for animated vector layers, so adding moving front lines or territory shading over time would require a custom canvas hack or a separate library
- The imperative `useRef<LeafletMap>` + manual marker lifecycle runs against the React rendering model, making state bugs harder to trace

MapLibre GL JS is GPU-accelerated via WebGL, has first-class GeoJSON layer support, and (via `react-map-gl`) exposes a fully declarative React API that eliminates all of the above.

---

## Target stack

| Role              | Before                        | After                                         |
| ----------------- | ----------------------------- | --------------------------------------------- |
| Map engine        | `leaflet@1.9`                 | `maplibre-gl`                                 |
| React integration | manual `useRef` + `useEffect` | `react-map-gl` (MapLibre flavour)             |
| Tile style        | CARTO tile URL                | CARTO MapLibre style JSON                     |
| Markers           | `L.divIcon` + `L.marker`      | `<Marker>` components or GeoJSON symbol layer |
| Types             | `@types/leaflet`              | built into `maplibre-gl`                      |

---

## Dependency changes

```bash
# Remove
pnpm remove leaflet @types/leaflet

# Add
pnpm add maplibre-gl react-map-gl
```

`react-map-gl` v8+ targets MapLibre by default. No additional type packages are needed — MapLibre ships its own types.

---

## Phase 1 — Map initialisation

### Before (`WW2Map.tsx`)

```tsx
// Dynamically imported to avoid SSR, then exposed as a global
import("leaflet").then(({ default: L }) => {
  (window as any).L = L;
  const map = L.map(containerRef.current!, { center: [30, 10], zoom: 3 });
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/...").addTo(map);
  mapRef.current = map;
});
```

### After

```tsx
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// CARTO provides a MapLibre-native dark style — same tiles, no URL hacking
const CARTO_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function WW2Map() {
  return (
    <Map
      initialViewState={{ longitude: 10, latitude: 30, zoom: 3 }}
      minZoom={2}
      maxZoom={10}
      mapStyle={CARTO_DARK}
      style={{ flex: 1 }}
    >
      {/* children go here */}
    </Map>
  );
}
```

The `containerRef`, `mapRef`, and the `useEffect` that initialises the map all disappear.

> **SSR note:** AstroJS renders React components on the server. Add `client:only="react"` to the `<WW2Map />` usage in `index.astro` (it likely already has this) and wrap the `import 'maplibre-gl/dist/maplibre-gl.css'` in a dynamic import or move it to a `client:only` boundary, since MapLibre's CSS references browser globals.

---

## Phase 2 — Markers

There are two viable approaches. Choose based on expected event count.

### Option A: `<Marker>` components (recommended for < ~500 events)

This is the most direct replacement and keeps the custom emoji+colour div icons.

```tsx
import { Marker, Popup } from "react-map-gl/maplibre";

// Replace makeDivIcon + marker.on('click') with:
{
  visibleEvents.map((ev) => (
    <Marker
      key={ev.id}
      longitude={ev.lng}
      latitude={ev.lat}
      anchor="center"
      onClick={() => setSelectedEvent(ev)}
    >
      <div
        style={{
          width: selectedEvent?.id === ev.id ? 38 : 30,
          height: selectedEvent?.id === ev.id ? 38 : 30,
          background: CATEGORY_COLORS[ev.category],
          border: `2px solid ${selectedEvent?.id === ev.id ? "#fff" : "rgba(255,255,255,0.5)"}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: selectedEvent?.id === ev.id ? 18 : 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
      >
        {CATEGORY_ICONS[ev.category]}
      </div>
    </Marker>
  ));
}
```

Key differences from the Leaflet version:

- No `setOpacity` — invisible events simply aren't rendered (filter `visibleEvents` as before)
- No `markersRef` Map — React owns the marker lifecycle
- No `(window as any).L` — `makeDivIcon` is deleted entirely
- `setSelectedEvent` is called directly in `onClick`, not via a closure captured at marker-creation time

### Option B: GeoJSON source + symbol layer (recommended if event count grows large)

For hundreds of simultaneous markers, pushing all geometry into a single GeoJSON source and letting MapLibre batch-render it as a WebGL layer is significantly faster.

```tsx
import { Source, Layer } from "react-map-gl/maplibre";

const geojson: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: visibleEvents.map((ev) => ({
    type: "Feature",
    id: ev.id,
    geometry: { type: "Point", coordinates: [ev.lng, ev.lat] },
    properties: {
      category: ev.category,
      selected: ev.id === selectedEvent?.id,
    },
  })),
};

<Source id="events" type="geojson" data={geojson}>
  <Layer
    id="event-circles"
    type="circle"
    paint={{
      "circle-radius": ["case", ["get", "selected"], 19, 15],
      "circle-color": [
        "match",
        ["get", "category"],
        "battle",
        "#e63946",
        "naval",
        "#457b9d",
        // ... etc
        "#888",
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": [
        "case",
        ["get", "selected"],
        "#fff",
        "rgba(255,255,255,0.5)",
      ],
    }}
  />
</Source>;
```

Click handling moves to the map's `onClick` callback, filtering by layer:

```tsx
<Map onMouseEnter={...} onClick={e => {
  const feature = e.features?.[0];
  if (feature) setSelectedEvent(events.find(ev => ev.id === feature.id) ?? null);
}} interactiveLayerIds={['event-circles']}>
```

This approach also makes it trivial to add front-line or territory GeoJSON layers later — just add more `<Source>` + `<Layer>` pairs.

---

## Phase 3 — Remove the imperative marker update loop

### Before

```tsx
// Runs on every currentDay / filter / selectedEvent change
useEffect(() => {
  if (!mapRef.current || !(window as any).L) return;
  events.forEach((ev) => {
    const marker = markersRef.current.get(ev.id);
    marker.setOpacity(isEventVisible(ev) ? 1 : 0);
    marker.setZIndexOffset(isSelected ? 1000 : 0);
    if (visible) marker.setIcon(makeDivIcon(ev.category, isSelected));
  });
}, [currentDay, activeFilters, selectedEvent, isEventVisible]);
```

### After

This `useEffect` is deleted entirely. With Option A, `visibleEvents` is filtered in render and the `<Marker>` list updates automatically. With Option B, `geojson` is recomputed from `visibleEvents` and MapLibre diffs it.

The `markersRef` ref is also deleted.

---

## Phase 4 — CSS / stylesheet

Leaflet requires `leaflet/dist/leaflet.css`. MapLibre requires `maplibre-gl/dist/maplibre-gl.css`.

In `WW2Map.tsx`, replace:

```tsx
// Remove — was likely in index.astro or a global stylesheet
import "leaflet/dist/leaflet.css";
```

With:

```tsx
import "maplibre-gl/dist/maplibre-gl.css";
```

The broken default-icon-path workaround in the Leaflet init block is also deleted:

```tsx
// Delete this entire block:
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: '...', ... });
```

---

## Files changed

| File                            | Change                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| `package.json`                  | Remove `leaflet`, `@types/leaflet`; add `maplibre-gl`, `react-map-gl` |
| `src/components/WW2Map.tsx`     | Full rewrite — see phases above                                       |
| `src/pages/index.astro`         | Verify `client:only="react"` is on `<WW2Map />`                       |
| `src/components/Timeline.tsx`   | No changes needed                                                     |
| `src/components/FilterBar.tsx`  | No changes needed                                                     |
| `src/components/EventPanel.tsx` | No changes needed                                                     |
| `src/types/events.ts`           | No changes needed                                                     |

---

## What this unlocks afterwards

Once on MapLibre, these features become straightforward:

- **Front lines over time** — load front-line GeoJSON per date, swap the source data as the timeline advances
- **Territory shading** — fill polygons with faction colours, driven by the same timeline state
- **Heatmap layer** — one additional `<Layer type="heatmap">` over the events source
- **Animated unit movement** — interpolate coordinates between snapshots using MapLibre's `easeTo` or a custom animation frame loop against the source data

None of these are practical in Leaflet without pulling in additional plugins.
