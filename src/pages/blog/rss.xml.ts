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
      `*[_type == "blogPost" && publishedAt != null] | order(publishedAt desc) [0...20] {
        _id, title, slug, excerpt, publishedAt,
        mainImage { asset-> { url } },
        category-> { title },
        author-> { name },
        tags
      }`
    );
  } catch {
    // Sanity 접속 실패 시 빈 피드 반환
  }

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const items = posts
    .map((post: any) => {
      const url = `https://picky-pic.com/blog/${post.slug.current}`;
      const pubDate = new Date(post.publishedAt).toUTCString();
      const description = post.excerpt ? escapeXml(post.excerpt) : '';
      const imageUrl = post.mainImage?.asset?.url;
      const categoryTag = post.category?.title
        ? `<category>${escapeXml(post.category.title)}</category>`
        : '';
      const extraTags = (post.tags || [])
        .map((tag: string) => `<category>${escapeXml(tag)}</category>`)
        .join('');
      const enclosure = imageUrl
        ? `<enclosure url="${imageUrl}" type="image/jpeg" length="0" />`
        : '';

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : ''}
      ${categoryTag}${extraTags}
      ${enclosure}
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>피키픽 포토부스 블로그</title>
    <link>https://picky-pic.com/blog</link>
    <description>포토부스 대여 가이드, 렌탈 트렌드, 브랜드 팝업 사례 등 유용한 정보를 제공합니다.</description>
    <language>ko</language>
    <atom:link href="https://picky-pic.com/blog/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>https://picky-pic.com/images/common/logo-top.png</url>
      <title>피키픽 포토부스 블로그</title>
      <link>https://picky-pic.com/blog</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
