import type { Theater } from "../../types/events.ts";

export function parseCoords(
  raw: string | undefined,
): { lat: number; lng: number } | null {
  if (!raw) return null;
  const m = raw.match(/Point\(([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)\)/);
  if (!m) return null;
  return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
}

export function inferTheater(lat: number, lng: number): Theater {
  if (lat >= 34 && lat <= 72 && lng >= -12 && lng <= 42) return "europe";
  if (lat >= -36 && lat <= 38 && lng >= -18 && lng <= 55) return "africa";
  if (lat >= 0 && lat <= 55 && lng >= 42 && lng <= 100) return "asia";
  if (lat >= -55 && lat <= 65 && (lng >= 100 || lng <= -60)) return "pacific";
  return "atlantic";
}
