#!/usr/bin/env node

/**
 * sync-embeddings.mjs
 * Sync paper_embeddings table with posts/papers/<slug>/meta.json.
 *
 * Diff key = (content_hash, embedding_model, builder_version). Bumping any of
 * the three on the source side invalidates the row and triggers re-embed.
 *
 * Usage:
 *   node scripts/sync-embeddings.mjs                # incremental
 *   node scripts/sync-embeddings.mjs --all          # force full re-embed
 *   node scripts/sync-embeddings.mjs --dry-run      # show what would change
 *   node scripts/sync-embeddings.mjs --slug=<slug>  # single paper
 */

import fs from 'fs/promises';
import path from 'path';
import { POSTS_DIR } from './lib/paths.mjs';
import { getSupabase } from './lib/supabase.mjs';
import { loadEnv } from './lib/env.mjs';
import { BUILDER_VERSION, buildEmbeddingText } from './build-embedding-text.mjs';

await loadEnv();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 50;

const args = process.argv.slice(2);
const force = args.includes('--all');
const dryRun = args.includes('--dry-run');
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];

if (!OPENAI_API_KEY && !dryRun) {
  console.error('OPENAI_API_KEY not set (checked process.env and .env.local)');
  process.exit(1);
}

async function loadAllPaperMeta() {
  const papersDir = path.join(POSTS_DIR, 'papers');
  const slugs = await fs.readdir(papersDir);
  const out = [];
  for (const slug of slugs) {
    if (slugArg && slug !== slugArg) continue;
    const metaPath = path.join(papersDir, slug, 'meta.json');
    try {
      const raw = await fs.readFile(metaPath, 'utf-8');
      out.push({ slug, meta: JSON.parse(raw) });
    } catch {
      // not a paper dir, skip
    }
  }
  if (slugArg && out.length === 0) {
    console.error(`No meta.json for slug=${slugArg}`);
    process.exit(1);
  }
  return out;
}

async function fetchExisting(slugs) {
  if (slugs.length === 0) return new Map();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('paper_embeddings')
    .select('slug, content_hash, embedding_model, builder_version')
    .in('slug', slugs);
  if (error) throw new Error(`fetch existing failed: ${error.message}`);
  return new Map((data ?? []).map(r => [r.slug, r]));
}

async function getEmbeddings(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.data.map(d => d.embedding);
}

async function main() {
  const papers = await loadAllPaperMeta();
  console.log(`Loaded ${papers.length} paper meta.json file(s)`);

  const built = papers.map(({ slug, meta }) => {
    const { text, hash } = buildEmbeddingText(meta);
    return { slug, meta, text, hash };
  });

  const existing = dryRun ? new Map() : await fetchExisting(built.map(b => b.slug));

  const stale = built.filter(b => {
    if (force) return true;
    const ex = existing.get(b.slug);
    if (!ex) return true;
    return ex.content_hash !== b.hash
        || ex.embedding_model !== MODEL
        || ex.builder_version !== BUILDER_VERSION;
  });

  console.log(`Stale: ${stale.length}/${built.length} (force=${force})`);

  if (dryRun) {
    for (const s of stale) {
      console.log(`  - ${s.slug}  hash=${s.hash}  text=${s.text.length}c`);
    }
    console.log(`[dry-run] would call OpenAI for ${stale.length} paper(s)`);
    return;
  }

  if (stale.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const supabase = getSupabase();
  let upserted = 0;

  for (let i = 0; i < stale.length; i += BATCH_SIZE) {
    const batch = stale.slice(i, i + BATCH_SIZE);
    const texts = batch.map(b => b.text);
    const vectors = await getEmbeddings(texts);

    const rows = batch.map((b, j) => ({
      slug: b.slug,
      cluster: 'main',
      content_hash: b.hash,
      embedding_model: MODEL,
      builder_version: BUILDER_VERSION,
      embedding: JSON.stringify(vectors[j]),
      embedded_text: b.text,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('paper_embeddings')
      .upsert(rows, { onConflict: 'slug' });

    if (error) {
      console.error(`✗ batch ${i}-${i + batch.length} failed: ${error.message}`);
    } else {
      upserted += rows.length;
      console.log(`  ✓ ${i + batch.length}/${stale.length}`);
    }
  }

  console.log(`Done: upserted ${upserted}/${stale.length}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
