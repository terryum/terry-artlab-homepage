#!/usr/bin/env node

/**
 * sync-related-posts.mjs
 *
 * Bidirectional sync + normalization for related_posts / relations across
 * essays / notes / papers meta.json files.
 *
 * Modes:
 *   --slug=<slug> --add=<slug,slug,...> [--type=<relation_type>]
 *       Add related links to <slug> and reverse-link from each target.
 *   --backfill=<slug,slug,...>
 *       Re-emit relations from existing related_posts on each given slug,
 *       and ensure all targets reverse-link back. Useful to fix one folder.
 *   --all
 *       Walk every published post: normalize keys (slug→target),
 *       fill null relations from related_posts, and ensure every link
 *       is bidirectional.
 *   --dry-run
 *       Print the diff but don't write any files.
 *
 * Notes on the schema:
 *   meta.json.related_posts : string[]  (target slugs, dedup, sorted)
 *   meta.json.relations     : Array<{ target: string, type: string, note?: string }>
 *
 * The reverse-link's relation type defaults to "related" because reverse
 * direction is often semantically asymmetric (e.g. extends has no clean
 * inverse). Override forward type with --type=<...>.
 */

import fs from 'fs/promises';
import path from 'path';
import { POSTS_DIR, getContentDirs } from './lib/paths.mjs';

const args = parseArgs(process.argv.slice(2));
const DRY = !!args['dry-run'];

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, ...rest] = arg.slice(2).split('=');
    out[k] = rest.length ? rest.join('=') : true;
  }
  return out;
}

async function findMetaPath(slug, contentDirs) {
  for (const dir of contentDirs) {
    const p = path.join(POSTS_DIR, dir, slug, 'meta.json');
    try {
      await fs.access(p);
      return p;
    } catch { /* not in this dir */ }
  }
  return null;
}

async function loadAllSlugs(contentDirs) {
  const all = new Set();
  for (const dir of contentDirs) {
    const root = path.join(POSTS_DIR, dir);
    let entries;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        await fs.access(path.join(root, e.name, 'meta.json'));
        all.add(e.name);
      } catch { /* no meta */ }
    }
  }
  return all;
}

async function readMeta(metaPath) {
  const raw = await fs.readFile(metaPath, 'utf-8');
  return JSON.parse(raw);
}

async function writeMeta(metaPath, meta) {
  if (DRY) return;
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
}

/**
 * Normalize meta.relations + meta.related_posts in place.
 * - relations[].slug -> relations[].target  (preserve note + type)
 * - relations === null -> derive from related_posts
 * - related_posts deduped + sorted
 * - relations deduped by target + sorted by target
 *
 * Returns true if mutated.
 */
function normalizeMeta(meta, knownSlugs, selfSlug, warnings) {
  let changed = false;

  if (!Array.isArray(meta.related_posts)) meta.related_posts = [];
  const beforeRP = JSON.stringify(meta.related_posts);
  meta.related_posts = [...new Set(meta.related_posts)].sort();
  if (JSON.stringify(meta.related_posts) !== beforeRP) changed = true;

  let relations = meta.relations;
  if (relations == null) relations = [];

  // Normalize keys: slug -> target
  const normalized = relations.map((r) => {
    const target = r.target ?? r.slug;
    const out = { target, type: r.type ?? 'related' };
    if (r.note) out.note = r.note;
    return out;
  });

  // If relations was null but related_posts had entries, derive missing edges
  for (const rp of meta.related_posts) {
    if (!normalized.some((r) => r.target === rp)) {
      normalized.push({ target: rp, type: 'related' });
    }
  }

  // Deduplicate by target (last-write-wins to preserve any typed entry)
  const dedup = new Map();
  for (const r of normalized) {
    if (r.target === selfSlug) continue;
    if (knownSlugs && !knownSlugs.has(r.target)) {
      warnings.push(`unknown target: ${selfSlug} → ${r.target}`);
      continue;
    }
    const existing = dedup.get(r.target);
    if (!existing) {
      dedup.set(r.target, r);
    } else {
      // prefer typed (non-related) over generic 'related'
      if (existing.type === 'related' && r.type !== 'related') {
        dedup.set(r.target, r);
      } else if (r.note && !existing.note) {
        dedup.set(r.target, { ...existing, note: r.note });
      }
    }
  }
  const finalRelations = [...dedup.values()].sort((a, b) =>
    a.target.localeCompare(b.target)
  );

  // Ensure related_posts is the union of relations[].target
  for (const r of finalRelations) {
    if (!meta.related_posts.includes(r.target)) {
      meta.related_posts.push(r.target);
    }
  }
  meta.related_posts = [...new Set(meta.related_posts)].sort();

  if (JSON.stringify(meta.relations) !== JSON.stringify(finalRelations)) {
    changed = true;
  }
  meta.relations = finalRelations;

  return changed;
}

