/**
 * Resolve a relative asset path (`./foo.jpg`) to a public path (`/posts/<slug>/foo.jpg`).
 * Non-relative paths are returned as-is.
 */
export function resolvePostAssetPath(src: string, slug: string): string {
  if (src.startsWith('./')) {
    return `/posts/${slug}/${src.slice(2)}`;
  }
  return src;
}
