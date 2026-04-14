import type { APIRoute } from 'astro';

const INDEXNOW_KEY = 'pickypic2024indexnow';
const DOMAIN = 'picky-pic.com';
const SITEMAP_URL = `https://${DOMAIN}/sitemap-index.xml`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const urls: string[] = body.urls
      ? body.urls
      : body.url
        ? [body.url]
        : [];

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No URL provided. Send { url: string } or { urls: string[] }' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const invalid = urls.find((u: string) => !u.startsWith(`https://${DOMAIN}/`));
    if (invalid) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid URL: ${invalid}. Must start with https://${DOMAIN}/` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results: { target: string; status: string; statusCode?: number; error?: string }[] = [];

    // 1. IndexNow API ping
    try {
      const indexNowRes = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: DOMAIN,
          key: INDEXNOW_KEY,
          keyLocation: `https://${DOMAIN}/.well-known/indexnow/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      });
      results.push({
        target: 'IndexNow (Bing/Yandex)',
        status: indexNowRes.ok ? 'ok' : 'failed',
        statusCode: indexNowRes.status,
      });
    } catch (err: any) {
      results.push({ target: 'IndexNow (Bing/Yandex)', status: 'error', error: err.message });
    }

    // 2. Google sitemap ping
    try {
      const googleRes = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
      );
      results.push({
        target: 'Google Sitemap Ping',
        status: googleRes.ok ? 'ok' : 'failed',
        statusCode: googleRes.status,
      });
    } catch (err: any) {
      results.push({ target: 'Google Sitemap Ping', status: 'error', error: err.message });
    }

    // 3. Google individual URL ping (via sitemap ping per URL — best effort)
    for (const url of urls) {
      try {
        const res = await fetch(
          `https://www.google.com/ping?sitemap=${encodeURIComponent(url)}`
        );
        results.push({
          target: `Google Ping: ${url}`,
          status: res.ok ? 'ok' : 'failed',
          statusCode: res.status,
        });
      } catch (err: any) {
        results.push({ target: `Google Ping: ${url}`, status: 'error', error: err.message });
      }
    }

    const allOk = results.every((r) => r.status === 'ok');

    return new Response(
      JSON.stringify({ success: true, allOk, results }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
