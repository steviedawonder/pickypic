#!/usr/bin/env node
// One-shot migration: rewrite Korean blog slugs to SEO-friendly English ones.
// Reason: Korean URLs were percent-encoded and one of them (trailing hyphen)
// caused the public post route to enter a redirect loop and serve 500.
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

const renames = [
  {
    fromContains: '모델하우스',
    newSlug: 'model-house-photobooth-rental-guide-2026',
  },
  {
    fromContains: '브랜드-소개',
    newSlug: 'pickypic-photobooth-rental-purchase-guide-2026',
  },
];

const posts = await client.fetch(
  `*[_type == "blogPost"]{ _id, title, "slug": slug.current }`
);

console.log(`Found ${posts.length} blog posts.\n`);

for (const rename of renames) {
  const target = posts.find(
    (p) => p.slug && p.slug.includes(rename.fromContains)
  );
  if (!target) {
    console.warn(`✗ no post matched for "${rename.fromContains}"`);
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
