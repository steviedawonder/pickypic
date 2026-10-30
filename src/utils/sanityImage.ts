/**
 * URL builders for images served by the Sanity image CDN.
 *
 * GROQ's `asset->url` is the original upload — often a 2–5 MB camera JPEG or
 * PNG — and pages were shipping it as-is. These add Sanity's on-the-fly resize
 * and format parameters. Anything that isn't a cdn.sanity.io image (local
 * /images files, GIF, SVG) passes through untouched.
 */
const CDN = 'https://cdn.sanity.io/images/';
const skip = (url?: string) => !url || !url.startsWith(CDN) || /\.(gif|svg)(\?|$)/i.test(url);

/** At most `w` px wide, WebP/AVIF where the browser accepts it. fit=max keeps the aspect ratio and never upscales. */
export function sanityImg(url: string | undefined, w: number, q = 75): string {
  if (skip(url)) return url ?? '';
  const u = new URL(url!);
  u.searchParams.set('w', String(w));
  u.searchParams.set('fit', 'max');
  u.searchParams.set('auto', 'format');
  u.searchParams.set('q', String(q));
  return u.toString();
}

/** srcset for the widths given; undefined for non-Sanity URLs so the attribute is simply omitted. */
export function sanitySrcset(url: string | undefined, widths: number[], q = 75): string | undefined {
  if (skip(url)) return undefined;
  return widths.map((w) => `${sanityImg(url, w, q)} ${w}w`).join(', ');
}

/** Intrinsic size, which Sanity encodes in the asset filename (…-1080x1350.jpg). */
export function sanityDims(url?: string): { width: number; height: number } | undefined {
  const m = url?.match(/-(\d+)x(\d+)\.[a-z]+(?:\?|$)/i);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : undefined;
}

/**
 * Fixed-size JPEG crop, for og:image and Article structured data: share
 * scrapers and crawlers need a known format and size, so no auto=format here.
 */
export function sanityCrop(url: string, w: number, h: number, q = 80): string {
  if (skip(url)) return url;
  const u = new URL(url);
  u.search = '';
  u.searchParams.set('w', String(w));
  u.searchParams.set('h', String(h));
  u.searchParams.set('fit', 'crop');
  u.searchParams.set('crop', 'entropy');
  u.searchParams.set('fm', 'jpg');
  u.searchParams.set('q', String(q));
  return u.toString();
}
