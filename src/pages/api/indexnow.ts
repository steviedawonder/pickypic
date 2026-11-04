import type { APIRoute } from 'astro';
import { validateToken } from './auth';

// SSR endpoint — without this Astro prerenders the route at build time,
// which silently breaks POST and returns the static 404 HTML.
export const prerender = false;

const INDEXNOW_KEY = 'pickypic2024indexnow';
const DOMAIN = 'picky-pic.com';
// IndexNow allows 10,000 URLs per POST; an admin action never needs more than this.
const MAX_URLS = 100;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;
// If no password configured, block all access

// Admin-only, exactly like /api/sanity: anyone else could flood IndexNow under our key.
async function isAuthorized(request: Request): Promise<boolean> {
  if (!ADMIN_PASSWORD) return false;
  const token = request.headers.get('x-admin-auth');
  if (!token) return false;
  return validateToken(token);
}

/**
 * The submitted URLs worth sending: https on picky-pic.com only, deduplicated,
 * capped at MAX_URLS, and RFC 3986-escaped via new URL().href (IndexNow wants
 * escaped URLs; a Hangul slug comes out percent-encoded, like our canonical tags).
 * Accepts { url } or { urls }. Shared with naver-indexing.ts.
 */
export function siteUrlsFromBody(body: any): string[] {
  const raw: unknown[] = Array.isArray(body?.urls) ? body.urls : body?.url ? [body.url] : [];
  const urls = new Set<string>();
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      continue;
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== DOMAIN) continue;
    parsed.hash = '';
    urls.add(parsed.href);
    if (urls.size >= MAX_URLS) break;
  }
  return [...urls];
}

/** One IndexNow submission (JSON POST). Shared with naver-indexing.ts. */
export function submitIndexNow(endpoint: string, urls: string[]): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: DOMAIN,
      key: INDEXNOW_KEY,
      // keyLocation omitted — the key file lives at the site root
      // (public/pickypic2024indexnow.txt), which is IndexNow's default lookup.
      urlList: urls,
    }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAuthorized(request))) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const urls = siteUrlsFromBody(body);

    if (urls.length === 0) {
      return jsonResponse(
        { success: false, error: `No valid URL. Send { url: string } or { urls: string[] } with https://${DOMAIN}/ URLs` },
        400
      );
    }

    const results: { target: string; status: string; statusCode?: number; error?: string }[] = [];

    // 1. IndexNow API ping — one POST to api.indexnow.org is shared with every
    // participating engine (Bing, Naver, Yandex, Seznam, ...).
    try {
      const indexNowRes = await submitIndexNow('https://api.indexnow.org/indexnow', urls);
      results.push({
        target: 'IndexNow (shared: Bing/Naver/Yandex)',
        status: indexNowRes.ok ? 'ok' : 'failed',
        statusCode: indexNowRes.status,
      });
    } catch (err: any) {
      results.push({ target: 'IndexNow (shared: Bing/Naver/Yandex)', status: 'error', error: err.message });
    }

    // Google's sitemap ping endpoint was retired in June 2023 and now returns 404,
    // so there is nothing to call here. Google discovery runs off robots.txt +
    // sitemap-index.xml (with real lastmod dates) and Search Console requests.

    const allOk = results.every((r) => r.status === 'ok');

    return jsonResponse({ success: true, allOk, submitted: urls, results });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err.message || 'Unknown error' }, 500);
  }
};

// Every other method (crawlers send GET/HEAD) gets a real 405. Without this,
// Astro answers with an empty-body 404 and then tries to fetch the prerendered
// 404 page, which crashed on Vercel (500 FUNCTION_INVOCATION_FAILED).
// POST still wins: Astro picks mod[method] before mod.ALL.
export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
