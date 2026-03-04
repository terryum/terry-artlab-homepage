'use client';

import { useState } from 'react';

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

interface AuthorListProps {
  sourceAuthor: string;
  firstAuthorScholarUrl?: string;
  publishedDate?: string | null;
  sourceAuthorsFull?: string[];
}

export default function AuthorList({
  sourceAuthor,
  firstAuthorScholarUrl,
  publishedDate,
  sourceAuthorsFull,
}: AuthorListProps) {
  const [open, setOpen] = useState(false);

  const etAlIdx = sourceAuthor.indexOf(' et al.');
  const firstName = etAlIdx > 0 ? sourceAuthor.slice(0, etAlIdx) : sourceAuthor;
  const rest = etAlIdx > 0 ? sourceAuthor.slice(etAlIdx) : '';

  return (
    <div className="mt-1.5">
      <span className="text-text-muted text-xs">
        {firstAuthorScholarUrl ? (
          <>
            <a
              href={firstAuthorScholarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-accent transition-colors underline decoration-dotted underline-offset-2"
            >
              {firstName}
            </a>
            {rest}
          </>
        ) : (
          sourceAuthor
        )}
        {publishedDate && <span className="ml-1">({publishedDate})</span>}
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
  );
}
