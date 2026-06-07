export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/**
 * Assigns stable slug-based IDs (in the same order as `items`), appending
 * the QID only when two labels collide on the same base slug.
 */
export function assignSlugIds<T extends { label: string; qid: string }>(
  items: T[],
): string[] {
  const slugCount = items.reduce<Record<string, number>>((acc, item) => {
    const s = toSlug(item.label);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return items.map((item) => {
    const baseSlug = toSlug(item.label);
    return slugCount[baseSlug] > 1
      ? `${baseSlug}-${item.qid.toLowerCase()}`
      : baseSlug;
  });
}
