import TagChip from './TagChip';
import BaseCard from './cards/BaseCard';
import LockBadge from './cards/LockBadge';
import { normalizeTagSlug } from '@/lib/tags';
import { TAB_TAG_SLUGS } from '@/lib/site-config';
import { getDisplayTags, formatPostDate } from '@/lib/display';
import tagsData from '@/data/tags.json';
import type { PostMeta } from '@/types/post';

interface ContentCardProps {
  post: PostMeta;
  locale: string;
  showTabTag?: boolean;
  hidePubDate?: boolean;
}

function getTabLabel(post: PostMeta, locale: string): string | null {
  const tabSlug = post.tags.map(normalizeTagSlug).find((tag) => TAB_TAG_SLUGS.has(tag));
  if (!tabSlug) return null;
  const tagDef = tagsData.tags.find((t) => t.slug === tabSlug);
  return tagDef?.label[locale as 'ko' | 'en'] ?? tabSlug;
}

export default function ContentCard({ post, locale, showTabTag, hidePubDate }: ContentCardProps) {
  const href = `/${locale}/posts/${post.slug}`;
  const isReading = post.content_type === 'papers';

  const metaDateStr = isReading
    ? formatPostDate(post.source_date || post.published_at, locale, { year: 'numeric', month: 'short' })
    : formatPostDate(post.published_at, locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const summary = post.card_summary || post.summary;
  const tabLabel = showTabTag ? getTabLabel(post, locale) : null;
  const otherTags = getDisplayTags(post)
    .filter((tag) => !TAB_TAG_SLUGS.has(normalizeTagSlug(tag)))
    .slice(0, tabLabel ? 2 : 3);

  return (
    <BaseCard
      href={href}
      thumbnailSrc={post.cover_thumb || post.cover_image}
      thumbnailAlt={post.title}
      thumbnailFit={post.thumb_fit === 'contain' ? 'contain' : 'cover'}
    >
      <h3 className="text-base font-[480] text-text-primary group-hover:text-accent transition-colors leading-snug">
        {post.starred && (
          <span className="inline-block mr-1 text-amber-400" title="Seminal Paper">★</span>
        )}
        {post.post_number != null && (
          <span className="font-mono text-xs text-text-muted mr-1.5">#{post.post_number}</span>
        )}
        <LockBadge visibility={post.visibility} allowedGroups={post.allowed_groups} />
        {post.title}
      </h3>
      {isReading && post.source_author && (
        <p className="text-xs text-text-muted mt-0.5">
          {post.source_author}
          {` · ${metaDateStr}`}
        </p>
      )}
      <p className="text-sm text-text-muted mt-1 line-clamp-4 sm:line-clamp-3">{summary}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {!isReading && !hidePubDate && <time className="text-xs text-text-muted">{metaDateStr}</time>}
        {tabLabel && <TagChip tag={tabLabel} />}
        {otherTags.map((tag) => (
          <TagChip key={tag} tag={tag} />
        ))}
      </div>
    </BaseCard>
  );
}
