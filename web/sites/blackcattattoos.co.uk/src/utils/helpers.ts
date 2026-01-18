const CONCURRENCY_LIMIT = 3;
const MAX_RETRIES = 2;
const INITIAL_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = INITIAL_DELAY_MS,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    console.warn(
      `Request failed, retrying in ${delayMs}ms (${retries} retries left)`,
    );
    await sleep(delayMs);
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

export async function promiseAllWithLimit<T, R>(
  items: T[],
  mapper: (item: T) => Promise<R>,
  limit: number = CONCURRENCY_LIMIT,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function processNext(): Promise<void> {
    const index = currentIndex++;
    if (index >= items.length) return;
    results[index] = await withRetry(() => mapper(items[index]));
    await processNext();
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    processNext(),
  );

  await Promise.all(workers);
  return results;
}