/**
 * Add forward links from sourceSlug to addList,
 * then reverse-link each target back to sourceSlug.
 * Returns the set of slugs whose meta.json mutated.
 */
async function addLinks(sourceSlug, addList, type, contentDirs, knownSlugs, warnings) {
  const touched = new Set();

  const sourceMetaPath = await findMetaPath(sourceSlug, contentDirs);
  if (!sourceMetaPath) {
    warnings.push(`source slug not found: ${sourceSlug}`);
    return touched;
  }
  const sourceMeta = await readMeta(sourceMetaPath);

  // Forward: source -> each target with optional typed relation
  if (!Array.isArray(sourceMeta.related_posts)) sourceMeta.related_posts = [];
  if (sourceMeta.relations == null) sourceMeta.relations = [];

  for (const t of addList) {
    if (t === sourceSlug) continue;
    if (knownSlugs && !knownSlugs.has(t)) {
      warnings.push(`add target not published: ${t}`);
      continue;
    }
    if (!sourceMeta.related_posts.includes(t)) sourceMeta.related_posts.push(t);
    const existing = sourceMeta.relations.find((r) => (r.target ?? r.slug) === t);
    if (!existing) {
      sourceMeta.relations.push({ target: t, type: type ?? 'related' });
    } else if (type && existing.type !== type) {
      existing.type = type;
      existing.target = existing.target ?? existing.slug;
      delete existing.slug;
    }
  }

  if (normalizeMeta(sourceMeta, knownSlugs, sourceSlug, warnings)) {
    await writeMeta(sourceMetaPath, sourceMeta);
    touched.add(sourceSlug);
  } else {
    // Even with no normalization diff, we may have appended an entry above
    await writeMeta(sourceMetaPath, sourceMeta);
    touched.add(sourceSlug);
  }

  // Reverse: each target -> source (always 'related')
  for (const t of addList) {
    if (t === sourceSlug) continue;
    const targetMetaPath = await findMetaPath(t, contentDirs);
    if (!targetMetaPath) continue;
    const targetMeta = await readMeta(targetMetaPath);

    if (!Array.isArray(targetMeta.related_posts)) targetMeta.related_posts = [];
    if (targetMeta.relations == null) targetMeta.relations = [];

    let mutated = false;
    if (!targetMeta.related_posts.includes(sourceSlug)) {
      targetMeta.related_posts.push(sourceSlug);
      mutated = true;
    }
    const has = targetMeta.relations.some((r) => (r.target ?? r.slug) === sourceSlug);
    if (!has) {
      targetMeta.relations.push({ target: sourceSlug, type: 'related' });
      mutated = true;
    }
    const normChanged = normalizeMeta(targetMeta, knownSlugs, t, warnings);
    if (mutated || normChanged) {
      await writeMeta(targetMetaPath, targetMeta);
      touched.add(t);
    }
  }

  return touched;
}

