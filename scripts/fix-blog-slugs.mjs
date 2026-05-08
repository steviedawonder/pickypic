#!/usr/bin/env node
// Migrate any remaining non-ASCII blog slugs to SEO-friendly English ones.
// Korean URLs hurt indexing in practice (percent-encoded canonicals, lower
// crawl priority), so we keep slugs ASCII and let the editor's auto-suggester
// (suggestEnglishSlug) cover new posts going forward.
//
// Run with:  node scripts/fix-blog-slugs.mjs

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const envText = readFileSync(envPath, 'utf8');
const tokenMatch = envText.match(/^SANITY_API_TOKEN=(.+)$/m);
if (!tokenMatch) {
  console.error('SANITY_API_TOKEN not found in .env');
  process.exit(1);
}
const token = tokenMatch[1].trim();

const client = createClient({
  projectId: '7b9lcco4',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

// Explicit mappings. Match by a substring unique to the original slug so we
// can rerun this script idempotently — already-renamed posts simply won't match.
const renames = [
  { fromContains: '모델하우스', newSlug: 'model-house-photobooth-rental-guide-2026' },
  { fromContains: '브랜드-소개', newSlug: 'pickypic-photobooth-rental-purchase-guide-2026' },
  // Spotify campus event recap (Sogang/Yonsei) — found by audit on 2026-05-08.
  { fromContains: '스포티파이', newSlug: 'spotify-photobooth-rental-sogang-yonsei-campus-event-2026' },
];

const posts = await client.fetch(
  `*[_type == "blogPost"]{ _id, title, "slug": slug.current }`
);

console.log(`Found ${posts.length} blog posts.\n`);

// Audit pass: warn about any non-ASCII slug not in our rename table.
const ASCII_SLUG = /^[a-z0-9-]+$/;
const remaining = posts.filter(
  (p) =>
    p.slug &&
    !ASCII_SLUG.test(p.slug) &&
    !renames.some((r) => p.slug.includes(r.fromContains))
);
if (remaining.length) {
  console.warn('⚠ Non-ASCII slugs found that have no rename mapping:');
  for (const p of remaining) console.warn(`   - ${p.slug}  (${p.title})`);
  console.warn('   → Add a rename entry above and rerun.\n');
}

for (const rename of renames) {
  const target = posts.find(
    (p) => p.slug && p.slug.includes(rename.fromContains)
  );
  if (!target) {
    console.log(`(skip) no post matches "${rename.fromContains}" — already renamed?`);
    continue;
  }
  console.log(`→ ${target.title}`);
  console.log(`  old slug: ${target.slug}`);
  console.log(`  new slug: ${rename.newSlug}`);
  await client
    .patch(target._id)
    .set({ slug: { _type: 'slug', current: rename.newSlug } })
    .commit();
  console.log('  ✓ updated\n');
}

console.log('Done.');
