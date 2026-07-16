export type EventCategory =
  "battle" | "naval" | "air" | "political" | "atrocity";

export type Theater = "europe" | "pacific" | "africa" | "atlantic" | "asia";

export type Country =
  // Major Allied powers
  | "uk"
  | "usa"
  | "ussr"
  | "france"
  // Commonwealth
  | "canada"
  | "australia"
  | "new_zealand"
  | "india"
  // Other Allied nations
  | "poland"
  | "netherlands"
  | "belgium"
  | "norway"
  | "denmark"
  | "greece"
  | "china"
  | "estonia"
  | "latvia"
  | "lithuania"
  | "yugoslavia"
  // Major Axis powers
  | "germany"
  | "italy"
  | "japan"
  // Axis-aligned nations
  | "romania"
  | "hungary"
  | "slovakia"
  | "croatia"
  | "vichy_france"
  | "finland"
  | "albania"
  | "spain";

export const COUNTRY_COLORS: Record<Country, string> = {
  // Allied
  uk: "#003087",
  usa: "#B22234",
  ussr: "#CC0000",
  france: "#0055A4",
  canada: "#D52B1E",
  australia: "#00457C",
  new_zealand: "#00247D",
  india: "#FF9933",
  poland: "#DC143C",
  netherlands: "#AE1C28",
  belgium: "#EF3340",
  norway: "#EF2B2D",
  denmark: "#C60C30",
  greece: "#0D5EAF",
  china: "#DE2910",
  estonia: "#0072CE",
  latvia: "#9E3039",
  lithuania: "#006A44",
  yugoslavia: "#0C4076",
  // Axis
  germany: "#4a4a4a",
  italy: "#009246",
  japan: "#BC002D",
  romania: "#002B7F",
  hungary: "#CE2939",
  slovakia: "#0B4EA2",
  croatia: "#CC0000",
  vichy_france: "#6b4c2a",
  finland: "#003580",
  albania: "#E41E20",
  spain: "#C60B1E",
};

export const COUNTRY_FLAGS: Record<Country, string> = {
  uk: "🇬🇧",
  usa: "🇺🇸",
  ussr: "☭",
  france: "🇫🇷",
  canada: "🇨🇦",
  australia: "🇦🇺",
  new_zealand: "🇳🇿",
  india: "🇮🇳",
  poland: "🇵🇱",
  netherlands: "🇳🇱",
  belgium: "🇧🇪",
  norway: "🇳🇴",
  denmark: "🇩🇰",
  greece: "🇬🇷",
  china: "🇨🇳",
  estonia: "🇪🇪",
  latvia: "🇱🇻",
  lithuania: "🇱🇹",
  yugoslavia: "🇷🇸",
  germany: "🇩🇪",
  italy: "🇮🇹",
  japan: "🇯🇵",
  romania: "🇷🇴",
  hungary: "🇭🇺",
  slovakia: "🇸🇰",
  croatia: "🇭🇷",
  vichy_france: "🇫🇷",
  finland: "🇫🇮",
  albania: "🇦🇱",
  spain: "🇪🇸",
};

export const COUNTRY_LABELS: Record<Country, string> = {
  uk: "United Kingdom",
  usa: "United States",
  ussr: "Soviet Union",
  france: "France",
  canada: "Canada",
  australia: "Australia",
  new_zealand: "New Zealand",
  india: "British India",
  poland: "Poland",
  netherlands: "Netherlands",
  belgium: "Belgium",
  norway: "Norway",
  denmark: "Denmark",
  greece: "Greece",
  china: "China",
  estonia: "Estonia",
  latvia: "Latvia",
  lithuania: "Lithuania",
  yugoslavia: "Yugoslavia",
  germany: "Germany",
  italy: "Italy",
  japan: "Japan",
  romania: "Romania",
  hungary: "Hungary",
  slovakia: "Slovakia",
  croatia: "Croatia",
  vichy_france: "Vichy France",
  finland: "Finland",
  albania: "Albania",
  spain: "Spain",
};

export interface WW2Event {
  id: string;
  /** Wikidata QID — used to cross-reference with divisions during ETL. */
  qid: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD
  endDate?: string;
  lat: number;
  lng: number;
  category: EventCategory;
  theater: Theater;
  sides?: {
    allied: Country[];
    axis: Country[];
  };
  article: string;
  links?: { label: string; url: string }[];
  icon?: string;
  /** IDs of divisions known to have fought in this event (via Wikidata P607). */
  divisionIds?: string[];
}

export interface TerritoryRegion {
  type: "Feature";
  properties: { country: Country; name?: string };
  geometry:
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] };
}

export interface TerritorySnapshot {
  date: string; // ISO date YYYY-MM-DD — in effect until the next snapshot's date
  regions: {
    type: "FeatureCollection";
    features: TerritoryRegion[];
  };
}
