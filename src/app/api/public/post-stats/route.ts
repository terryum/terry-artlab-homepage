import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { fetchPageviewsBySlug } from '@/lib/ga4-stats';
import { getAudience, isSlugVisibleToAudience } from '@/lib/audience';
import indexJson from '../../../../../posts/index.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PostStats {
  likes: number;
  comments: number;
  views: number;
}

const KNOWN_SLUGS = new Set<string>(
  ((indexJson as { posts?: Array<{ slug: string }> }).posts ?? []).map((p) => p.slug),
);

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  const propertyId = (process.env.GA4_PROPERTY_ID ?? '').trim() || undefined;
  const startDate = process.env.GA4_START_DATE ?? '2024-01-01';
  const endDate = todayIso();

  const audience = await getAudience();
  const visibleSlugs = new Set<string>();
  for (const slug of KNOWN_SLUGS) {
    if (isSlugVisibleToAudience(slug, audience)) visibleSlugs.add(slug);
  }

  const [likesRes, commentsRes, viewsMap] = await Promise.all([
    supabase.from('post_likes').select('post_slug'),
    supabase.from('post_comments_public').select('post_slug'),
    propertyId
      ? fetchPageviewsBySlug({
          propertyId,
          startDate,
          endDate,
          knownSlugs: visibleSlugs,
        }).catch((err) => {
          const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
          console.warn('[public/post-stats] GA4 fetch failed:', msg);
          return new Map<string, number>();
        })
      : Promise.resolve(new Map<string, number>()),
  ]);

  const likesBySlug = new Map<string, number>();
  for (const row of likesRes.data ?? []) {
    const slug = (row as { post_slug?: string }).post_slug;
    if (!slug || !visibleSlugs.has(slug)) continue;
    likesBySlug.set(slug, (likesBySlug.get(slug) ?? 0) + 1);
  }

  const commentsBySlug = new Map<string, number>();
  for (const row of commentsRes.data ?? []) {
    const slug = (row as { post_slug?: string }).post_slug;
    if (!slug || !visibleSlugs.has(slug)) continue;
    commentsBySlug.set(slug, (commentsBySlug.get(slug) ?? 0) + 1);
  }

  const stats: Record<string, PostStats> = {};
  for (const slug of visibleSlugs) {
    stats[slug] = {
      likes: likesBySlug.get(slug) ?? 0,
      comments: commentsBySlug.get(slug) ?? 0,
      views: viewsMap.get(slug) ?? 0,
    };
  }

  return NextResponse.json(
    { stats, fetchedAt: new Date().toISOString() },
    {
      headers: {
        'cache-control': 'private, max-age=300',
      },
    },
  );
}
