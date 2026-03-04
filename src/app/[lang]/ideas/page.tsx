import { type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { buildContentIndexProps } from '@/lib/content-page-helpers';
import ContentIndexPage from '@/components/ContentIndexPage';
import type { Metadata } from 'next';

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
    title: dict.ideas_index.title,
    description: dict.ideas_index.description,
  };
}

export default async function IdeasPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const props = await buildContentIndexProps(lang, {
    dictKey: 'ideas_index',
    initialTag: 'ideas',
  });
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
    />
  );
}
