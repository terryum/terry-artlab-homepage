import type { FigureItem } from '@/types/post';
import type { Locale } from '@/lib/i18n';

export function localizeGalleryItems(
  items: FigureItem[] | undefined,
  locale: Locale
): { src: string; caption: string; number: number }[] {
  if (!items) return [];
  return items.map((item) => ({
    src: item.src,
    caption: locale === 'ko' && item.caption_ko ? item.caption_ko : item.caption,
    number: item.number,
  }));
}
