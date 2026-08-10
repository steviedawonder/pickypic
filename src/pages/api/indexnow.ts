import type { APIRoute } from 'astro';

// SSR endpoint — without this Astro prerenders the route at build time,
// which silently breaks POST and returns the static 404 HTML.
export const prerender = false;

const INDEXNOW_KEY = 'pickypic2024indexnow';
const DOMAIN = 'picky-pic.com';

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
          // keyLocation omitted — the key file lives at the site root
          // (public/pickypic2024indexnow.txt), which is IndexNow's default lookup.
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

    // Google's sitemap ping endpoint was retired in June 2023 and now returns 404,
    // so there is nothing to call here. Google discovery runs off robots.txt +
    // sitemap-index.xml, plus the Indexing API in google-indexing.ts.

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
