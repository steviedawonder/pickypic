import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

export const prerender = false;

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || '';

function getClient() {
  const token = import.meta.env.SANITY_API_TOKEN;
  if (!token) {
    throw new Error('SANITY_API_TOKEN is not configured');
  }
  return createClient({
    projectId: '7b9lcco4',
    dataset: 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token,
  });
}

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function createHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function isAuthorized(request: Request): Promise<boolean> {
  const auth = request.headers.get('x-admin-auth');
  if (!auth) return false;

  try {
    const decoded = atob(auth);
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return false;
    const timestamp = decoded.substring(0, colonIdx);
    const hmac = decoded.substring(colonIdx + 1);

    // Check token age (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (isNaN(tokenAge) || tokenAge > 24 * 60 * 60 * 1000 || tokenAge < 0) {
      return false;
    }

    // Verify HMAC
    const expectedHmac = await createHmac(timestamp, ADMIN_PASSWORD);
    return hmac === expectedHmac;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') || '';

  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Allow public inquiry submissions without auth
    if (action === 'submitInquiry') {
      const client = getClient();
      const result = await client.create({
        _type: 'inquiry',
        ...params.data,
        submittedAt: new Date().toISOString(),
        status: '대기',
      });
      return jsonResponse(result);
    }

    // All other actions require HMAC token auth
    if (!(await isAuthorized(request))) {
      return unauthorized();
    }

    const client = getClient();

    switch (action) {
      case 'fetch': {
        const result = await client.fetch(params.query, params.params || {});
        return jsonResponse(result);
      }

      case 'create': {
        const result = await client.create(params.data);
        return jsonResponse(result);
      }

      case 'update': {
        const result = await client.patch(params.id).set(params.data).commit();
        return jsonResponse(result);
      }

      case 'delete': {
        const result = await client.delete(params.id);
        return jsonResponse(result);
      }

      case 'uploadImage':
      case 'uploadFile': {
        const buffer = Buffer.from(params.fileData, 'base64');
        const assetType = action === 'uploadImage' ? 'image' : 'file';
        const result = await client.assets.upload(assetType as 'image' | 'file', buffer, {
          filename: params.fileName,
          contentType: params.fileType,
        });
        return jsonResponse(result);
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error('Sanity API proxy error:', err);
    return jsonResponse(
      { error: err.message || 'Internal server error' },
      500,
    );
  }
};
