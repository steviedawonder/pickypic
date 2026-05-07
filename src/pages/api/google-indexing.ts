import type { APIRoute } from 'astro';
import { JWT } from 'google-auth-library';

export const prerender = false;

const DOMAIN = 'picky-pic.com';

// Google Indexing API: nominally only for JobPosting and BroadcastEvent pages,
// but in practice it works as a "please crawl this URL" hint for any page on
// a property the service account owns in Search Console. Non-job pages are
// not officially supported, so treat failures as soft.
//
// Daily quota: 200 publish requests by default. Plenty for blog cadence.
//
// Setup (one-time, in Google Cloud Console + Search Console):
//   1) Create a GCP project, enable "Indexing API"
//   2) Create a service account, generate a JSON key
//   3) In Search Console → settings → users and permissions, add the service
//      account email as an OWNER of https://picky-pic.com (must be Owner —
//      "Full" or "Restricted" user roles will not work).
//   4) Set env vars on Vercel:
//        GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL = ...@...iam.gserviceaccount.com
//        GOOGLE_INDEXING_PRIVATE_KEY           = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
//      (Vercel UI accepts the literal `\n` characters; we replace them below.)

const SERVICE_ACCOUNT_EMAIL = import.meta.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL as string | undefined;
const PRIVATE_KEY_RAW = import.meta.env.GOOGLE_INDEXING_PRIVATE_KEY as string | undefined;

function getJwtClient(): JWT | null {
  if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY_RAW) return null;
  // Vercel stores multiline secrets with literal \n, normalize before signing.
  const privateKey = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
  return new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const url: string | undefined = body.url;
    const action: 'URL_UPDATED' | 'URL_DELETED' = body.action === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED';

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'No URL provided. Send { url: string, action?: "URL_UPDATED" | "URL_DELETED" }' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!url.startsWith(`https://${DOMAIN}/`)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid URL: ${url}. Must start with https://${DOMAIN}/` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = getJwtClient();
    if (!client) {
      return new Response(
        JSON.stringify({
          success: false,
          configured: false,
          error: 'Google Indexing API not configured. Set GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL and GOOGLE_INDEXING_PRIVATE_KEY env vars.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accessTokenResp = await client.getAccessToken();
    const accessToken = accessTokenResp.token;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to obtain Google access token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiResp = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, type: action }),
    });

    const apiBody = await apiResp.text();
    let parsed: unknown = apiBody;
    try { parsed = JSON.parse(apiBody); } catch { /* keep as text */ }

    return new Response(
      JSON.stringify({
        success: apiResp.ok,
        configured: true,
        statusCode: apiResp.status,
        action,
        url,
        response: parsed,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
