import type { Locale } from '@/lib/i18n';
import type { Reference } from '@/types/post';
import SourceInfoBlock from './SourceInfoBlock';

function resolveSourceUrl(ref: Reference): string | undefined {
  // Priority: arxiv > project_url > scholar_url (post_slug handled separately as internal link)
  return ref.arxiv_url || ref.project_url || ref.scholar_url || undefined;
}

function resolveSourceType(ref: Reference): string {
  if (ref.arxiv_url) return 'arXiv';
  if (ref.project_url) {
    if (ref.project_url.includes('x.com') || ref.project_url.includes('twitter.com')) return 'X';
    if (ref.project_url.includes('github.com')) return 'GitHub';
    return 'Blog';
  }
  if (ref.scholar_url) return 'Google Scholar';
  return 'Reference';
}

export default function ReferenceCard({
  reference,
  locale,
}: {
  reference: Reference;
  locale?: Locale;
}) {
  const sourceUrl = resolveSourceUrl(reference);
  const sourceType = resolveSourceType(reference);
  // Don't show project badge separately when project_url is already used as sourceUrl
  const projectUrl = reference.arxiv_url ? reference.project_url : undefined;

  return (
    <SourceInfoBlock
      sourceUrl={sourceUrl}
      sourceTitle={reference.title}
      sourceAuthor={reference.author}
      sourceType={sourceType}
      sourceProjectUrl={projectUrl}
      scholarUrl={reference.arxiv_url ? reference.scholar_url : undefined}
      description={reference.description}
      postSlug={reference.post_slug}
      locale={locale}
    />
  );
}
