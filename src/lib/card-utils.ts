import { formatPostDate } from '@/lib/display';

/** Format date for card display (year + short month, optionally with day) */
export function formatCardDate(
  dateStr: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatPostDate(
    dateStr,
    locale,
    options ?? { year: 'numeric', month: 'short' }
  );
}

/** Check if image should be unoptimized (API routes) */
export function isUnoptimizedImage(src: string): boolean {
  return src.startsWith('/api/');
}
