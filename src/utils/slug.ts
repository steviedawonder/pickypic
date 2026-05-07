/**
 * Slug sanitation utilities.
 * Hyphenates whitespace/periods, allows Hangul/Kana/CJK + ASCII, dedupes hyphens.
 */
export function sanitizeSlug(input: string): string {
  return input
    .trim()
    .replace(/[\s.]+/g, '-')                                  // whitespace/dots → hyphen
    .replace(/[^a-zA-Z0-9가-힣぀-ヿ一-龯\-]/g, '')  // strip disallowed chars
    .replace(/-{2,}/g, '-')                                   // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');                                 // strip leading/trailing hyphens
}

/**
 * True when the slug is already in canonical form. Used by the post page
 * to decide whether to issue a 301 redirect to the cleaned variant.
 */
export function isCleanSlug(slug: string): boolean {
  return slug === sanitizeSlug(slug);
}

/**
 * Romanization map for common Korean photobooth-domain words.
 * Used to suggest a SEO-friendly ASCII slug from a Korean title.
 * Not a general-purpose Hangul romanizer — extend as new title patterns appear.
 */
const KO_TO_EN_DICTIONARY: Array<[RegExp, string]> = [
  // brand & core
  [/피키픽포토부스|피키픽-포토부스|피키픽/g, 'pickypic'],
  [/포토부스/g, 'photobooth'],
  [/포토이즘/g, 'photoism'],
  [/인생네컷/g, 'four-cut-photo'],
  [/영수증사진기|영수증-사진기/g, 'receipt-camera'],
  [/감열지사진기|감열지-사진기/g, 'thermal-camera'],
  [/레트로/g, 'retro'],

  // service
  [/대여구매렌탈장단기|대여-구매-렌탈-장단기/g, 'rental-purchase'],
  [/대여|렌탈/g, 'rental'],
  [/구매|판매/g, 'purchase'],
  [/창업/g, 'startup'],
  [/협업/g, 'collaboration'],

  // venues / use cases
  [/모델하우스|모델-하우스/g, 'model-house'],
  [/팝업스토어|팝업-스토어/g, 'popup-store'],
  [/팝업/g, 'popup'],
  [/기업행사|기업-행사/g, 'corporate-event'],
  [/사내행사|사내-행사/g, 'company-event'],
  [/송년회/g, 'year-end-party'],
  [/체육대회/g, 'sports-day'],
  [/웨딩/g, 'wedding'],
  [/전시/g, 'exhibition'],
  [/페스티벌/g, 'festival'],
  [/카페/g, 'cafe'],
  [/호텔/g, 'hotel'],
  [/싱가포르/g, 'singapore'],

  // copy noise
  [/브랜드-소개|브랜드소개/g, 'brand-intro'],
  [/소개/g, 'intro'],
  [/가이드/g, 'guide'],
  [/후기/g, 'review'],
  [/사례/g, 'case-study'],
  [/선택/g, 'how-to-choose'],
  [/추천/g, 'recommend'],
  [/비용|가격/g, 'price'],
  [/서비스/g, 'service'],
];

/**
 * Best-effort Korean → ASCII slug suggestion.
 *
 * - Replaces known photobooth-domain phrases with English equivalents.
 * - Strips any remaining non-ASCII runs (Hangul that wasn't in the dictionary).
 * - Returns a sanitized, hyphen-separated slug, capped at 80 chars.
 *
 * Why: Korean URLs hurt Google indexing in practice (percent-encoded canonicals,
 * lower crawl priority, broken sharing). For an editorial CMS we want the
 * editor to start from a sensible English slug they can tweak by hand.
 */
export function suggestEnglishSlug(input: string, maxLength = 80): string {
  if (!input) return '';

  let working = input.trim().toLowerCase();

  for (const [pattern, replacement] of KO_TO_EN_DICTIONARY) {
    working = working.replace(pattern, ` ${replacement} `);
  }

  // Strip any leftover non-ASCII (Hangul/Kana/CJK that wasn't mapped)
  working = working.replace(/[^\x00-\x7F]+/g, ' ');

  // Hyphenate whitespace, drop disallowed, collapse hyphens
  let slug = working
    .replace(/[\s_.]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength).replace(/-+$/, '');
  }

  return slug;
}

/**
 * True when the slug is ASCII-only (a-z, 0-9, hyphen). Used by the editor
 * to nudge writers toward English slugs.
 */
export function isAsciiSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
