import type { Reference } from '@/types/post';

export function categorizeReferences(refs: Reference[] | undefined) {
  const all = refs || [];
  const foundational = all.filter((r) => r.category === 'foundational');
  const recent = all.filter((r) => r.category === 'recent');
  const uncategorized = all.filter((r) => !r.category);
  const hasCategories = foundational.length > 0 || recent.length > 0;
  return { foundational, recent, uncategorized, hasCategories };
}
