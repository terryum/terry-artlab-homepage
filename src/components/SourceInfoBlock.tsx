'use client';

import { useState } from 'react';

interface SourceInfoBlockProps {
  sourceUrl?: string;
  sourceTitle?: string;
  sourceAuthor?: string;
  sourceType?: string;
  sourceProjectUrl?: string;
  sourceAuthorsFull?: string[];
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

/** Parse "Name (Affiliation)" entries → authors with affiliation indices + deduplicated affiliation list */
function groupAffiliations(authors: string[]): {
  parsed: { name: string; affIdx: number }[];
  affiliations: string[];
} {
  const affMap = new Map<string, number>(); // affiliation → 1-based index
  const parsed = authors.map((entry) => {
    const match = entry.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (!match) return { name: entry.trim(), affIdx: 0 };
    const name = match[1].trim();
    const aff = match[2].trim();
    if (!affMap.has(aff)) affMap.set(aff, affMap.size + 1);
    return { name, affIdx: affMap.get(aff)! };
  });
  return { parsed, affiliations: [...affMap.keys()] };
}

function LinkBadge({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-[11px] font-medium text-text-muted bg-bg-surface border border-line-default rounded-full px-2.5 py-0.5 hover:text-accent hover:border-accent transition-colors"
    >
      {children}
    </a>
  );
}

export default function SourceInfoBlock({
  sourceUrl,
  sourceTitle,
  sourceAuthor,
  sourceType,
  sourceProjectUrl,
  sourceAuthorsFull,
  publishedAt,
  labels,
}: SourceInfoBlockProps) {
  const [open, setOpen] = useState(false);

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

      {/* Author + Date + expand arrow */}
      {sourceAuthor && (
        <div className="mt-1.5">
          <span className="text-text-muted text-xs">
            {sourceAuthor}
            {dateStr && <span className="ml-1">({dateStr})</span>}
          </span>
          {sourceAuthorsFull && sourceAuthorsFull.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="inline-flex items-center ml-1 text-text-muted hover:text-accent transition-colors cursor-pointer align-middle"
            >
              <svg
                className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {open && sourceAuthorsFull && (() => {
            const { parsed, affiliations } = groupAffiliations(sourceAuthorsFull);
            const hasAffiliations = affiliations.length > 0;
            return (
              <div className="text-xs text-text-muted mt-1.5 leading-relaxed">
                <p>
                  {parsed.map((a, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {a.name}
                      {hasAffiliations && a.affIdx > 0 && (
                        <sup className="text-[9px] ml-[1px]">{a.affIdx}</sup>
                      )}
                    </span>
                  ))}
                </p>
                {hasAffiliations && (
                  <p className="mt-1 text-[11px] text-text-muted/70">
                    {affiliations.map((aff, i) => (
                      <span key={i}>
                        {i > 0 && '  '}
                        <sup className="text-[9px]">{i + 1}</sup>{aff}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
