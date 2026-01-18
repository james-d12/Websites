const CONCURRENCY_LIMIT = 3;

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
        results[index] = await mapper(items[index]);
        await processNext();
    }

    const workers = Array.from(
        {length: Math.min(limit, items.length)},
        () => processNext(),
    );

    await Promise.all(workers);
    return results;
}