import { type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { buildContentIndexProps } from '@/lib/content-page-helpers';
import { getAudience } from '@/lib/audience';
import ContentIndexPage from '@/components/ContentIndexPage';
import type { Metadata } from 'next';

// Audience-aware: filters list by viewer's session.
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [{ lang: 'ko' }, { lang: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.posts_index.title,
    description: dict.posts_index.description,
  };
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const audience = await getAudience();
  const props = await buildContentIndexProps(lang, audience);
  if (!props) return null;

  return (
    <ContentIndexPage
      locale={props.locale}
      title={props.title}
      description={props.description}
      posts={props.posts}
      allTags={props.allTags}
      initialSelectedTags={props.initialSelectedTags}
      filterDict={props.filterDict}
      searchDict={props.searchDict}
      tabTitles={props.tabTitles}
      taxonomyNodes={props.taxonomyNodes}
      taxonomyStats={props.taxonomyStats}
    />
  );
}
