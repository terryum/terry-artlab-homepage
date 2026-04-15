const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL || '';

/**
 * Resolve a relative asset path (`./foo.jpg`) to a CDN URL or local path.
 * When R2_PUBLIC_URL is set, images are served from Cloudflare R2 CDN.
 * Non-relative paths are returned as-is.
 */
export function resolvePostAssetPath(src: string | undefined | null, slug: string): string {
  if (!src) return '';
  if (src.startsWith('./')) {
    const file = src.slice(2);
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL}/posts/${slug}/${file}`;
    }
    return `/posts/${slug}/${file}`;
  }
  return src;
}

/**
 * Resolve a post asset to CDN URL (cover, thumbnail, OG).
 * Used by posts.ts for cover_image and cover_thumb paths.
 */
export function resolvePostCdnPath(slug: string, file: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/posts/${slug}/${file}`;
  }
  return `/posts/${slug}/${file}`;
}
