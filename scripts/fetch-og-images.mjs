#!/usr/bin/env node
// Fetches OG images for press articles & GitHub repos in content/about/media.json
// and writes them back into the JSON. Idempotent — only fills items where
// thumbnail_url is missing.
//
// Usage: npm run fetch-og

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_PATH = path.join(__dirname, '..', 'content', 'about', 'media.json');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0 Safari/537.36';

async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8' },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Try og:image, then og:image:secure_url, then twitter:image.
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m && m[1]) {
        // Resolve relative URLs against the page URL.
        try { return new URL(m[1], url).toString(); } catch { return m[1]; }
      }
    }
    return null;
  } catch (err) {
    console.warn(`  ! ${url} → ${err.message}`);
    return null;
  }
}

async function main() {
  const data = JSON.parse(readFileSync(MEDIA_PATH, 'utf8'));
  const targetCategories = ['interviews', 'code'];
  let filled = 0;
  let skipped = 0;
  let failed = 0;

  for (const cat of targetCategories) {
    const items = data[cat] ?? [];
    for (const item of items) {
      if (item.thumbnail_url) {
        skipped++;
        continue;
      }
      process.stdout.write(`[${cat}] ${item.title_ko ?? item.title_en} … `);
      const og = await fetchOgImage(item.url);
      if (og) {
        item.thumbnail_url = og;
        console.log('✓');
        filled++;
      } else {
        console.log('— (no og:image)');
        failed++;
      }
    }
  }

  writeFileSync(MEDIA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`\nDone: ${filled} filled, ${skipped} skipped, ${failed} failed.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
