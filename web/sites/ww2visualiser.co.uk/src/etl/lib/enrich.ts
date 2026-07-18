import { sleep } from "./async.ts";
import { type WikiCache, saveCache } from "./cache.ts";
import { fetchWpSummary } from "./wikipedia.ts";

const BATCH = 10;

/**
 * Cache-first batch fetch of Wikipedia summaries for every item with a
 * resolved `wpTitle` that isn't already cached. Mutates `cache` in place
 * and persists it once new entries have been fetched.
 */
export async function fetchMissingSummaries<T extends { wpTitle?: string }>(
  items: T[],
  cache: WikiCache,
): Promise<void> {
  const needed = items.filter(
    (item) => item.wpTitle !== undefined && !cache[item.wpTitle],
  );
  console.log(
    `\nWikipedia: ${Object.keys(cache).length} cached, ${needed.length} to fetch…`,
  );

  let fetched = 0;
  for (let i = 0; i < needed.length; i += BATCH) {
    const batch = needed.slice(i, i + BATCH);
    const entries = await Promise.all(
      batch.map((item) => fetchWpSummary(item.wpTitle!)),
    );
    batch.forEach((item, j) => {
      if (entries[j]) cache[item.wpTitle!] = entries[j]!;
    });
    fetched += batch.length;
    process.stdout.write(`\r  ${fetched}/${needed.length}`);
    if (i + BATCH < needed.length) await sleep(500);
  }
  if (needed.length > 0) {
    console.log();
    saveCache(cache);
  }
}
