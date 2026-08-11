/**
 * The *-line.png files are spec sheets, not outlines: product drawing, dimension
 * callouts, then a "Wood Color" heading with wood chips at the bottom. The share
 * of the canvas each part takes differs per model, so scaling the whole canvas
 * by the product's real height does NOT put the products at true relative scale.
 *
 * This finds the product band (everything above the big blank gap that separates
 * the drawing from the Wood Color block), trims it to its ink, and writes a
 * product-only WebP. Only then does a true-scale row mean anything.
 *
 * Run: node scripts/crop-line-drawings.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = resolve(root, 'public/images/products');
const outDir = resolve(root, 'public/images/en/line');

const MODELS = [
  'modern-picky', 'urban-picky', 'modern-mini-picky', 'urban-mini-picky',
  'modern-retro-picky', 'urban-retro-picky', 'outdoor-picky', 'air-picky',
];

await mkdir(outDir, { recursive: true });

/** Rows/cols that contain ink, from a flattened greyscale buffer. */
function inkProfile(data, w, h, threshold = 245) {
  const rows = new Array(h).fill(0);
  const cols = new Array(w).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] < threshold) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  return { rows, cols };
}

for (const id of MODELS) {
  const from = resolve(srcDir, `${id}-line.png`);
  if (!existsSync(from)) {
    console.error(`MISSING ${id}-line.png`);
    continue;
  }

  const img = sharp(from).flatten({ background: '#ffffff' }).greyscale();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const { rows } = inkProfile(data, w, h);

  // The Wood Color block sits below a tall blank band. Walking up from the
  // bottom finds the small gap between the "Wood Color" caption and its chips
  // instead, so collect every blank run and take the LONGEST one in the lower
  // half of the canvas — that is the real separation.
  const runs = [];
  let start = -1;
  for (let y = 0; y < h; y++) {
    if (rows[y] === 0) {
      if (start === -1) start = y;
    } else if (start !== -1) {
      runs.push({ start, len: y - start });
      start = -1;
    }
  }
  const candidates = runs.filter((r) => r.start > h * 0.35);
  const widest = candidates.sort((a, b) => b.len - a.len)[0];

  // Only cut on a genuinely tall band; otherwise keep the canvas rather than guess.
  const cutAt = widest && widest.len > h * 0.05 ? widest.start : h;

  const band = rows.slice(0, cutAt);
  const top = band.findIndex((n) => n > 0);
  const bottom = cutAt - 1 - [...band].reverse().findIndex((n) => n > 0);

  const { cols } = inkProfile(
    (await sharp(from).flatten({ background: '#ffffff' }).greyscale()
      .extract({ left: 0, top, width: w, height: bottom - top + 1 })
      .raw().toBuffer({ resolveWithObject: true })).data,
    w,
    bottom - top + 1
  );
  const left = cols.findIndex((n) => n > 0);
  const right = w - 1 - [...cols].reverse().findIndex((n) => n > 0);

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;

  const info2 = await sharp(from)
    .extract({ left, top, width: cropW, height: cropH })
    .resize({ height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile(resolve(outDir, `${id}.webp`));

  console.log(
    `${id.padEnd(22)} canvas ${w}x${h} -> product ${cropW}x${cropH}` +
    `  (colour block cut at y=${cutAt}, ${Math.round((1 - cutAt / h) * 100)}% of canvas discarded)` +
    `  out ${info2.width}x${info2.height} ${Math.round(info2.size / 1024)}KB`
  );
}
