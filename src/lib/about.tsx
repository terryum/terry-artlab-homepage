import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { Locale } from '@/lib/i18n';

import aboutKoRaw from '../../content/about/ko.mdx?raw';
import aboutEnRaw from '../../content/about/en.mdx?raw';
import bioKoRaw from '../../content/bio/ko.mdx?raw';
import bioEnRaw from '../../content/bio/en.mdx?raw';
import mediaJson from '../../content/about/media.json';

export interface MediaItem {
  title_ko: string;
  title_en: string;
  source?: string; // e.g. "YouTube", "Podcast", magazine name
  year?: string | number;
  url: string;
  content_lang?: 'ko' | 'en'; // language of the content itself; marker shown when it differs from view locale
}

export interface AboutMedia {
  currently: { ko: string; en: string };
  talks: MediaItem[];
  interviews: MediaItem[];
  writing: MediaItem[];
  books: MediaItem[];
  code: MediaItem[];
}

export interface LocalizedMediaItem {
  title: string;
  source?: string;
  year?: string;
  url: string;
  isOtherLang: boolean; // content language differs from current view locale
}

export interface LocalizedAboutMedia {
  currently: string;
  talks: LocalizedMediaItem[];
  interviews: LocalizedMediaItem[];
  writing: LocalizedMediaItem[];
  books: LocalizedMediaItem[];
  code: LocalizedMediaItem[];
  hasAnyMedia: boolean;
}

const SOURCES: Record<'about' | 'bio', Record<Locale, string>> = {
  about: { ko: aboutKoRaw, en: aboutEnRaw },
  bio: { ko: bioKoRaw, en: bioEnRaw },
};

// Convert JSX-style attributes (className="...") to HTML (class="...") so rehype-raw
// can parse them. These MDX files use <br className="..."/> for responsive line breaks.
function normalizeMdxForHtml(src: string): string {
  return src.replace(/className=/g, 'class=');
}

function renderMarkdown(dir: 'about' | 'bio', locale: Locale) {
  const source = normalizeMdxForHtml(SOURCES[dir][locale]);
  return (
    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
      {source}
    </ReactMarkdown>
  );
}

function readPlainText(dir: 'about' | 'bio', locale: Locale) {
  return SOURCES[dir][locale].trim();
}

export async function getAboutContent(locale: Locale) {
  return renderMarkdown('about', locale);
}

export async function getBioContent(locale: Locale) {
  return renderMarkdown('bio', locale);
}

export async function getBioPlainText(locale: Locale) {
  return readPlainText('bio', locale);
}

// "2025-05" → "May 2025", "2024" → "2024", "2024–" → "2024–" (passthrough for non-ISO).
function formatYearMonth(input?: string | number): string | undefined {
  if (input == null) return undefined;
  const raw = String(input).trim();
  if (!raw) return undefined;
  const m = raw.match(/^(\d{4})-(\d{1,2})/);
  if (!m) return raw;
  const date = new Date(`${m[1]}-${m[2].padStart(2, '0')}-01T00:00:00Z`);
  if (isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// Sortable key: "YYYY-MM" stripped from any year-like prefix; missing → "0000-00".
function getSortKey(item: MediaItem): string {
  if (item.year == null) return '0000-00';
  const m = String(item.year).match(/^(\d{4})(?:-(\d{1,2}))?/);
  if (!m) return '0000-00';
  return `${m[1]}-${(m[2] ?? '00').padStart(2, '0')}`;
}

function sortNewestFirst(items: MediaItem[]): MediaItem[] {
  return items.slice().sort((a, b) => getSortKey(b).localeCompare(getSortKey(a)));
}

function localizeItem(item: MediaItem, locale: Locale): LocalizedMediaItem {
  return {
    title: (locale === 'ko' ? item.title_ko : item.title_en) || item.title_en || item.title_ko,
    source: item.source,
    year: formatYearMonth(item.year),
    url: item.url,
    isOtherLang: item.content_lang != null && item.content_lang !== locale,
  };
}

export async function getAboutMedia(locale: Locale): Promise<LocalizedAboutMedia> {
  const data = mediaJson as AboutMedia;
  const talks      = sortNewestFirst(data.talks      ?? []).map(i => localizeItem(i, locale));
  const interviews = sortNewestFirst(data.interviews ?? []).map(i => localizeItem(i, locale));
  const writing    = sortNewestFirst(data.writing    ?? []).map(i => localizeItem(i, locale));
  const books      = sortNewestFirst(data.books      ?? []).map(i => localizeItem(i, locale));
  const code       = sortNewestFirst(data.code       ?? []).map(i => localizeItem(i, locale));
  const currently = (data.currently?.[locale] ?? '').trim();
  return {
    currently,
    talks,
    interviews,
    writing,
    books,
    code,
    hasAnyMedia:
      talks.length + interviews.length + writing.length + books.length + code.length > 0,
  };
}
