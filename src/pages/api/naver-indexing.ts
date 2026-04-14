import type { APIRoute } from 'astro';

const DOMAIN = 'picky-pic.com';
const SITEMAP_URL = `https://${DOMAIN}/sitemap-index.xml`;
const RSS_URL = `https://${DOMAIN}/blog/rss.xml`;
const INDEXNOW_KEY = 'pickypic2024indexnow';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const url: string | undefined = body.url;

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'No URL provided. Send { url: string }' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!url.startsWith(`https://${DOMAIN}/`)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid URL: ${url}. Must start with https://${DOMAIN}/` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results: { target: string; status: string; statusCode?: number; error?: string }[] = [];

    // 1. Naver IndexNow ping
    try {
      const naverIndexNowUrl = `https://searchadvisor.naver.com/indexnow?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`;
      const res = await fetch(naverIndexNowUrl);
      results.push({
        target: 'Naver IndexNow',
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.status,
      });
    } catch (err: any) {
      results.push({ target: 'Naver IndexNow', status: 'error', error: err.message });
    }

    // 2. Naver crawl request
    try {
      const crawlUrl = `https://apis.naver.com/crawl/naver_crawl/request?url=${encodeURIComponent(url)}`;
      const res = await fetch(crawlUrl);
      results.push({
        target: 'Naver Crawl Request',
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.status,
      });
    } catch (err: any) {
      // Naver crawl API may not be publicly available; treat as non-critical
      results.push({ target: 'Naver Crawl Request', status: 'error', error: err.message });
    }

    // 3. Naver sitemap ping
    try {
      const sitemapPingUrl = `https://searchadvisor.naver.com/indexnow?url=${encodeURIComponent(SITEMAP_URL)}&key=${INDEXNOW_KEY}`;
      const res = await fetch(sitemapPingUrl);
      results.push({
        target: 'Naver Sitemap Ping',
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.status,
      });
    } catch (err: any) {
      results.push({ target: 'Naver Sitemap Ping', status: 'error', error: err.message });
    }

    // 4. Naver RSS ping
    try {
      const rssPingUrl = `https://searchadvisor.naver.com/indexnow?url=${encodeURIComponent(RSS_URL)}&key=${INDEXNOW_KEY}`;
      const res = await fetch(rssPingUrl);
      results.push({
        target: 'Naver RSS Ping',
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.status,
      });
    } catch (err: any) {
      results.push({ target: 'Naver RSS Ping', status: 'error', error: err.message });
    }

    // Even if some pings fail, return success — sitemap will be crawled eventually
    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
