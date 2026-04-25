export function findBySlug<T extends { slug: string }>(
  items: readonly T[],
  slug: string,
): T | null {
  return items.find((item) => item.slug === slug) ?? null;
}
