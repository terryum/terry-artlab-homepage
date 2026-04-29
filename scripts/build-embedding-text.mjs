/**
 * build-embedding-text.mjs
 * Single source of truth for what text feeds paper_embeddings (KG semantic search).
 *
 * BUILDER_VERSION bump → all rows go stale → next sync-embeddings run
 * triggers full re-embed. Treat this constant like a schema migration.
 */
import crypto from 'crypto';

export const BUILDER_VERSION = 'v1';

export function buildEmbeddingText(meta) {
  const ai = meta?.ai_summary ?? {};
  const memos = meta?.terry_memos ?? [];
  const gaps = (meta?.research_gaps ?? [])
    .map(g => g?.question)
    .filter(Boolean);

  const parts = [
    meta?.title || meta?.source_title || meta?.slug,
    ai.one_liner,
    ai.problem ? `Problem: ${ai.problem}` : null,
    ai.solution ? `Solution: ${ai.solution}` : null,
    meta?.domain ? `Domain: ${meta.domain}` : null,
    meta?.subfields?.length ? `Subfields: ${meta.subfields.join(', ')}` : null,
    meta?.key_concepts?.length ? `Concepts: ${meta.key_concepts.join(', ')}` : null,
    meta?.methodology?.length ? `Methods: ${meta.methodology.join(', ')}` : null,
    memos.length ? `Memos: ${memos.join(' | ')}` : null,
    gaps.length ? `Gaps: ${gaps.join(' | ')}` : null,
  ].filter(Boolean);

  const text = parts.join('\n');
  const hash = crypto
    .createHash('sha256')
    .update(`${BUILDER_VERSION}\n${text}`)
    .digest('hex')
    .slice(0, 16);

  return { text, hash };
}
