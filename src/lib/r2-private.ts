import 'server-only';

const R2_URL = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL || '';

export type PrivateDomain = 'posts' | 'projects';

/**
 * Build the R2 key for a private content body.
 *
 * posts: private/posts/<type>/<slug>/<lang>.mdx
 * projects: private/projects/<slug>/<lang>.mdx
 */
export function privateBodyKey(
  domain: PrivateDomain,
  type: string | null,
  slug: string,
  lang: string
): string {
  if (domain === 'posts') {
    if (!type) throw new Error('posts domain requires a content type');
    return `private/posts/${type}/${slug}/${lang}.mdx`;
  }
  return `private/projects/${slug}/${lang}.mdx`;
}

/**
 * Build the R2 key for a private meta.json (optional rich metadata).
 */
export function privateMetaKey(
  domain: PrivateDomain,
  type: string | null,
  slug: string
): string {
  if (domain === 'posts') {
    if (!type) throw new Error('posts domain requires a content type');
    return `private/posts/${type}/${slug}/meta.json`;
  }
  return `private/projects/${slug}/meta.json`;
}

async function fetchR2(key: string): Promise<Response | null> {
  if (!R2_URL) return null;
  try {
    // IMPORTANT: omit `cache: 'no-store'` — that flips the page from
    // SSG-with-dynamicParams to dynamic at runtime and crashes with
    // "Page changed from static to dynamic" on the OpenNext worker.
    // We rely on Next's default fetch cache + ISR revalidation; private
    // bodies are small, so cache hits are cheap and correctness is fine
    // because we also don't mutate R2 keys in-place.
    const res = await fetch(`${R2_URL}/${key}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

/**
 * Fetch a private MDX body from R2 and return it as a string.
 * Returns null if the object is missing or R2 is not configured.
 * Server-side only — the URL must never be exposed to the client.
 */
export async function fetchPrivateMdx(
  domain: PrivateDomain,
  type: string | null,
  slug: string,
  lang: string
): Promise<string | null> {
  const res = await fetchR2(privateBodyKey(domain, type, slug, lang));
  return res ? await res.text() : null;
}

/**
 * Fetch a private meta.json (optional) from R2 as a parsed object.
 */
export async function fetchPrivateMeta<T = unknown>(
  domain: PrivateDomain,
  type: string | null,
  slug: string
): Promise<T | null> {
  const res = await fetchR2(privateMetaKey(domain, type, slug));
  if (!res) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Check whether a private body exists in R2 (HEAD equivalent via GET).
 */
export async function privateBodyExists(
  domain: PrivateDomain,
  type: string | null,
  slug: string,
  lang: string
): Promise<boolean> {
  const res = await fetchR2(privateBodyKey(domain, type, slug, lang));
  return !!res;
}