async function syncAll(contentDirs, knownSlugs, warnings) {
  const touched = new Set();

  // Pass 1: normalize every meta.json (slug→target, null→derived, dedup)
  for (const slug of knownSlugs) {
    const metaPath = await findMetaPath(slug, contentDirs);
    if (!metaPath) continue;
    const meta = await readMeta(metaPath);
    const before = JSON.stringify(meta);
    normalizeMeta(meta, knownSlugs, slug, warnings);
    if (JSON.stringify(meta) !== before) {
      await writeMeta(metaPath, meta);
      touched.add(slug);
    }
  }

  // Pass 2: ensure every link is bidirectional. We collect a directed edge
  // set, build the undirected closure, then write missing reverse links.
  const forward = new Map(); // slug -> Set<target>
  for (const slug of knownSlugs) {
    const metaPath = await findMetaPath(slug, contentDirs);
    if (!metaPath) continue;
    const meta = await readMeta(metaPath);
    const set = new Set();
    for (const t of meta.related_posts || []) set.add(t);
    for (const r of meta.relations || []) set.add(r.target);
    forward.set(slug, set);
  }

  for (const [slug, targets] of forward.entries()) {
    for (const t of targets) {
      if (t === slug) continue;
      if (!knownSlugs.has(t)) continue;
      const back = forward.get(t);
      if (!back || !back.has(slug)) {
        // need to add slug to t's meta
        const targetMetaPath = await findMetaPath(t, contentDirs);
        if (!targetMetaPath) continue;
        const targetMeta = await readMeta(targetMetaPath);
        if (!Array.isArray(targetMeta.related_posts)) targetMeta.related_posts = [];
        if (targetMeta.relations == null) targetMeta.relations = [];
        if (!targetMeta.related_posts.includes(slug)) targetMeta.related_posts.push(slug);
        if (!targetMeta.relations.some((r) => r.target === slug)) {
          targetMeta.relations.push({ target: slug, type: 'related' });
        }
        normalizeMeta(targetMeta, knownSlugs, t, warnings);
        await writeMeta(targetMetaPath, targetMeta);
        touched.add(t);
        // update in-memory closure so we don't loop redundantly
        forward.get(t).add(slug);
      }
    }
  }

  return touched;
}

async function backfill(slugs, contentDirs, knownSlugs, warnings) {
  const touched = new Set();
  for (const slug of slugs) {
    const metaPath = await findMetaPath(slug, contentDirs);
    if (!metaPath) {
      warnings.push(`backfill: slug not found: ${slug}`);
      continue;
    }
    const meta = await readMeta(metaPath);
    const targets = new Set([
      ...(meta.related_posts || []),
      ...((meta.relations || []).map((r) => r.target ?? r.slug)),
    ]);
    targets.delete(slug);
    const localTouched = await addLinks(
      slug,
      [...targets],
      undefined,
      contentDirs,
      knownSlugs,
      warnings,
    );
    for (const t of localTouched) touched.add(t);
  }
  return touched;
}

async function main() {
  const contentDirs = await getContentDirs();
  const knownSlugs = await loadAllSlugs(contentDirs);
  const warnings = [];
  let touched = new Set();

  if (args.all) {
    touched = await syncAll(contentDirs, knownSlugs, warnings);
  } else if (args.backfill) {
    const slugs = String(args.backfill).split(',').map((s) => s.trim()).filter(Boolean);
    touched = await backfill(slugs, contentDirs, knownSlugs, warnings);
  } else if (args.slug) {
    const addList = args.add
      ? String(args.add).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!addList.length) {
      console.error('--slug requires --add=<slug,slug,...>');
      process.exit(2);
    }
    touched = await addLinks(
      String(args.slug),
      addList,
      args.type ? String(args.type) : undefined,
      contentDirs,
      knownSlugs,
      warnings,
    );
  } else {
    console.error(
      'Usage:\n' +
      '  sync-related-posts.mjs --slug=<slug> --add=<slug,...> [--type=<type>] [--dry-run]\n' +
      '  sync-related-posts.mjs --backfill=<slug,...> [--dry-run]\n' +
      '  sync-related-posts.mjs --all [--dry-run]\n'
    );
    process.exit(2);
  }

  if (warnings.length) {
    for (const w of warnings) console.warn(`[warn] ${w}`);
  }

  if (touched.size === 0) {
    console.log(DRY ? '[dry-run] no changes' : 'no changes');
    return;
  }
  console.log(`${DRY ? '[dry-run] would update' : 'updated'} ${touched.size} meta.json file(s):`);
  for (const slug of [...touched].sort()) console.log(`  - ${slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
