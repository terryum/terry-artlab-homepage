#!/usr/bin/env node

/**
 * post-publish-pipeline.mjs
 *
 * Run the build/upload pipeline for a single post in parallel where possible.
 * Replaces the manual chain of `generate-thumbnails → generate-index → generate-og-image →
 * flatten-transparent-figures → upload-to-r2 → generate-embeddings` with a single command.
 *
 * Dependency graph:
 *   [parallel] generate-thumbnails | generate-og-image | generate-embeddings | generate-index
 *        └─→ (await all)
 *   [serial]   flatten-transparent-figures public/posts/<slug>/
 *        └─→ upload-to-r2 --slug=<slug>
 *
 * Usage:
 *   node scripts/post-publish-pipeline.mjs --slug=260422-work-that-isnt
 *   node scripts/post-publish-pipeline.mjs --slug=xxx --skip-embeddings
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
);

const slug = flags.slug;
if (!slug) {
  console.error('❌ --slug=<slug> is required');
  process.exit(1);
}

const skipEmbeddings = !!flags['skip-embeddings'];
const skipIndex = !!flags['skip-index'];
const skipUpload = !!flags['skip-upload'];

const publicSlugDir = join(REPO_ROOT, 'public', 'posts', slug);

function run(label, cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    console.log(`▶ ${label}: ${cmd} ${cmdArgs.join(' ')}`);
    const child = spawn(cmd, cmdArgs, { stdio: 'inherit', cwd: REPO_ROOT });
    child.on('exit', (code) => {
      const ms = Date.now() - start;
      if (code === 0) {
        console.log(`✓ ${label} (${ms}ms)`);
        resolve(ms);
      } else {
        reject(new Error(`${label} exited with code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

const t0 = Date.now();

// ── Group A: independent steps run in parallel ──
const groupA = [
  run('generate-thumbnails', 'node', ['scripts/generate-thumbnails.mjs']),
  run('generate-og-image', 'node', ['scripts/generate-og-image.mjs']),
];

if (!skipIndex) {
  groupA.push(run('generate-index', 'node', ['scripts/generate-index.mjs']));
}

if (!skipEmbeddings) {
  groupA.push(
    run('generate-embeddings', 'node', [
      'scripts/generate-embeddings.mjs',
      `--slug=${slug}`,
    ]),
  );
}

await Promise.all(groupA);

// ── Group B: flatten depends on thumbs+og output ──
if (existsSync(publicSlugDir)) {
  await run('flatten-transparent-figures', 'python3', [
    'scripts/flatten-transparent-figures.py',
    `public/posts/${slug}/`,
  ]);
} else {
  console.warn(`⚠ ${publicSlugDir} not found — skipping flatten`);
}

// ── Group C: upload depends on flattened files ──
if (!skipUpload) {
  await run('upload-to-r2', 'node', [
    'scripts/upload-to-r2.mjs',
    `--slug=${slug}`,
  ]);
}

const total = Date.now() - t0;
console.log(`\n🎉 Pipeline complete for ${slug} in ${(total / 1000).toFixed(1)}s`);
