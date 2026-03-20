import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

export const prerender = false;

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || 'pickypic2020';

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

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('x-admin-auth');
  return auth === ADMIN_PASSWORD;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const contentType = request.headers.get('content-type') || '';

  try {
    const client = getClient();

    // Handle JSON actions
    const body = await request.json();
    const { action, ...params } = body;

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
