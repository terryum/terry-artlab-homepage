/**
 * Single source of truth for the Cloudflare R2 public CDN URL.
 *
 * Reads R2_PUBLIC_URL (server) or NEXT_PUBLIC_R2_URL (client/build-inlined),
 * falling back to '' when unset (callers degrade to local /posts/... paths).
 *
 * Mirror: scripts/lib/r2-config.mjs (the .mjs/.ts split is forced because
 * Node scripts can't import .ts modules without a build step).
 */
export function getR2PublicUrl(): string {
  return process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL || '';
}
