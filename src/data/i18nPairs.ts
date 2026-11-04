/**
 * Korean <-> English page pairs.
 *
 * hreflang is only emitted for pages listed here. A page with no counterpart
 * gets canonical only — pointing hreflang at a URL that 404s makes Google
 * discard the whole cluster, which is worse than emitting nothing.
 *
 * Both sides read this one table, so the annotations are symmetric by
 * construction. Google ignores one-way hreflang.
 *
 * ja is omitted: Japanese is a client-side text swap with no URL of its own,
 * so there is nothing an hreflang annotation could point at.
 *
 * x-default points at English: a visitor whose language matches neither ko
 * nor en reads English better than Korean, and Korean speakers always match
 * `ko`, so they never fall through to x-default.
 *
 * Keys and values are canonical paths: no trailing slash, except the root
 * (astro.config.mjs sets trailingSlash: 'never'; vercel.json 301s the slash form).
 */
export const PAIRS: Record<string, string> = {
  '/': '/en',
  // Add a line here the moment the counterpart page actually exists — never before.
  // '/about': '/en/about',
};

const EN_TO_KO: Record<string, string> = Object.fromEntries(
  Object.entries(PAIRS).map(([ko, en]) => [en, ko])
);

/** Normalize to the canonical form used as table keys: no trailing slash except the root. */
function normalize(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * The ko/en pair for a path, or null when the page has no counterpart.
 * Works from either side.
 */
export function getPair(pathname: string): { ko: string; en: string } | null {
  const path = normalize(pathname);
  if (PAIRS[path]) return { ko: path, en: PAIRS[path] };
  if (EN_TO_KO[path]) return { ko: EN_TO_KO[path], en: path };
  return null;
}

/**
 * Where the language switcher should point.
 * Falls back to the other language's home page rather than 404ing.
 */
export function switchTarget(pathname: string, to: 'ko' | 'en'): string {
  const pair = getPair(pathname);
  if (pair) return pair[to];
  return to === 'en' ? '/en' : '/';
}
