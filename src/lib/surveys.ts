import { isSupabaseAdminConfigured, getSupabaseAdmin } from '@/lib/supabase';
import type { SurveyMeta } from '@/types/survey';
import surveysBundle from '../../projects/surveys/surveys.json';

/**
 * Internal raw view: includes private URLs (embed_url, links) for
 * restricted surveys. Only call after verifying the caller is authorized
 * (e.g., in the detail page after requireReadAccess passes).
 */
function loadSurveysRaw(): SurveyMeta[] {
  return (surveysBundle as unknown as { surveys: SurveyMeta[] }).surveys;
}

/**
 * Strip private URLs from non-public surveys so they don't leak into
 * client-rendered HTML / RSC payloads. Title / cover / TOC stay public per
 * product policy; only embed_url and external links are redacted because
 * those are the ones that bypass the auth gate.
 */
function sanitizeRestrictedSurvey(s: SurveyMeta): SurveyMeta {
  const visibility = s.visibility ?? 'public';
  if (visibility === 'public') return s;
  return { ...s, embed_url: undefined, links: [] };
}

export async function loadPublicSurveys(): Promise<SurveyMeta[]> {
  return loadSurveysRaw().map(sanitizeRestrictedSurvey);
}

function mapRowToSurveyMeta(row: {
  slug: string;
  title_ko: string;
  title_en: string;
  meta_json: Record<string, unknown>;
  cover_image_url: string | null;
}): SurveyMeta {
  const m = row.meta_json || {};
  return {
    slug: row.slug,
    survey_number: (m.survey_number as number) || 0,
    title: { ko: row.title_ko, en: row.title_en },
    description: (m.description as { ko: string; en: string }) || { ko: '', en: '' },
    cover_image: `/api/co/image/${row.slug}`,
    tech_stack: (m.tech_stack as string[]) || [],
    toc: (m.toc as { ko: string; en: string }[]) || [],
    links: (m.links as SurveyMeta['links']) || [],
    embed_url: m.embed_url as string | undefined,
    status: (m.status as SurveyMeta['status']) || 'active',
    featured: (m.featured as boolean) || false,
    order: (m.order as number) || 0,
    published_at: (m.published_at as string) || new Date().toISOString(),
    updated_at: (m.updated_at as string) || undefined,
    visibility: 'group',
    allowed_groups: (m.allowed_groups as string[]) || [],
  };
}

async function getLegacyPrivateSurveys(groupSlug: string): Promise<SurveyMeta[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('content_type', 'surveys')
    .eq('group_slug', groupSlug)
    .eq('status', 'published');
  if (error || !data) return [];
  return data.map(mapRowToSurveyMeta);
}

async function getAllLegacyPrivateSurveys(): Promise<SurveyMeta[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('content_type', 'surveys')
    .eq('status', 'published');
  if (error || !data) return [];
  return data.map(mapRowToSurveyMeta);
}

export async function getAllSurveys(): Promise<SurveyMeta[]> {
  const surveys = (await loadPublicSurveys()).slice();

  const { getAuthenticatedGroup, isAdminSession } = await import('@/lib/group-auth');
  const [group, admin] = await Promise.all([getAuthenticatedGroup(), isAdminSession()]);
  if (group || admin) {
    const legacy = admin
      ? await getAllLegacyPrivateSurveys()
      : group ? await getLegacyPrivateSurveys(group) : [];
    const seen = new Set(surveys.map((s) => s.slug));
    for (const s of legacy) {
      if (!seen.has(s.slug)) surveys.push(s);
    }
  }

  return surveys.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

/**
 * Detail page view: returns the full raw SurveyMeta including embed_url for
 * restricted surveys. The caller (survey detail page) is responsible for
 * running requireReadAccess before handing embed_url to the client iframe.
 */
export async function getSurvey(slug: string): Promise<SurveyMeta | null> {
  const survey = loadSurveysRaw().find((s) => s.slug === slug) ?? null;
  if (survey) return survey;

  // Legacy Supabase fallback (transitional until R2 migration).
  const { getAuthenticatedGroup, isAdminSession } = await import('@/lib/group-auth');
  const [group, admin] = await Promise.all([getAuthenticatedGroup(), isAdminSession()]);
  if (!group && !admin) return null;

  if (!isSupabaseAdminConfigured()) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('private_content')
    .select('slug, title_ko, title_en, meta_json, cover_image_url, status')
    .eq('slug', slug)
    .eq('content_type', 'surveys')
    .single();
  if (error || !data) return null;

  const legacy = mapRowToSurveyMeta(data);
  if (legacy.visibility === 'group' && !admin) {
    if (!group || !(legacy.allowed_groups?.includes(group))) return null;
  }
  return legacy;
}
