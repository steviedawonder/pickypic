/**
 * Portfolio Migration Script
 *
 * Migrates 77 hardcoded portfolio items from src/data/portfolio.ts to Sanity.
 * Downloads images from picky-pic.com and uploads them as Sanity assets.
 *
 * Usage: npx tsx scripts/migrate-portfolio.ts
 *
 * Requires:
 *   - SANITY_API_TOKEN env var (or in .env file)
 *   - Network access to https://picky-pic.com
 */

import { createClient, type SanityClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';

// Load .env from project root (simple parser, no dotenv dependency needed)
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
loadEnv();

// Import portfolio data
import { portfolioItems } from '../src/data/portfolio';

// ── Config ──

const SANITY_PROJECT_ID = '7b9lcco4';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';
const SITE_DOMAIN = 'https://picky-pic.com';

// Delay between items to avoid rate limiting (ms)
const DELAY_BETWEEN_ITEMS = 1000;
// Delay between image uploads (ms)
const DELAY_BETWEEN_UPLOADS = 500;

const token = process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('ERROR: SANITY_API_TOKEN environment variable is required.');
  console.error('Set it in .env or export it before running this script.');
  process.exit(1);
}

const client: SanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token,
  useCdn: false,
});

// ── Helpers ──

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a URL-friendly slug from a title.
 * Handles Korean characters by transliterating common patterns,
 * but mostly relies on the Latin characters in the titles.
 */
function generateSlug(title: string, id: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[()（）]/g, '')          // Remove parentheses
    .replace(/[&]/g, 'and')            // Replace & with 'and'
    .replace(/[^a-z0-9\s-]/g, '')      // Remove non-alphanumeric (strips Korean)
    .replace(/\s+/g, '-')              // Spaces to hyphens
    .replace(/-+/g, '-')               // Collapse multiple hyphens
    .replace(/^-|-$/g, '');            // Trim leading/trailing hyphens

  // If slug is empty (e.g., all-Korean title), use id as fallback
  if (!slug || slug.length < 2) {
    return `portfolio-${id}`;
  }

  return slug;
}

/**
 * Download an image from the production site and upload it to Sanity.
 * Returns a Sanity image asset reference or null on failure.
 */
async function downloadAndUploadImage(
  imagePath: string,
  label: string
): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } } | null> {
  const url = `${SITE_DOMAIN}${imagePath}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  WARN: Failed to download ${label}: ${url} (HTTP ${response.status})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = path.basename(imagePath);

    // Determine content type from extension
    const ext = path.extname(imagePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    const contentType = contentTypeMap[ext] || 'image/jpeg';

    const asset = await client.assets.upload('image', buffer, {
      filename,
      contentType,
    });

    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    };
  } catch (err) {
    console.warn(`  WARN: Error uploading ${label} (${url}):`, (err as Error).message);
    return null;
  }
}

/**
 * Check if a portfolio document with the given slug already exists in Sanity.
 */
async function documentExistsBySlug(slug: string): Promise<boolean> {
  const count = await client.fetch<number>(
    `count(*[_type == "portfolio" && slug.current == $slug])`,
    { slug }
  );
  return count > 0;
}

// ── Main Migration ──

async function migrate() {
  console.log('=== Portfolio Migration to Sanity ===');
  console.log(`Total items to migrate: ${portfolioItems.length}`);
  console.log(`Target: ${SANITY_PROJECT_ID}/${SANITY_DATASET}`);
  console.log('');

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < portfolioItems.length; i++) {
    const item = portfolioItems[i];
    const slug = generateSlug(item.title, item.id);
    const progress = `[${i + 1}/${portfolioItems.length}]`;

    // Check if already exists (resumable)
    const exists = await documentExistsBySlug(slug);
    if (exists) {
      console.log(`${progress} SKIP: "${item.title}" (slug: ${slug}) — already exists`);
      skipped++;
      continue;
    }

    console.log(`${progress} Migrating: "${item.title}" (id: ${item.id}, slug: ${slug})`);

    try {
      // Upload thumbnail
      console.log(`  Uploading thumbnail: ${item.image}`);
      const thumbnail = await downloadAndUploadImage(item.image, 'thumbnail');
      await sleep(DELAY_BETWEEN_UPLOADS);

      // Upload detail images
      const images: Array<{
        _type: 'image';
        _key: string;
        alt: string;
        caption: string;
        asset: { _type: 'reference'; _ref: string };
      }> = [];

      for (let j = 0; j < item.detailImages.length; j++) {
        const detailPath = item.detailImages[j];
        console.log(`  Uploading detail image ${j + 1}/${item.detailImages.length}: ${detailPath}`);
        const uploaded = await downloadAndUploadImage(detailPath, `detail-${j + 1}`);
        if (uploaded) {
          images.push({
            _type: 'image',
            _key: `detail-${j}`,
            alt: `${item.title} - ${item.description} ${j + 1}`,
            caption: '',
            asset: uploaded.asset,
          });
        }
        await sleep(DELAY_BETWEEN_UPLOADS);
      }

      // Extract client name from title (part before "x PICKYPIC")
      const clientName = item.title.replace(/\s*x\s*PICKYPIC$/i, '').trim();

      // Build the Sanity document
      const doc = {
        _type: 'portfolio' as const,
        title: item.title,
        slug: {
          _type: 'slug' as const,
          current: slug,
        },
        category: item.category,
        client: clientName,
        description: item.description,
        rentalDevice: item.rentalDevice,
        ...(thumbnail
          ? {
              thumbnail: {
                ...thumbnail,
                alt: `${item.title} - ${item.description}`,
              },
            }
          : {}),
        images: images.length > 0 ? images : [],
        body: [],
        order: item.id, // Use original id to preserve ordering (higher id = newer = shows first)
        isVisible: true,
        seoTitle: '',
        seoDescription: '',
        focusKeyword: '',
      };

      await client.create(doc);
      console.log(`  OK: Created successfully`);
      migrated++;
    } catch (err) {
      console.error(`  FAIL: "${item.title}" — ${(err as Error).message}`);
      failed++;
    }

    // Delay between items
    if (i < portfolioItems.length - 1) {
      await sleep(DELAY_BETWEEN_ITEMS);
    }
  }

  // Summary
  console.log('');
  console.log('=== Migration Complete ===');
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total processed: ${migrated + skipped + failed}`);
}

migrate().catch((err) => {
  console.error('Migration failed with error:', err);
  process.exit(1);
});
