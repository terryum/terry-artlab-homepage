#!/usr/bin/env node

/**
 * generate-embeddings.mjs
 * Generate OpenAI embeddings for posts and store in Supabase papers.embedding column.
 *
 * Usage:
 *   node scripts/generate-embeddings.mjs              # all posts
 *   node scripts/generate-embeddings.mjs --slug=xxx   # single post
 *   node scripts/generate-embeddings.mjs --dry-run    # preview embedding text
 */

import fs from 'fs/promises';
import path from 'path';
import { POSTS_DIR } from './lib/paths.mjs';
import { getSupabase } from './lib/supabase.mjs';
import { loadEnv } from './lib/env.mjs';

await loadEnv();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 50; // OpenAI allows up to 2048, but keep batches small

// CLI args
const args = process.argv.slice(2);
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

if (!OPENAI_API_KEY && !dryRun) {
  console.error('OPENAI_API_KEY not set in .env.local');
  process.exit(1);
}

/** Build the text to embed for a post (bilingual, ~200-400 tokens). */
function buildEmbeddingText(post) {
  const parts = [];

  // English
  parts.push(`[EN] ${post.title_en || ''}`);
  if (post.summary_en) parts.push(post.summary_en);
  const ai = post.ai_summary;
  if (ai?.one_liner) parts.push(ai.one_liner);
  if (ai?.problem) parts.push(`Problem: ${ai.problem}`);
  if (ai?.solution) parts.push(`Solution: ${ai.solution}`);

  // Korean
  parts.push(`[KO] ${post.title_ko || ''}`);
  if (post.summary_ko) parts.push(post.summary_ko);

  // Structured metadata
  if (post.key_concepts?.length) parts.push(`Concepts: ${post.key_concepts.join(', ')}`);
  if (post.methodology?.length) parts.push(`Methods: ${post.methodology.join(', ')}`);
  if (post.domain) parts.push(`Domain: ${post.domain}`);
  if (post.subfields?.length) parts.push(`Subfields: ${post.subfields.join(', ')}`);

  return parts.filter(Boolean).join('\n');
}

/** Call OpenAI embeddings API. */
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
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data.map(d => d.embedding);
}

async function main() {
  // Load index.json
  const indexPath = path.join(POSTS_DIR, 'index.json');
  const index = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
  let posts = index.posts;

  if (slugArg) {
    posts = posts.filter(p => p.slug === slugArg);
    if (posts.length === 0) {
      console.error(`Post not found: ${slugArg}`);
      process.exit(1);
    }
  }

  console.log(`Generating embeddings for ${posts.length} post(s)...`);

  if (dryRun) {
    for (const post of posts) {
      const text = buildEmbeddingText(post);
      console.log(`\n--- ${post.slug} (${text.length} chars) ---`);
      console.log(text);
    }
    console.log(`\n[dry-run] ${posts.length} post(s) previewed.`);
    return;
  }

  const supabase = getSupabase();
  let totalUpdated = 0;

  // Process in batches
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const texts = batch.map(p => buildEmbeddingText(p));
    const embeddings = await getEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      const { error } = await supabase
        .from('papers')
        .update({ embedding: JSON.stringify(embeddings[j]) })
        .eq('slug', batch[j].slug);

      if (error) {
        console.warn(`  Failed: ${batch[j].slug}: ${error.message}`);
      } else {
        totalUpdated++;
      }
    }
  }

  console.log(`Done: ${totalUpdated}/${posts.length} embeddings updated.`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
