/**
 * Generates display-sized WebP derivatives for the home hero and the /products
 * carousel.
 *
 * The originals stay exactly where they are: og:image, the image sitemap,
 * JSON-LD and several other pages point at them, and some are replaced in
 * place by the team. Derivatives go to new web/ folders next to them:
 *
 *   public/images/hero/web/      main-mo{1,2,3}-{720,1080,1440}.webp   (mobile hero, 3:4, 100vw)
 *                                main-1-{1280,1440}.webp,
 *                                main-{2,3}-{1280,1920}.webp           (desktop hero, 100vw)
 *   public/images/products/web/  {id}-line.webp, {id}-photo.webp        (/products carousel)
 *
 * Why: the mobile hero (the home page's LCP image) shipped as a 2595x4096 WebP
 * (176 KB) and slides 2-3 as 4688x7400 (about 139 MB each once decoded) for a
 * ~412px wide screen; the /products drawings are 1-2.3k px tall PNGs shown at
 * most 480px tall.
 *
 * Re-run after replacing a source image. If a product drawing/photo changes
 * shape, paste the sizes printed at the end into src/data/products.ts.
 *
 * Run: node scripts/build-web-images.mjs
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const img = (...p) => resolve(root, 'public/images', ...p);
const kb = (n) => `${Math.round(n / 1024)} KB`;

let total = 0;
let files = 0;

async function emit(from, to, resize, encode) {
  if (!existsSync(from)) {
    console.error(`MISSING  ${from}`);
    return null;
  }
  const info = await sharp(from).resize(resize).webp(encode).toFile(to);
  total += info.size;
  files += 1;
  const src = (await stat(from)).size;
  console.log(`${basename(to).padEnd(30)} ${kb(info.size).padStart(7)}  ${`${info.width}x${info.height}`.padEnd(10)} from ${basename(from)} (${kb(src)})`);
  return info;
}

// ── Home hero ────────────────────────────────────────────────────────────────
// Mobile art fills a 3:4 box at 100vw (up to 768px): 720/1080/1440 covers
// 360-480px phones at 2-3x and small tablets.
const heroOut = img('hero/web');
await mkdir(heroOut, { recursive: true });
for (const name of ['main-mo1', 'main-mo2', 'main-mo3']) {
  for (const w of [720, 1080, 1440]) {
    await emit(img('hero', `${name}.webp`), resolve(heroOut, `${name}-${w}.webp`),
      { width: w, withoutEnlargement: true }, { quality: 80, effort: 6 });
  }
}
// Desktop art is shown full width at 100:55. Widths are capped at the source
// width (main-1 is 1440px), and each file is named by its real width.
for (const name of ['main-1', 'main-2', 'main-3']) {
  const from = img('hero', `${name}.jpg`);
  const { width } = await sharp(from).metadata();
  for (const w of [...new Set([1280, 1920].map((x) => Math.min(x, width)))]) {
    await emit(from, resolve(heroOut, `${name}-${w}.webp`), { width: w }, { quality: 80, effort: 6 });
  }
}

// ── /products carousel ───────────────────────────────────────────────────────
// Rendered at max-h 480px (desktop) / 300px (mobile): 960px tall covers 2x and
// 3x. Drawings are line art with small dimension text, so near-lossless keeps
// the lines clean; photos are ordinary lossy WebP. Both keep their alpha.
const prodOut = img('products/web');
await mkdir(prodOut, { recursive: true });
const MODELS = [
  'modern-picky', 'classic-picky', 'urban-picky',
  'modern-mini-picky', 'urban-mini-picky',
  'modern-retro-picky', 'urban-retro-picky',
  'outdoor-picky', 'air-picky',
];
const sizes = {};
for (const id of MODELS) {
  const box = { height: 960, fit: 'inside', withoutEnlargement: true };
  const line = await emit(img('products', `${id}-line.png`), resolve(prodOut, `${id}-line.webp`),
    box, { nearLossless: true, quality: 60, effort: 6 });
  // A photo that is already a WebP no taller than the box gains nothing from
  // re-encoding (and would lose a generation); products.ts keeps the original.
  const photoSrc = img('products', `${id}-photo.webp`);
  const meta = await sharp(photoSrc).metadata();
  const photo = meta.height <= box.height
    ? (console.log(`${`${id}-photo.webp`.padEnd(30)}    kept  ${`${meta.width}x${meta.height}`.padEnd(10)} original is already small`), meta)
    : await emit(photoSrc, resolve(prodOut, `${id}-photo.webp`), box, { quality: 82, alphaQuality: 90, effort: 6 });
  if (line && photo) sizes[id] = { left: [line.width, line.height], right: [photo.width, photo.height] };
}

console.log(`\n${files} files, ${kb(total)} total`);
console.log('\nSizes for src/data/products.ts:');
for (const [id, s] of Object.entries(sizes)) {
  console.log(`  ${id.padEnd(20)} imageLeftSize: [${s.left.join(', ')}], imageRightSize: [${s.right.join(', ')}],`);
}
