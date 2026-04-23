/**
 * CI guard: fail if a public post's locale-specific detail route is missing
 * from the OpenNext prerender manifest. Catches the ko→404 regression where
 * generateStaticParams silently drops paths on some build environments.
 *
 * Reads posts/index.json for the authoritative list of public posts and
 * .open-next/server-functions/default/.next/prerender-manifest.json for the
 * actual prerendered route set. Only enforces locales whose <locale>.mdx
 * file exists under posts/<content_type>/<slug>/.
 */
import fs from 'node:fs';
import path from 'node:path';

const MANIFEST_PATH = '.open-next/server-functions/default/.next/prerender-manifest.json';
const INDEX_PATH = 'posts/index.json';
const LOCALES = ['ko', 'en'];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(MANIFEST_PATH)) fail(`prerender-manifest not found at ${MANIFEST_PATH}`);
if (!fs.existsSync(INDEX_PATH)) fail(`posts/index.json not found`);

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
const routes = manifest.routes || {};

const publicPosts = (index.posts || []).filter(
  (p) => (p.visibility || 'public') === 'public'
);

const missing = [];
let checked = 0;
for (const post of publicPosts) {
  const { slug, content_type } = post;
  if (!slug || !content_type) continue;
  const postDir = path.join('posts', content_type, slug);
  if (!fs.existsSync(postDir)) continue;
  for (const locale of LOCALES) {
    const mdxPath = path.join(postDir, `${locale}.mdx`);
    if (!fs.existsSync(mdxPath)) continue;
    checked++;
    const route = `/${locale}/posts/${slug}`;
    if (!(route in routes)) missing.push(route);
  }
}

if (missing.length) {
  console.error(`✗ Prerender manifest is missing ${missing.length} of ${checked} expected route(s):`);
  for (const p of missing.slice(0, 30)) console.error(`  - ${p}`);
  if (missing.length > 30) console.error(`  ... and ${missing.length - 30} more`);
  process.exit(1);
}

console.log(`✓ Prerender manifest OK — ${checked} route(s) across ${publicPosts.length} public posts verified.`);
