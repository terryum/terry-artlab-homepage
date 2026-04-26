#!/usr/bin/env node
// Generates the two 16:9 thumbnail cards used by the English Featured Elsewhere
// section: profile photo as blurred background, sharp circular profile in the
// centre, and a brand logo in the bottom-right corner.
//
// Outputs:
//   public/images/featured-codes.webp   (GitHub overlay)
//   public/images/featured-papers.webp  (Google Scholar overlay)
//
// Usage: npm run generate-en-overlays

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PROFILE = path.join(ROOT, 'public/images/profile_terry.webp');
const LOGO_DIR = path.join(ROOT, 'public/logos');
const OUT_DIR = path.join(ROOT, 'public/images');

const W = 1280;
const H = 720;
const PROFILE_DIAM = 480;
const LOGO_BG_DIAM = 160;     // outer white circle
const LOGO_INNER = 96;        // inner logo glyph
const MARGIN = 56;            // distance from bottom-right edges

function tintedSvg(buf, color) {
  const text = buf.toString('utf8');
  // Inject fill into the root <svg ...> tag — children inherit it.
  return Buffer.from(text.replace('<svg ', `<svg fill="${color}" `));
}

async function makeOverlay(name, logoBuf, logoColor) {
  // 1. Background: profile cover-fitted to 16:9, heavily blurred.
  const bg = await sharp(PROFILE)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .blur(40)
    .toBuffer();

  // 2. Dark dim overlay (50% black) to push the bg back.
  const dim = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } },
  }).png().toBuffer();

  // 3. Centre: sharp circular profile.
  const circleMask = Buffer.from(
    `<svg width="${PROFILE_DIAM}" height="${PROFILE_DIAM}">
       <circle cx="${PROFILE_DIAM / 2}" cy="${PROFILE_DIAM / 2}" r="${PROFILE_DIAM / 2}" fill="white"/>
     </svg>`
  );
  const circularProfile = await sharp(PROFILE)
    .resize(PROFILE_DIAM, PROFILE_DIAM, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 4. Bottom-right: white circle "badge" containing the brand logo.
  const whiteBadge = Buffer.from(
    `<svg width="${LOGO_BG_DIAM}" height="${LOGO_BG_DIAM}">
       <circle cx="${LOGO_BG_DIAM / 2}" cy="${LOGO_BG_DIAM / 2}" r="${LOGO_BG_DIAM / 2}" fill="white"/>
     </svg>`
  );
  const logoGlyph = await sharp(tintedSvg(logoBuf, logoColor), { density: 384 })
    .resize(LOGO_INNER, LOGO_INNER, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const profileLeft = Math.round((W - PROFILE_DIAM) / 2);
  const profileTop  = Math.round((H - PROFILE_DIAM) / 2);
  const badgeLeft = W - LOGO_BG_DIAM - MARGIN;
  const badgeTop  = H - LOGO_BG_DIAM - MARGIN;
  const glyphLeft = badgeLeft + Math.round((LOGO_BG_DIAM - LOGO_INNER) / 2);
  const glyphTop  = badgeTop  + Math.round((LOGO_BG_DIAM - LOGO_INNER) / 2);

  const out = path.join(OUT_DIR, `featured-${name}.webp`);
  await sharp(bg)
    .composite([
      { input: dim,             top: 0,            left: 0 },
      { input: circularProfile, top: profileTop,   left: profileLeft },
      { input: whiteBadge,      top: badgeTop,     left: badgeLeft },
      { input: logoGlyph,       top: glyphTop,     left: glyphLeft },
    ])
    .webp({ quality: 90 })
    .toFile(out);
  console.log(`✓ ${path.relative(ROOT, out)}`);
}

async function main() {
  const githubSvg     = readFileSync(path.join(LOGO_DIR, 'github.svg'));
  const scholarSvg    = readFileSync(path.join(LOGO_DIR, 'googlescholar.svg'));

  // GitHub brand black; Google Scholar Google-blue.
  await makeOverlay('codes',  githubSvg,  '#181717');
  await makeOverlay('papers', scholarSvg, '#4285F4');
}

main().catch(err => { console.error(err); process.exit(1); });
