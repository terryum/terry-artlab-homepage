'use client';

import { useState, Children } from 'react';
import Link from 'next/link';
import ContentCard from './ContentCard';
import type { PostMeta } from '@/types/post';

const PAGE_SIZE = 3;

/* ── Common props ── */
interface BaseProps {
  title: string;
  viewAllHref: string;
  viewAllText: string;
  showMoreText?: string;
  emptyText?: string;
  initialCount?: number;
}

/* ── Posts mode (backward-compatible) ── */
interface PostsProps extends BaseProps {
  posts: PostMeta[];
  locale: string;
  showTabTag?: boolean;
  hidePubDate?: boolean;
  children?: never;
}

/* ── Children mode (generic) ── */
interface ChildrenProps extends BaseProps {
  children: React.ReactNode;
  posts?: never;
  locale?: never;
  showTabTag?: never;
  hidePubDate?: never;
}

type LatestSectionProps = PostsProps | ChildrenProps;

export default function LatestSection(props: LatestSectionProps) {
  const {
    title,
    viewAllHref,
    viewAllText,
    showMoreText,
    emptyText,
    initialCount,
  } = props;

  const pageSize = initialCount ?? PAGE_SIZE;

  // Determine items for counting and slicing
  const childArray = props.children ? Children.toArray(props.children) : null;
  const totalCount = childArray ? childArray.length : (props.posts?.length ?? 0);

  const [visibleCount, setVisibleCount] = useState(pageSize);
  const hasMore = visibleCount < totalCount;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-[540] text-text-primary tracking-tight">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-sm text-text-muted hover:text-accent transition-colors"
        >
          {viewAllText} &rarr;
        </Link>
      </div>

      {totalCount === 0 ? (
        <p className="text-text-muted text-sm py-4">{emptyText ?? 'No posts yet.'}</p>
      ) : (
        <div>
          {childArray
            ? childArray.slice(0, visibleCount)
            : props.posts!.slice(0, visibleCount).map((post) => (
                <ContentCard
                  key={post.post_id}
                  post={post}
                  locale={props.locale!}
                  showTabTag={props.showTabTag}
                  hidePubDate={props.hidePubDate}
                />
              ))
          }
          {hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + pageSize)}
              className="mt-4 w-full py-2 text-sm text-text-muted hover:text-accent transition-colors border border-line-default rounded-md"
            >
              {showMoreText ?? `+${Math.min(pageSize, totalCount - visibleCount)} more`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
