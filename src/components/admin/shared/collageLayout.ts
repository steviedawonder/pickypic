// ── Collage Layout 유틸 ──
// 이미지 비율 기반 Justified-rows 자동 배치
// 핵심 원칙:
//  1) 사용자가 레이아웃을 고르지 않음 — 개수/비율 기반 자동 결정
//  2) 각 셀의 aspect-ratio == 이미지 aspect-ratio → object-fit:cover 로도 크롭 없음
//  3) 전체는 직사각형 — 각 행이 가로 꽉 채움, 홀로 떨어지는 이미지 없음

// Legacy 타입 (Portable Text 마이그레이션 호환용)
export type CollageLayoutKey =
  | 'grid-2'
  | 'grid-3-1L2R'
  | 'grid-4-2x2'
  | 'bento-5plus'
  | 'auto-rows';

export interface CollageImage {
  url: string;
  alt?: string;
  aspectRatio?: number; // width / height
}

export function pickLayout(_count: number): CollageLayoutKey {
  return 'auto-rows';
}

// 이미지의 자연 비율을 (Promise로) 측정
export function measureAspectRatio(url: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        resolve(img.naturalWidth / img.naturalHeight);
      } else {
        resolve(1);
      }
    };
    img.onerror = () => resolve(1);
    img.src = url;
  });
}

export function extractAspect(img: HTMLImageElement): number {
  if (img.naturalWidth && img.naturalHeight) {
    return img.naturalWidth / img.naturalHeight;
  }
  const ds = img.dataset.aspect;
  if (ds) {
    const n = parseFloat(ds);
    if (!isNaN(n) && n > 0) return n;
  }
  return 1;
}

function esc(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function genId(): string {
  return 'clg_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface BuildOptions {
  /** @deprecated 자동 결정됨 */
  layout?: CollageLayoutKey;
  collageId?: string;
  caption?: string;
  editable?: boolean;
}

// ── 행 분배: 홀로 떨어지는 이미지 없게 (n=1 예외) ──
// 3s + 4s 조합만으로 분배 (5만 예외: [2,3]). "2"가 중간에 끼지 않도록 보장.
export function distributeRows(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n <= 4) return [n];
  // 3a + 4b = n, b 큰 쪽 우선(행 수 최소화)
  for (let b = Math.floor(n / 4); b >= 0; b--) {
    const rest = n - 4 * b;
    if (rest >= 0 && rest % 3 === 0) {
      const a = rest / 3;
      const rows: number[] = [];
      for (let i = 0; i < a; i++) rows.push(3);
      for (let i = 0; i < b; i++) rows.push(4);
      return rows;
    }
  }
  // 유일한 잔여 케이스: n=5 → [2,3]
  return [2, 3];
}

// 콜라주 HTML 빌더 — Justified rows
export function buildCollageHtml(
  images: CollageImage[],
  options: BuildOptions = {},
): string {
  const count = images.length;
  if (count === 0) return '';
  const id = options.collageId || genId();
  const editable = options.editable !== false;

  const enriched = images.map((im) => ({
    ...im,
    aspectRatio: im.aspectRatio && im.aspectRatio > 0 ? im.aspectRatio : 1,
  }));

  const wrapperAttr = editable ? ` contenteditable="false"` : '';
  let html = `<div class="img-collage-wrapper"${wrapperAttr} data-collage-id="${id}" style="margin:12px 0;">`;

  if (count === 1) {
    const im = enriched[0];
    const ar = ` data-aspect="${im.aspectRatio}"`;
    html +=
      `<div class="img-collage" data-layout="auto-rows" style="width:100%;">` +
      `<img src="${esc(im.url)}" alt="${esc(im.alt || '')}"${ar} style="display:block;width:100%;height:auto;border-radius:2px;" loading="lazy" />` +
      `</div>`;
  } else {
    const rows = distributeRows(count);
    html += `<div class="img-collage" data-layout="auto-rows" style="display:flex;flex-direction:column;gap:6px;width:100%;">`;
    let idx = 0;
    for (const rowSize of rows) {
      const rowImgs = enriched.slice(idx, idx + rowSize);
      idx += rowSize;
      const aspects = rowImgs.map((im) => im.aspectRatio!);
      const sum = aspects.reduce((a, b) => a + b, 0);
      html += `<div class="img-collage-row" style="display:flex;gap:6px;aspect-ratio:${sum.toFixed(4)} / 1;width:100%;">`;
      rowImgs.forEach((im) => {
        const aspect = im.aspectRatio!;
        const ar = ` data-aspect="${aspect}"`;
        html +=
          `<img src="${esc(im.url)}" alt="${esc(im.alt || '')}"${ar} ` +
          `style="flex:${aspect.toFixed(4)} ${aspect.toFixed(4)} 0;min-width:0;width:100%;height:100%;object-fit:cover;border-radius:2px;display:block;" ` +
          `loading="lazy" />`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  }

  const captionAttr = editable
    ? ` contenteditable="true" data-placeholder="사진 설명을 입력하세요."`
    : '';
  const captionText = options.caption ? esc(options.caption) : '';
  const captionHtml =
    editable || captionText
      ? `<div class="img-caption"${captionAttr} style="text-align:center;font-size:13px;color:#888;padding:8px 4px;min-height:1em;">${captionText}</div>`
      : '';
  html += captionHtml + `</div>`;
  return html;
}

// 단일 이미지 + 캡션 래퍼 HTML 빌더 (개별사진 경로)
export function buildFigureHtml(
  url: string,
  alt: string = '',
  caption: string = '',
  editable: boolean = true,
): string {
  const captionAttr = editable
    ? ` contenteditable="true" data-placeholder="사진 설명을 입력하세요."`
    : '';
  const captionText = caption ? esc(caption) : '';
  const captionHtml = editable || captionText
    ? `<div class="img-caption"${captionAttr} style="text-align:center;font-size:13px;color:#888;padding:8px 4px;min-height:1em;">${captionText}</div>`
    : '';
  const wrapperAttr = editable ? ` contenteditable="false"` : '';
  return (
    `<div class="img-figure-wrapper"${wrapperAttr} style="margin:12px 0;">` +
    `<img src="${esc(url)}" alt="${esc(alt)}" style="max-width:100%;height:auto;display:block;margin:0 auto;border-radius:4px;" loading="lazy" />` +
    captionHtml +
    `</div>`
  );
}

// 전역 스타일 (placeholder, hover 등)
export const COLLAGE_CSS = `
.img-collage-wrapper, .img-figure-wrapper { position: relative; }
.img-collage { overflow: hidden; }
.img-collage img { display: block; }
.img-collage-row { overflow: hidden; }
.img-caption:empty::before { content: attr(data-placeholder); color: #bbb; pointer-events: none; }
.img-caption:focus { outline: none; color: #555; }
`;
