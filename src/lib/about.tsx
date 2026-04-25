import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import type { Locale } from '@/lib/i18n';

import aboutKoRaw from '../../content/about/ko.mdx?raw';
import aboutEnRaw from '../../content/about/en.mdx?raw';
import bioKoRaw from '../../content/bio/ko.mdx?raw';
import bioEnRaw from '../../content/bio/en.mdx?raw';

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
