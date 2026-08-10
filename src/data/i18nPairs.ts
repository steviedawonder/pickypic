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
 * Keys and values are the built paths, with trailing slash (Astro's output).
 */
export const PAIRS: Record<string, string> = {
  '/': '/en/',
  // Add a line here the moment the counterpart page actually exists — never before.
  // '/about/': '/en/about/',
};

const EN_TO_KO: Record<string, string> = Object.fromEntries(
  Object.entries(PAIRS).map(([ko, en]) => [en, ko])
);

/** Normalize to the trailing-slash form used as table keys. */
function normalize(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
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
  return to === 'en' ? '/en/' : '/';
}
