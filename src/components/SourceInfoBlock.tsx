import { LinkBadge } from './LinkBadge';
import AuthorList from './AuthorList';

interface SourceInfoBlockProps {
  sourceUrl?: string;
  sourceTitle?: string;
  sourceAuthor?: string;
  sourceType?: string;
  sourceProjectUrl?: string;
  sourceAuthorsFull?: string[];
  firstAuthorScholarUrl?: string;
  publishedAt?: string;
  labels: {
    source_label: string;
    author_label: string;
    view_all_authors: string;
  };
}

function formatSourceDate(publishedAt: string): string {
  const d = new Date(publishedAt);
  return `${d.getUTCFullYear()}. ${d.getUTCMonth() + 1}`;
}

function buildScholarUrl(title: string): string {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;
}

export default function SourceInfoBlock({
  sourceUrl,
  sourceTitle,
  sourceAuthor,
  sourceType,
  sourceProjectUrl,
  sourceAuthorsFull,
  firstAuthorScholarUrl,
  publishedAt,
}: SourceInfoBlockProps) {
  if (!sourceUrl && !sourceTitle) return null;

  const dateStr = publishedAt ? formatSourceDate(publishedAt) : null;
  const scholarUrl = sourceTitle ? buildScholarUrl(sourceTitle) : null;

  return (
    <div className="border border-line-default rounded-lg p-4 md:p-5 mb-8 text-sm bg-bg-surface/40">
      {/* Link badges (top) */}
      <div className="flex items-center gap-1.5 mb-3">
        {sourceUrl && <LinkBadge href={sourceUrl}>{sourceType || 'arXiv'}</LinkBadge>}
        {scholarUrl && <LinkBadge href={scholarUrl}>Google Scholar</LinkBadge>}
        {sourceProjectUrl && <LinkBadge href={sourceProjectUrl}>Project</LinkBadge>}
      </div>

      {/* Title */}
      {sourceTitle && (
        <p className="text-text-primary font-medium leading-snug">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              {sourceTitle}
            </a>
          ) : (
            sourceTitle
          )}
        </p>
      )}

      {/* Author + Date */}
      {sourceAuthor && (
        <AuthorList
          sourceAuthor={sourceAuthor}
          firstAuthorScholarUrl={firstAuthorScholarUrl}
          publishedDate={dateStr}
          sourceAuthorsFull={sourceAuthorsFull}
        />
      )}
    </div>
  );
}
