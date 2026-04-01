import type { APIRoute } from 'astro';

export const prerender = false;

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;
// If no password configured, block all access

// Simple HMAC-like token: base64(timestamp:hash)
// We use a simple hash approach since Web Crypto is available in Astro SSR
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

async function generateToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const hmac = await createHmac(timestamp, ADMIN_PASSWORD);
  return btoa(`${timestamp}:${hmac}`);
}

async function validateToken(token: string): Promise<boolean> {
  try {
    const decoded = atob(token);
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

// Export validateToken for use in sanity.ts
export { validateToken };

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, password, token } = body;

    // TODO: Implement rate limiting for login attempts (e.g., via Vercel KV or Upstash Redis)

    if (action === 'login') {
      if (!ADMIN_PASSWORD) {
        return jsonResponse({ error: 'ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, 500);
      }
      if (password === ADMIN_PASSWORD) {
        const newToken = await generateToken();
        return jsonResponse({ success: true, token: newToken });
      }
      return jsonResponse({ error: '비밀번호가 올바르지 않습니다.' }, 401);
    }

    if (action === 'verify') {
      if (!token) {
        return jsonResponse({ valid: false }, 200);
      }
      const valid = await validateToken(token);
      return jsonResponse({ valid });
    }

    if (action === 'changePassword') {
      // Require valid session first
      if (!token || !(await validateToken(token))) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
      // Then explain that password change requires Vercel env var
      return jsonResponse({
        error: '비밀번호 변경은 Vercel 환경변수(ADMIN_PASSWORD)에서 직접 변경해야 합니다.',
        info: true
      }, 200);
    }

    return jsonResponse({ error: 'Unknown action' }, 400);
  } catch (err: any) {
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
};
