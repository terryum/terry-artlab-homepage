#!/usr/bin/env node

/**
 * check-embedding-milestone.mjs
 * Print a one-time reminder when paper count crosses a 2x milestone
 * (50, 100, 200, 400, 800, 1600, 3200). Runs as Claude Code SessionStart hook.
 *
 * Usage:
 *   node scripts/check-embedding-milestone.mjs               # check & remind
 *   node scripts/check-embedding-milestone.mjs --acknowledge=<n>  # mark done
 *   node scripts/check-embedding-milestone.mjs --status      # debug
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { POSTS_DIR } from './lib/paths.mjs';

const MILESTONES = [50, 100, 200, 400, 800, 1600, 3200, 6400];

const STATE_DIR = path.join(
  os.homedir(),
  '.claude/projects/-Users-terrytaewoongum-Codes-personal-terry-papers/state'
);
const STATE_FILE = path.join(STATE_DIR, 'embedding-milestones.json');
const WEIGHTS_FILE = path.join(
  os.homedir(),
  'Codes/personal/terry-papers/config/search-weights.json'
);

const args = process.argv.slice(2);
const ackArg = args.find(a => a.startsWith('--acknowledge='))?.split('=')[1];
const statusOnly = args.includes('--status');

async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { last_acknowledged_milestone: 0, current_paper_count: 0, last_check: null };
  }
}

async function writeState(state) {
  await fs.mkdir(STATE_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

async function countPapers() {
  const papersDir = path.join(POSTS_DIR, 'papers');
  let n = 0;
  try {
    const entries = await fs.readdir(papersDir);
    for (const slug of entries) {
      try {
        await fs.access(path.join(papersDir, slug, 'meta.json'));
        n++;
      } catch { /* skip */ }
    }
  } catch { /* posts dir missing */ }
  return n;
}

async function readWeightsTunedAt() {
  try {
    const raw = await fs.readFile(WEIGHTS_FILE, 'utf-8');
    const w = JSON.parse(raw);
    return w._tuned_at_paper_count ?? null;
  } catch {
    return null;
  }
}

function actionsFor(milestone) {
  const lines = [
    '  • [tune]    Re-tune weights in config/search-weights.json',
    '  • [model]   Confirm OpenAI text-embedding-3-small is not deprecated',
  ];
  if (milestone >= 100) {
    lines.push('  • [reindex] REINDEX paper_embeddings_hnsw  (~수초, ANN balance)');
  }
  if (milestone >= 800) {
    lines.push('  • [cluster] Review paper_embeddings.cluster — split if domains diverged');
  }
  return lines;
}

async function main() {
  const state = await readState();

  if (ackArg) {
    const n = parseInt(ackArg, 10);
    if (Number.isFinite(n)) {
      state.last_acknowledged_milestone = n;
      state.last_check = new Date().toISOString();
      await writeState(state);
      console.log(`✓ Acknowledged milestone ${n}`);
    }
    return;
  }

  const current = await countPapers();
  state.current_paper_count = current;
  state.last_check = new Date().toISOString();

  if (statusOnly) {
    console.log(JSON.stringify(state, null, 2));
    await writeState(state);
    return;
  }

  const last = state.last_acknowledged_milestone ?? 0;
  const due = MILESTONES.find(m => m > last && current >= m);

  if (!due) {
    await writeState(state);
    return; // silent — most sessions
  }

  const tunedAt = await readWeightsTunedAt();
  const lines = [
    '',
    `📊 Knowledge DB Milestone — papers reached ${current} (crossed ${due})`,
    '',
    'Recommended before next heavy /paper-search session:',
    ...actionsFor(due),
    '',
    tunedAt !== null ? `   weights last tuned at paper_count=${tunedAt}` : '',
    `   ack via:  node scripts/check-embedding-milestone.mjs --acknowledge=${due}`,
    '',
  ].filter(Boolean);

  console.log(lines.join('\n'));
  await writeState(state);
}

main().catch(err => {
  // SessionStart hooks must never block the session — log and continue
  console.error('milestone check skipped:', err.message);
});
