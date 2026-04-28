#!/usr/bin/env node
/**
 * process-content-images.mjs — single source of truth for cover/og/thumb assets.
 *
 * Standard 4-asset spec (shared by /post, /survey, /project):
 *
 *   cover : WebP q90, max-width 1200, height ≤ 1200 (square for survey/project,
 *           variable for post). Flatten white background.   ≤ ~500 KB.
 *   og    : PNG  q90 compressionLevel 8, 1200×630.           ≤ ~500 KB
 *           (Bluesky 1MB hard limit safe margin).
 *   thumb : WebP q80, 288×288 cover-centre crop.             ≤ ~20 KB.
 *
 * Usage
 *   # post: derive from cover_Original.{png,jpg} or existing cover.webp
 *   node scripts/process-content-images.mjs --type=post --slug=<slug>
 *   node scripts/process-content-images.mjs --type=post --slug=<slug> --source=<path>
 *
 *   # survey/project: derive from existing -cover.webp or --source raw
 *   node scripts/process-content-images.mjs --type=survey  --slug=survey-<name>
 *   node scripts/process-content-images.mjs --type=survey  --slug=survey-<name> --source=<path>
 *   node scripts/process-content-images.mjs --type=project --slug=<name>
 *
 * --force re-runs even if outputs already match spec.
 * --dry-run prints planned outputs without writing.
 *
 * Idempotent: skips work when output files already meet the spec
 * (correct dimensions + format + size budget).
 *
 * Why this lives in terryum-ai: assets are stored here, sharp is already
 * a dependency, and the spec must be defined exactly once. /post (terry-obsidian)
 * and /survey (terry-surveys) both call this utility instead of running their
 * own sharp pipelines — single source of truth.
 */

