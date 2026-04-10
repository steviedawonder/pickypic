export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: '7b9lcco4',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

export const GET: APIRoute = async () => {
  let posts: any[] = [];
  try {
    posts = await sanityClient.fetch(
      `*[_type == "blogPost" && publishedAt != null && defined(slug.current)] | order(publishedAt desc) {
        "slug": slug.current,
        publishedAt,
        _updatedAt
      }`
    );
  } catch {
    // Sanity 접속 실패 시 빈 사이트맵 반환
  }

  const blogListEntry = `
  <url>
    <loc>https://picky-pic.com/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;

  const postEntries = posts
    .map((post: any) => {
      const lastmod = post._updatedAt || post.publishedAt;
      const lastmodDate = lastmod
        ? new Date(lastmod).toISOString().split('T')[0]
        : '';
      return `
  <url>
    <loc>https://picky-pic.com/blog/${post.slug}</loc>
    ${lastmodDate ? `<lastmod>${lastmodDate}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${blogListEntry}${postEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
