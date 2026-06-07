import { writeFileSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WpEntry } from "./wikipedia.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, "../wiki-cache.json");

export type WikiCache = Record<string, WpEntry>;

export function loadCache(): WikiCache {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8")) as WikiCache;
  } catch {
    return {};
  }
}

export function saveCache(cache: WikiCache): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}
