/**
 * Generates ASCII-named, web-sized derivatives for the English pages.
 *
 * The originals in public/images/logos/ have Korean filenames and are referenced
 * by src/pages/corporate-event.astro, so they must NOT be renamed in place —
 * doing so breaks the Korean page. We emit copies into public/images/en/logos/
 * instead, which also keeps Korean strings out of /en/ markup.
 *
 * Run: node scripts/build-en-assets.mjs
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'public/images/logos');
const out = resolve(root, 'public/images/en/logos');

// Chosen for recognition to a US buyer. Korea-domestic marks are deliberately
// excluded — an American shop owner cannot read them and they read as filler.
const LOGOS = {
  'netflix.webp': '넷플릭스_NETFLIX.png',
  'google.webp': '구글 GOOGLE.png',
  'nike.webp': '나이키 NIKE.png',
  'adidas.webp': '아디다스 ADIDAS.png',
  'gucci.webp': '구찌_GUCCI.png',
  'hermes.webp': '에르메스 HERMES.png',
  'bmw.webp': 'BMW.png',
  'coach.webp': 'COACH.png',
  'swarovski.webp': '스와로브스키.png',
  'tiktok.webp': '틱톡 TIKTOK.png',
  'adobe.webp': 'adobe_어도비.png',
  'samsung.webp': '삼성.png',
};

await mkdir(out, { recursive: true });

const available = await readdir(src);
let total = 0;

for (const [name, original] of Object.entries(LOGOS)) {
  const from = resolve(src, original);
  if (!existsSync(from)) {
    console.error(`MISSING  ${original}  (have: ${available.filter((f) => f.includes(original.slice(0, 3))).join(', ') || 'no near match'})`);
    continue;
  }
  const info = await sharp(from)
    // 2x the ~112px render height; contain so odd aspect ratios keep their shape
    .resize({ width: 240, height: 120, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(resolve(out, name));
  total += info.size;
  console.log(`${name.padEnd(18)} ${String(Math.round(info.size / 1024)).padStart(4)} KB   ${info.width}x${info.height}`);
}

console.log(`\n${Object.keys(LOGOS).length} logos, ${Math.round(total / 1024)} KB total`);

/*
 * Technical line drawings.
 *
 * The originals are 40–136 KB PNGs rendered at 56–320px wide on the English
 * pages — roughly 700 KB of waste. They cannot be re-encoded in place because
 * src/pages/support/[slug].astro serves the same files, so we emit WebP copies
 * into public/images/en/line/ and point only the /en/ pages at those.
 *
 * classic-picky-line.png is byte-identical to modern-picky-line.png, so eight
 * drawings cover all nine models.
 */
const lineSrc = resolve(root, 'public/images/products');
const lineOut = resolve(root, 'public/images/en/line');
const DRAWINGS = [
  'modern-picky', 'urban-picky', 'modern-mini-picky', 'urban-mini-picky',
  'modern-retro-picky', 'urban-retro-picky', 'outdoor-picky', 'air-picky',
];

await mkdir(lineOut, { recursive: true });
let lineBefore = 0;
let lineAfter = 0;

for (const id of DRAWINGS) {
  const from = resolve(lineSrc, `${id}-line.png`);
  if (!existsSync(from)) {
    console.error(`MISSING  ${id}-line.png`);
    continue;
  }
  lineBefore += (await sharp(from).metadata()).size ?? 0;
  // 640px tall covers the largest render (~320px) at 2x
  const info = await sharp(from)
    .resize({ height: 640, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(resolve(lineOut, `${id}.webp`));
  lineAfter += info.size;
  console.log(`${(id + '.webp').padEnd(26)} ${String(Math.round(info.size / 1024)).padStart(4)} KB   ${info.width}x${info.height}`);
}

console.log(`\n${DRAWINGS.length} drawings, ${Math.round(lineBefore / 1024)} KB PNG -> ${Math.round(lineAfter / 1024)} KB WebP`);
