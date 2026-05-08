#!/usr/bin/env node
// Use the indexing service account to claim ownership of picky-pic.com via the
// Site Verification API. Search Console's "users & permissions" UI refused to
// add the service account directly (a known quirk with brand-new accounts), so
// we go around the UI by having the service account verify the site itself.
//
// Two-phase usage:
//
//   node scripts/google-site-verify.mjs token   → prints the META verification
//                                                  token; we paste this into
//                                                  BaseLayout.astro and deploy.
//   node scripts/google-site-verify.mjs verify  → tells Google to fetch the
//                                                  page and (on success) marks
//                                                  the service account as an
//                                                  owner of the property.
//
// Reads credentials from a temp env file (NOT the repo .env) so they don't leak
// into the working tree. Pass the path via CRED_FILE env var; defaults to
// /tmp/sv/env (which we populate via `vercel env pull`).

import { JWT } from 'google-auth-library';
import { readFileSync } from 'node:fs';

const SITE = 'https://picky-pic.com/';
const CRED_FILE = process.env.CRED_FILE || '/tmp/sv/env';

const action = process.argv[2];
if (!['token', 'verify'].includes(action)) {
  console.error('Usage: node scripts/google-site-verify.mjs <token|verify>');
  process.exit(1);
}

const envText = readFileSync(CRED_FILE, 'utf8');
const emailMatch = envText.match(/^GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL\s*=\s*"?([^"\n]+)"?/m);
const keyMatch = envText.match(/^GOOGLE_INDEXING_PRIVATE_KEY\s*=\s*"([^"]+)"/m);

if (!emailMatch || !keyMatch) {
  console.error('Credentials not found in', CRED_FILE);
  console.error('Run: vercel env pull /tmp/sv/env --environment=production --yes');
  process.exit(1);
}

const email = emailMatch[1].trim();
const key = keyMatch[1].replace(/\\n/g, '\n');

const client = new JWT({
  email,
  key,
  scopes: ['https://www.googleapis.com/auth/siteverification'],
});

const at = await client.getAccessToken();
if (!at.token) {
  console.error('Failed to obtain access token');
  process.exit(1);
}

if (action === 'token') {
  const res = await fetch('https://www.googleapis.com/siteVerification/v1/token', {
    method: 'POST',
    headers: { Authorization: `Bearer ${at.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verificationMethod: 'META',
      site: { identifier: SITE, type: 'SITE' },
    }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (data.token) {
    // Token comes as `google-site-verification=ABC123...`. We just want the value.
    const value = data.token.replace(/^google-site-verification=/, '').replace(/^[^=]*=/, '');
    console.error('\nMETA tag content value (paste into BaseLayout.astro):');
    console.error(value);
  }
} else {
  const res = await fetch(
    'https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=META',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${at.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: { identifier: SITE, type: 'SITE' },
      }),
    }
  );
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (res.ok && data.owners) {
    console.error('\n✅ Service account is now an owner of', SITE);
  } else {
    console.error('\n❌ Verification failed. Status:', res.status);
  }
}
