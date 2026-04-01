import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { validateToken } from './auth';

export const prerender = false;

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

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;
// If no password configured, block all access

async function isAuthorized(request: Request): Promise<boolean> {
  if (!ADMIN_PASSWORD) return false;
  const token = request.headers.get('x-admin-auth');
  if (!token) return false;
  return validateToken(token);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Allow public inquiry submissions without auth
    if (action === 'submitInquiry') {
      const allowed = ['inquiryType', 'name', 'phone', 'email', 'company', 'eventName', 'eventDate', 'message', 'language'];
      const sanitized: Record<string, unknown> = {};
      for (const key of allowed) {
        if (params.data?.[key] !== undefined) {
          sanitized[key] = String(params.data[key]).slice(0, 2000); // Length limit
        }
      }
      const client = getClient();
      const result = await client.create({
        _type: 'inquiry',
        ...sanitized,
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

      case 'triggerRebuild': {
        const hook = 'https://api.vercel.com/v1/integrations/deploy/prj_O7XjLkUJGOEvYnDMuYAjD8y5L96J/i7uhy3EGoA';
        const res = await fetch(hook, { method: 'POST' });
        const data = await res.json();
        return jsonResponse({ success: true, ...data });
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
