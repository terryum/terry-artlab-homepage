import { isSupabaseAdminConfigured, getSupabaseAdmin } from '@/lib/supabase';
import type { PostMeta, Post, PostRelation, AISummary, FigureItem, Reference } from '@/types/post';
import type { ProjectMeta } from '@/types/project';

/**
 * Fetch group-scoped posts from Supabase private_content table.
 * Caller must verify auth before calling.
 */
export async function getPrivatePosts(
  groupSlug: string,
  locale: string
): Promise<PostMeta[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('group_slug', groupSlug)
    .eq('status', 'published')
    .neq('content_type', 'projects');

  if (error || !data) return [];

  return data.map((row) => mapRowToPostMeta(row, locale));
}

/**
 * Fetch a single private post with MDX content.
 */
export async function getPrivatePost(
  slug: string,
  locale: string
): Promise<Post | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  const content = locale === 'ko' ? data.content_ko : data.content_en;
  if (!content) return null;

  return {
    meta: mapRowToPostMeta(data, locale),
    content,
  };
}

/**
 * Fetch group-scoped projects from Supabase private_content table.
 */
export async function getPrivateProjects(
  groupSlug: string
): Promise<ProjectMeta[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('group_slug', groupSlug)
    .eq('content_type', 'projects')
    .eq('status', 'published');

  if (error || !data) return [];

  return data.map((row) => mapRowToProjectMeta(row));
}

/**
 * Fetch a single private project.
 */
export async function getPrivateProject(
  slug: string
): Promise<ProjectMeta | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('slug', slug)
    .eq('content_type', 'projects')
    .single();

  if (error || !data) return null;

  return mapRowToProjectMeta(data);
}

/**
 * Get all private post slugs (for any group). Used by scripts, not site.
 */
export async function getAllPrivatePostSlugs(): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('private_content')
    .select('slug')
    .neq('content_type', 'projects')
    .eq('status', 'published');

  return data?.map((r) => r.slug) ?? [];
}

/**
 * Get all private posts across all groups. Used for admin view.
 */
export async function getAllPrivatePosts(locale: string): Promise<PostMeta[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .neq('content_type', 'projects')
    .eq('status', 'published');

  if (error || !data) return [];
  return data.map((row) => mapRowToPostMeta(row, locale));
}

/**
 * Get all private projects across all groups. Used for admin view.
 */
export async function getAllPrivateProjects(): Promise<ProjectMeta[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('content_type', 'projects')
    .eq('status', 'published');

  if (error || !data) return [];
  return data.map((row) => mapRowToProjectMeta(row));
}

// ─── Mappers ───

function mapRowToPostMeta(
  row: {
    slug: string;
    title_ko: string;
    title_en: string;
    meta_json: Record<string, unknown>;
    cover_image_url: string | null;
  },
  locale: string
): PostMeta {
  const m = row.meta_json || {};
  const coverPath = `/api/co/image/${row.slug}`;
  const thumbPath = `/api/co/image/${row.slug}?variant=cover-thumb.webp`;

  return {
    post_id: (m.post_id as string) || row.slug,
    locale,
    title: locale === 'ko' ? row.title_ko : row.title_en,
    summary: (m.ai_summary as AISummary)?.one_liner ?? (m.summary as string) ?? '',
    slug: row.slug,
    published_at: (m.published_at as string) || new Date().toISOString(),
    updated_at: (m.updated_at as string) || (m.published_at as string) || new Date().toISOString(),
    status: 'published',
    content_type: (m.content_type as PostMeta['content_type']) || 'papers',
    tags: (m.tags as string[]) || [],
    display_tags: m.display_tags as string[] | undefined,
    cover_image: coverPath,
    cover_thumb: thumbPath,
    thumb_fit: m.thumb_fit as PostMeta['thumb_fit'],
    card_summary: m.card_summary as string | undefined,
    cover_caption: m.cover_caption as string | undefined,
    cover_figure_number: m.cover_figure_number as number | undefined,
    reading_time_min: m.reading_time_min as number | undefined,
    source_date: m.source_date as string | undefined,
    source_url: m.source_url as string | undefined,
    source_title: m.source_title as string | undefined,
    source_author: m.source_author as string | undefined,
    source_type: m.source_type as string | undefined,
    source_project_url: m.source_project_url as string | undefined,
    source_authors_full: m.source_authors_full as string[] | undefined,
    first_author_scholar_url: m.first_author_scholar_url as string | undefined,
    google_scholar_url: m.google_scholar_url as string | undefined,
    references: (m.references as Reference[]) || [],
    figures: (m.figures as FigureItem[]) || [],
    tables: (m.tables as FigureItem[]) || [],
    terrys_memo: m.terrys_memo as string | undefined,
    newsletter_eligible: m.newsletter_eligible as boolean | undefined,
    featured: m.featured as boolean | undefined,
    post_number: m.post_number as number | undefined,
    domain: m.domain as string | undefined,
    subfields: m.subfields as string[] | undefined,
    key_concepts: m.key_concepts as string[] | undefined,
    methodology: m.methodology as string[] | undefined,
    contribution_type: m.contribution_type as PostMeta['contribution_type'],
    relations: m.relations as PostRelation[] | undefined,
    ai_summary: m.ai_summary as AISummary | undefined,
    taxonomy_primary: m.taxonomy_primary as string | undefined,
    taxonomy_secondary: m.taxonomy_secondary as string[] | undefined,
    visibility: 'group',
    allowed_groups: (m.allowed_groups as string[]) || ['snu'],
  };
}

function mapRowToProjectMeta(
  row: {
    slug: string;
    title_ko: string;
    title_en: string;
    meta_json: Record<string, unknown>;
    cover_image_url: string | null;
  }
): ProjectMeta {
  const m = row.meta_json || {};
  return {
    slug: row.slug,
    title: { ko: row.title_ko, en: row.title_en },
    description: (m.description as { ko: string; en: string }) || { ko: '', en: '' },
    cover_image: `/api/co/image/${row.slug}`,
    tech_stack: (m.tech_stack as string[]) || [],
    links: (m.links as ProjectMeta['links']) || [],
    embed_url: m.embed_url as string | undefined,
    status: (m.status as ProjectMeta['status']) || 'active',
    featured: (m.featured as boolean) || false,
    order: (m.order as number) || 0,
    published_at: (m.published_at as string) || new Date().toISOString(),
    visibility: 'group',
    allowed_groups: (m.allowed_groups as string[]) || ['snu'],
  };
}
