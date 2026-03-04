import type { Locale } from '@/lib/i18n';
import type { Reference } from '@/types/post';
import { LinkBadge, InternalLinkBadge } from './LinkBadge';

export default function ReferenceCard({
  reference,
  locale,
}: {
  reference: Reference;
  locale?: Locale;
}) {
  const titleEl = reference.arxiv_url ? (
    <a
      href={reference.arxiv_url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-accent transition-colors"
    >
      {reference.title}
    </a>
  ) : (
    reference.title
  );

  const loc = locale || 'en';

  return (
    <div className="border border-line-default rounded-lg p-4 text-sm bg-bg-surface/40">
      {/* Link badges (top) */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {reference.post_slug && (
          <InternalLinkBadge href={`/${loc}/research/${reference.post_slug}`}>
            Post
          </InternalLinkBadge>
        )}
        {reference.project_url && <LinkBadge href={reference.project_url}>Project</LinkBadge>}
        {reference.arxiv_url && <LinkBadge href={reference.arxiv_url}>arXiv</LinkBadge>}
        {reference.scholar_url && <LinkBadge href={reference.scholar_url}>Google Scholar</LinkBadge>}
      </div>

      {/* Title */}
      <p className="text-text-primary font-medium leading-snug">{titleEl}</p>

      {/* Author */}
      {reference.author && (
        <p className="text-text-muted text-xs mt-1">{reference.author}</p>
      )}

      {/* Description */}
      <p className="text-text-muted text-xs mt-1">{reference.description}</p>
    </div>
  );
}
