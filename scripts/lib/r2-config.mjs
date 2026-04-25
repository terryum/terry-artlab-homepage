/**
 * Single source of truth for the Cloudflare R2 public CDN URL (Node scripts).
 * Mirror of src/lib/r2-config.ts — kept separate because .mjs can't import .ts.
 *
 * Callers must `await loadEnv()` (scripts/lib/env.mjs) before this returns
 * a non-empty string.
 */
export function getR2PublicUrl() {
  return process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_URL || '';
}
