export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { renderPostBody, POST_BODY_PROJECTION } from '../../utils/postBody';

const sanityClient = createClient({
  projectId: '7b9lcco4',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
  token: import.meta.env.SANITY_READ_TOKEN || import.meta.env.SANITY_API_TOKEN,
});

const SITE = 'https://picky-pic.com';

const escapeXml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** CDATA section that survives a literal "]]>" in the text. */
const cdata = (str: string) => `<![CDATA[${str.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export const GET: APIRoute = async () => {
  let posts: any[] = [];
  try {
    // Only live posts: published, not scheduled for later, with a slug (a post
    // without one would throw below and take the whole feed down).
    // drafts.* ids are excluded because the token's default perspective is raw.
    posts = await sanityClient.fetch(
      `*[_type == "blogPost" && defined(slug.current) && publishedAt != null && publishedAt <= now()
         && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...20] {
        _id, title, "slug": slug.current, excerpt, publishedAt, _updatedAt,
        ${POST_BODY_PROJECTION},
        mainImage { asset-> { url, mimeType, size } },
        category-> { title },
        author-> { name },
        tags
      }`
    );
  } catch {
    // Sanity 접속 실패 시 빈 피드 반환
  }

  const items = posts
    .map((post: any) => {
      // Canonical form: no trailing slash, slug percent-encoded (RFC 3986).
      const url = `${SITE}/blog/${encodeURIComponent(post.slug)}`;
      const published = Date.parse(post.publishedAt);
      const pubDate = Number.isNaN(published) ? '' : `<pubDate>${new Date(published).toUTCString()}</pubDate>`;
      const categoryTag = post.category?.title
        ? `<category>${escapeXml(post.category.title)}</category>`
        : '';
      const extraTags = (post.tags || [])
        .map((tag: string) => `<category>${escapeXml(tag)}</category>`)
        .join('');
      // RSS 2.0 <author> must be an e-mail address; a name goes in dc:creator.
      const creator = post.author?.name ? `<dc:creator>${cdata(post.author.name)}</dc:creator>` : '';
      // <enclosure> requires the real byte length; without it, fall back to
      // media:content rather than claim length="0".
      const asset = post.mainImage?.asset;
      let media = '';
      if (asset?.url && asset.mimeType && asset.size) {
        media = `<enclosure url="${escapeXml(asset.url)}" type="${escapeXml(asset.mimeType)}" length="${asset.size}" />`;
      } else if (asset?.url) {
        media = `<media:content url="${escapeXml(asset.url)}" medium="image" />`;
      }

      // Full post HTML, as Naver asks of feeds (an excerpt-only item gives its
      // crawler nothing to index); the excerpt stays as the fallback.
      let html = '';
      try {
        html = renderPostBody(post.body, { title: post.title || '' });
      } catch {
        // Fall back to the excerpt below.
      }

      return `
    <item>
      <title>${cdata(post.title || '')}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${cdata(html || post.excerpt || '')}</description>
      ${pubDate}
      ${creator}
      ${categoryTag}${extraTags}
      ${media}
    </item>`;
    })
    .join('');

  // The channel last changed when its newest item did, not when this ran.
  const newest = posts
    .map((post: any) => Date.parse(post._updatedAt || post.publishedAt))
    .filter((t: number) => !Number.isNaN(t))
    .sort((a: number, b: number) => b - a)[0];
  const lastBuildDate = new Date(newest ?? Date.now()).toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>피키픽 포토부스 블로그</title>
    <link>${SITE}/blog</link>
    <description>포토부스 대여 가이드, 렌탈 트렌드, 브랜드 팝업 사례 등 유용한 정보를 제공합니다.</description>
    <language>ko</language>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <image>
      <url>${SITE}/images/common/logo-top.png</url>
      <title>피키픽 포토부스 블로그</title>
      <link>${SITE}/blog</link>
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
