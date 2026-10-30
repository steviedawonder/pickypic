/**
 * Blog post body (Portable Text) -> HTML, shared by the post page and the RSS
 * feed so both carry the same full text. Naver asks feeds to include the whole
 * post, not an excerpt.
 */
import { toHTML } from '@portabletext/to-html';
import { normalizeBreakSpans } from '../components/admin/shared/portableText';
import { sanitizeSlug } from './slug';
import { sanityImg, sanitySrcset, sanityDims } from './sanityImage';

export interface Heading {
  level: 'h2' | 'h3';
  text: string;
  id: string;
}

/** Image asset reference ("image-<id>-<ext>") -> CDN URL, for blocks fetched without asset-> expansion. */
function refToUrl(ref?: string): string {
  const m = ref?.match(/^image-(.+)-(\w+)$/);
  return m ? `https://cdn.sanity.io/images/7b9lcco4/production/${m[1]}.${m[2]}` : '';
}

/**
 * h2/h3 headings for the table of contents, with the anchor ids the renderer
 * puts on them. Pasted posts can carry "h1" blocks; they render as h2 (the post
 * title is the page's only H1) and count as h2 here.
 */
export function extractHeadings(body: any[] | undefined): { headings: Heading[]; keyToId: Record<string, string> } {
  const headings: Heading[] = [];
  const keyToId: Record<string, string> = {};
  (body || []).forEach((block: any) => {
    if (block._type === 'block' && (block.style === 'h1' || block.style === 'h2' || block.style === 'h3')) {
      const text = (block.children || []).map((c: any) => c.text || '').join('');
      const id = sanitizeSlug(text) || block._key;
      headings.push({ level: block.style === 'h3' ? 'h3' : 'h2', text, id });
      keyToId[block._key] = id;
    }
  });
  return { headings, keyToId };
}

export function renderPostBody(
  body: any[] | undefined,
  { title, keyToId = {} }: { title: string; keyToId?: Record<string, string> },
): string {
  if (!body) return '';
  // Restore line breaks that older paste-flattened posts stored as blank
  // spans; toHTML then renders "\n" hard breaks as <br>.
  const normalizedBody = body.map(normalizeBreakSpans);
  return toHTML(normalizedBody, {
    components: {
      block: {
        // h2/h3에 앵커 ID 주입 (ToC 연동)
        h1: ({ children, value }: any) => `<h2 id="${keyToId[value._key] || value._key}">${children}</h2>`,
        h2: ({ children, value }: any) => `<h2 id="${keyToId[value._key] || value._key}">${children}</h2>`,
        h3: ({ children, value }: any) => `<h3 id="${keyToId[value._key] || value._key}">${children}</h3>`,
      },
      types: {
        image: ({ value }: { value: any }) => {
          const url = value.url || value.asset?.url || refToUrl(value.asset?._ref);
          if (!url) return '';
          const alt = value.alt || `피키픽 포토부스 블로그 이미지 — ${title}`;
          const caption = value.caption || '';
          // Resized by Sanity's CDN (originals were multi-MB); the intrinsic size
          // reserves the box so text below doesn't jump as images arrive.
          const dims = sanityDims(url);
          const srcset = sanitySrcset(url, [480, 768, 1080, 1440]);
          const sizeAttrs = dims ? ` width="${dims.width}" height="${dims.height}"` : '';
          const srcsetAttrs = srcset ? ` srcset="${srcset}" sizes="(min-width: 768px) 720px, 100vw"` : '';
          const imgHtml = `<img src="${sanityImg(url, 1080)}"${srcsetAttrs}${sizeAttrs} alt="${alt}" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:8px;" loading="lazy" decoding="async" />`;
          if (caption) {
            return `<figure style="margin:16px 0;">${imgHtml}<figcaption style="text-align:center;font-size:13px;color:#888;padding-top:8px;">${caption}</figcaption></figure>`;
          }
          return `<div style="margin:16px 0;">${imgHtml}</div>`;
        },
        collage: ({ value }: { value: any }) => {
          const imgs: { url: string; alt: string; aspect?: number }[] = (value.images || [])
            .map((entry: any) => {
              const u =
                entry.url || entry.asset?.asset?.url || entry.asset?.url || refToUrl(entry.asset?.asset?._ref || entry.asset?._ref);
              return { url: u, alt: entry.alt || '', aspect: entry.aspectRatio };
            })
            .filter((i: any) => !!i.url);
          if (imgs.length === 0) return '';
          const count = imgs.length;
          const layout =
            value.layout || (count === 2 ? 'grid-2' : count === 3 ? 'grid-3-1L2R' : count === 4 ? 'grid-4-2x2' : 'bento-5plus');
          const baseContainer = 'display:grid;gap:6px;margin:16px 0;width:100%;';
          let container = baseContainer;
          const items: string[] = [];
          if (layout === 'grid-2') {
            container += 'grid-template-columns:1fr 1fr;';
            for (let i = 0; i < count; i++) items.push('width:100%;height:100%;object-fit:cover;border-radius:4px;aspect-ratio:1/1;');
          } else if (layout === 'grid-3-1L2R') {
            container += 'grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;grid-auto-flow:column;';
            items.push('grid-row:1 / span 2;width:100%;height:100%;object-fit:cover;border-radius:4px;');
            items.push('width:100%;height:100%;object-fit:cover;border-radius:4px;');
            items.push('width:100%;height:100%;object-fit:cover;border-radius:4px;');
          } else if (layout === 'grid-4-2x2') {
            container += 'grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;';
            for (let i = 0; i < 4; i++) items.push('width:100%;height:100%;object-fit:cover;border-radius:4px;aspect-ratio:1/1;');
          } else {
            container += 'grid-template-columns:repeat(6, 1fr);';
            items.push('grid-column:span 3;width:100%;height:100%;object-fit:cover;border-radius:4px;aspect-ratio:16/10;');
            items.push('grid-column:span 3;width:100%;height:100%;object-fit:cover;border-radius:4px;aspect-ratio:16/10;');
            for (let i = 2; i < count; i++) items.push('grid-column:span 2;width:100%;height:100%;object-fit:cover;border-radius:4px;aspect-ratio:1/1;');
          }
          const imgTags = imgs
            .map((img, i) => {
              const style = items[i] || items[items.length - 1];
              return `<img src="${sanityImg(img.url, 720)}" alt="${img.alt || `피키픽 포토부스 블로그 이미지 — ${title}`}" style="${style}" loading="lazy" decoding="async" />`;
            })
            .join('');
          const caption = value.caption || '';
          const capHtml = caption
            ? `<figcaption style="text-align:center;font-size:13px;color:#888;padding-top:8px;">${caption}</figcaption>`
            : '';
          return `<figure style="margin:16px 0;"><div style="${container}">${imgTags}</div>${capHtml}</figure>`;
        },
      },
    },
  });
}

/** GROQ projection for `body` that expands every image asset the renderer needs. */
export const POST_BODY_PROJECTION = `body[] {
      ...,
      _type == "image" => {
        ...,
        asset-> { _id, url }
      },
      _type == "collage" => {
        ...,
        images[] {
          ...,
          asset { ..., asset-> { _id, url } }
        }
      }
    }`;
