'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

const PAGE_SIZE = 3;

export default function ShowMoreButton({
  totalCount,
  showMoreText,
  children,
}: {
  totalCount: number;
  showMoreText?: string;
  children: (visibleCount: number) => ReactNode;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasMore = visibleCount < totalCount;

  return (
    <div>
      {children(visibleCount)}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full py-2 text-sm text-text-muted hover:text-accent transition-colors border border-line-default rounded-md"
        >
          {showMoreText ?? `+${Math.min(PAGE_SIZE, totalCount - visibleCount)} more`}
        </button>
      )}
    </div>
  );
}
