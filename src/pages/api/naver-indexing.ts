import type { APIRoute } from 'astro';
import { validateToken } from './auth';
import { siteUrlsFromBody, submitIndexNow } from './indexnow';

// SSR endpoint — without this Astro prerenders the route at build time,
// which silently breaks POST and returns the static 404 HTML.
export const prerender = false;

const DOMAIN = 'picky-pic.com';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;
// If no password configured, block all access

// Admin-only, exactly like /api/sanity.
async function isAuthorized(request: Request): Promise<boolean> {
  if (!ADMIN_PASSWORD) return false;
  const token = request.headers.get('x-admin-auth');
  if (!token) return false;
  return validateToken(token);
}

// A thin, direct submission to Naver's IndexNow endpoint, so the admin sees
// Naver's own status code. (/api/indexnow already reaches Naver through the
// shared api.indexnow.org.) Same validation as /api/indexnow: https URLs on
// picky-pic.com, percent-encoded, capped at 100.
//
// Not done here any more: apis.naver.com/crawl/... is not a public Naver API
// (crawl requests are partner-only), and submitting sitemap-index.xml or
// rss.xml as IndexNow URLs is not a ping — those are read from robots.txt and
// Search Advisor instead.
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

    try {
      const res = await submitIndexNow('https://searchadvisor.naver.com/indexnow', urls);
      results.push({
        target: 'Naver IndexNow',
        status: res.ok ? 'ok' : 'failed',
        statusCode: res.status,
      });
    } catch (err: any) {
      results.push({ target: 'Naver IndexNow', status: 'error', error: err.message });
    }

    // Best-effort like before: the sitemap is crawled regardless, so a failed
    // submission is reported in `results` without failing the request.
    return jsonResponse({ success: true, submitted: urls, results });
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
