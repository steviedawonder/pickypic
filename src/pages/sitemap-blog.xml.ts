export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: '7b9lcco4',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
  token: import.meta.env.SANITY_READ_TOKEN || import.meta.env.SANITY_API_TOKEN,
});

const SITE = 'https://picky-pic.com';

/** YYYY-MM-DD, or '' when the value isn't a date. */
function toDate(value?: string): string {
  const t = value ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? '' : new Date(t).toISOString().split('T')[0];
}

export const GET: APIRoute = async () => {
  let posts: { slug: string; publishedAt?: string; _updatedAt?: string }[] = [];
  let failed = false;
  try {
    // Only live posts: published, not scheduled for later, with a slug.
    // drafts.* ids are excluded because the token's default perspective is raw.
    posts = await sanityClient.fetch(
      `*[_type == "blogPost" && defined(slug.current) && publishedAt != null && publishedAt <= now()
         && !(_id in path("drafts.**"))] | order(publishedAt desc) {
        "slug": slug.current,
        publishedAt,
        _updatedAt
      }`
    );
  } catch {
    failed = true; // answered with 503 below
  }

  // The listing shows every post's title, excerpt and image, so it changes
  // whenever any post does: its lastmod is the newest post update.
  const listLastmod = posts
    .map((post) => toDate(post._updatedAt || post.publishedAt))
    .filter(Boolean)
    .sort()
    .pop();

  const blogListEntry = `
  <url>
    <loc>${SITE}/blog</loc>
    ${listLastmod ? `<lastmod>${listLastmod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;

  // Canonical form: no trailing slash, slug percent-encoded (RFC 3986), matching
  // the canonical tag on the post page.
  const postEntries = posts
    .map((post) => {
      const lastmodDate = toDate(post._updatedAt || post.publishedAt);
      return `
  <url>
    <loc>${SITE}/blog/${encodeURIComponent(post.slug)}</loc>
    ${lastmodDate ? `<lastmod>${lastmodDate}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${blogListEntry}${postEntries}
</urlset>`;

  // An empty feed served (and cached for an hour) during a Sanity outage would
  // tell crawlers every URL in it is gone. 503 says "try again later".
  if (failed) {
    return new Response('Sanity unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
