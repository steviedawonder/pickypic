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

// Sanity portfolio pages (/portfolio/<slug>, rendered on demand). The numeric
// /portfolio/<id> pages come from src/data/portfolio.ts and are listed in
// sitemap-0.xml by @astrojs/sitemap, in the same 0.9/weekly tier used here.
export const GET: APIRoute = async () => {
  let items: { slug: string; _updatedAt?: string }[] = [];
  try {
    items = await sanityClient.fetch(
      `*[_type == "portfolio" && isVisible == true && defined(slug.current)
         && !(_id in path("drafts.**"))] | order(order desc) {
        "slug": slug.current,
        _updatedAt
      }`
    );
  } catch {
    // Sanity 접속 실패 시 빈 사이트맵 반환
  }

  const entries = items
    // A purely numeric slug collides with a static portfolio/[id] page, which
    // wins the route, so that URL would not show this document.
    .filter((item) => !/^\d+$/.test(item.slug))
    .map((item) => {
      const lastmodDate = toDate(item._updatedAt);
      return `
  <url>
    <loc>${SITE}/portfolio/${encodeURIComponent(item.slug)}</loc>
    ${lastmodDate ? `<lastmod>${lastmodDate}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
