export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  retrying (${attempt}/${retries - 1}): ${msg}`);
      await sleep(delayMs * attempt);
    }
  }
  throw new Error("withRetry exhausted");
}