import sharp from 'sharp';
import { readdir, stat, readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

// --- spec --------------------------------------------------------------
const SPEC = {
  cover: { width: 1200, height: 1200, fit: 'inside', quality: 90, format: 'webp' },
  coverSquare: { width: 1200, height: 1200, fit: 'cover', position: 'centre', quality: 90, format: 'webp' },
  og:    { width: 1200, height: 630,  fit: 'cover',  position: 'centre', quality: 90, format: 'png' },
  thumb: { width: 288,  height: 288,  fit: 'cover',  position: 'centre', quality: 80, format: 'webp' },
};

const SIZE_BUDGET = {
  cover: 500 * 1024,  // 500 KB
  og:    500 * 1024,  // 500 KB (Bluesky 1MB safe margin)
  thumb:  20 * 1024,  // 20  KB
};

// --- args --------------------------------------------------------------
function parseArgs(argv) {
  const out = { type: null, slug: null, source: null, force: false, dryRun: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--type='))   out.type = a.slice(7);
    else if (a.startsWith('--slug='))   out.slug = a.slice(7);
    else if (a.startsWith('--source=')) out.source = a.slice(9);
    else if (a === '--force')           out.force = true;
    else if (a === '--dry-run')         out.dryRun = true;
  }
  return out;
}

// --- path resolution --------------------------------------------------
async function findPostDir(slug) {
  // posts/{type}/{slug}/ — type is essays|memos|threads|tech|papers
  const types = ['essays', 'memos', 'threads', 'tech', 'papers'];
  for (const t of types) {
    const p = join(ROOT, 'posts', t, slug);
    if (existsSync(p)) return p;
  }
  return null;
}

function surveyOutputs(slug) {
  const base = join(ROOT, 'public', 'images', 'projects');
  return {
    cover: join(base, `${slug}-cover.webp`),
    og:    join(base, `${slug}-og.png`),
    thumb: join(base, `${slug}-thumb.webp`),
  };
}

function postOutputs(postDir) {
  return {
    cover: join(postDir, 'cover.webp'),
    og:    join(postDir, 'og.png'),       // generate-og-image.mjs writes to public/posts/{slug}/og.png too;
                                          // here we co-locate with cover for /post pipeline (R2 sync handles relocation)
    thumb: join(postDir, 'cover-thumb.webp'),
  };
}

// --- spec compliance check --------------------------------------------
async function meetsSpec(path, asset) {
  if (!existsSync(path)) return false;
  const size = statSync(path).size;
  if (size > SIZE_BUDGET[asset]) return false;
  try {
    const meta = await sharp(path).metadata();
    const spec = (asset === 'cover') ? SPEC.coverSquare : SPEC[asset];
    if (asset === 'cover') {
      // any of: exact match, or within tolerance (±2px from resize rounding)
      if (Math.abs(meta.width  - spec.width)  > 2) return false;
      if (Math.abs(meta.height - spec.height) > 2) return false;
    } else {
      if (Math.abs(meta.width  - spec.width)  > 2) return false;
      if (Math.abs(meta.height - spec.height) > 2) return false;
    }
    if (asset === 'og'    && meta.format !== 'png')  return false;
    if (asset !== 'og'    && meta.format !== 'webp') return false;
    return true;
  } catch {
    return false;
  }
}

// --- pipelines --------------------------------------------------------
async function readBuf(p) {
  return readFile(p);  // read whole file as Buffer (handles in-place writes)
}

async function processCover(srcPath, dstPath, mode = 'square') {
  const spec = (mode === 'square') ? SPEC.coverSquare : SPEC.cover;
  const buf = await readBuf(srcPath);
  await sharp(buf)
    .flatten({ background: 'white' })
    .resize(spec.width, spec.height, {
      fit: spec.fit,
      position: spec.position || 'centre',
      withoutEnlargement: false,
    })
    .webp({ quality: spec.quality })
    .toFile(dstPath);
}

async function deriveOg(coverPath, ogPath) {
  const buf = await readBuf(coverPath);
  await sharp(buf)
    .flatten({ background: 'white' })
    .resize(SPEC.og.width, SPEC.og.height, { fit: SPEC.og.fit, position: SPEC.og.position })
    .png({ quality: SPEC.og.quality, compressionLevel: 8 })
    .toFile(ogPath);
}

async function deriveThumb(coverPath, thumbPath) {
  const buf = await readBuf(coverPath);
  await sharp(buf)
    .flatten({ background: 'white' })
    .resize(SPEC.thumb.width, SPEC.thumb.height, { fit: SPEC.thumb.fit, position: SPEC.thumb.position })
    .webp({ quality: SPEC.thumb.quality })
    .toFile(thumbPath);
}

// --- main -------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv);

  if (!args.type || !args.slug) {
    console.error('Usage: process-content-images.mjs --type=post|survey|project --slug=<slug> [--source=<path>] [--force] [--dry-run]');
    process.exit(2);
  }
  if (!['post', 'survey', 'project'].includes(args.type)) {
    console.error(`Unknown --type=${args.type}`);
    process.exit(2);
  }

  // Resolve outputs + source
  let outputs, sourcePath, mode;
  if (args.type === 'post') {
    const postDir = await findPostDir(args.slug);
    if (!postDir) {
      console.error(`Post directory not found for slug=${args.slug}`);
      process.exit(2);
    }
    outputs = postOutputs(postDir);
    mode = 'variable';
    if (args.source) {
      sourcePath = args.source;
    } else {
      // Prefer cover_Original.* > existing cover.webp
      const orig = ['png', 'jpg', 'jpeg', 'webp'].map(ext => join(postDir, `cover_Original.${ext}`)).find(existsSync);
      sourcePath = orig || (existsSync(outputs.cover) ? outputs.cover : null);
    }
  } else {
    outputs = surveyOutputs(args.slug);
    mode = 'square';
    sourcePath = args.source || (existsSync(outputs.cover) ? outputs.cover : null);
  }

  if (!sourcePath || !existsSync(sourcePath)) {
    console.error(`No source image found. Use --source=<path>`);
    process.exit(2);
  }

  console.log(`[process-content-images] type=${args.type} slug=${args.slug}`);
  console.log(`  source: ${sourcePath}`);

  // For each asset, check compliance and (re)process
  const work = [];
  // cover: process from source (skip if source IS the cover and already compliant)
  if (args.force || !(await meetsSpec(outputs.cover, 'cover'))) {
    work.push(['cover', () => processCover(sourcePath, outputs.cover, mode)]);
  }
  // og + thumb: derived from cover (must run after cover if cover regenerated)
  // We always derive these from the (now-compliant) cover
  const coverWillExist = work.length > 0 || existsSync(outputs.cover);
  if (!coverWillExist) {
    console.error('Cover does not exist and not in queue; cannot derive og/thumb');
    process.exit(2);
  }
  if (args.force || !(await meetsSpec(outputs.og, 'og'))) {
    work.push(['og', () => deriveOg(outputs.cover, outputs.og)]);
  }
  if (args.force || !(await meetsSpec(outputs.thumb, 'thumb'))) {
    work.push(['thumb', () => deriveThumb(outputs.cover, outputs.thumb)]);
  }

  if (work.length === 0) {
    console.log('  ✓ All assets already meet spec — nothing to do');
    return;
  }

  if (args.dryRun) {
    console.log('  [dry-run] Would process:');
    for (const [name] of work) console.log(`    - ${name} → ${outputs[name]}`);
    return;
  }

  for (const [name, fn] of work) {
    await fn();
    const size = statSync(outputs[name]).size;
    const budget = SIZE_BUDGET[name];
    const status = size <= budget ? '✓' : '⚠ over budget';
    console.log(`  ${status} ${name} → ${outputs[name]} (${(size / 1024).toFixed(1)} KB / ${(budget / 1024).toFixed(0)} KB budget)`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
