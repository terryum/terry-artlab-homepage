import Link from 'next/link';
import ContentCard from './ContentCard';
import ShowMoreButton from './ShowMoreButton';
import type { PostMeta } from '@/types/post';

interface LatestSectionProps {
  title: string;
  viewAllHref: string;
  viewAllText: string;
  posts: PostMeta[];
  locale: string;
  showMoreText?: string;
  emptyText?: string;
  showTabTag?: boolean;
  hidePubDate?: boolean;
}

export default function LatestSection({
  title,
  viewAllHref,
  viewAllText,
  posts,
  locale,
  showMoreText,
  emptyText,
  showTabTag,
  hidePubDate,
}: LatestSectionProps) {
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

      {posts.length === 0 ? (
        <p className="text-text-muted text-sm py-4">{emptyText ?? 'No posts yet.'}</p>
      ) : (
        <ShowMoreButton totalCount={posts.length} showMoreText={showMoreText}>
          {(visibleCount) =>
            posts.slice(0, visibleCount).map((post) => (
              <ContentCard key={post.post_id} post={post} locale={locale} showTabTag={showTabTag} hidePubDate={hidePubDate} />
            ))
          }
        </ShowMoreButton>
      )}
    </section>
  );
}
