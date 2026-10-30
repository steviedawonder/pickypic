// Image sitemap for Google Image Search optimization
export const prerender = true;

import { portfolioItems } from '@data/portfolio';

const siteUrl = 'https://picky-pic.com';

// Page locs are canonical (no trailing slash, like the canonical tags), and
// every image listed must actually render on that page.

const pages = [
  {
    loc: '/',
    images: [
      { loc: '/images/hero/main-1.jpg', title: '피키픽 포토부스 대여 — 모던 레트로 감성 포토부스 렌탈 서비스' },
      { loc: '/images/hero/main-2.jpg', title: '피키픽 포토부스 렌탈 — 브랜드 팝업스토어 기업 행사 포토부스' },
      { loc: '/images/hero/main-3.jpg', title: '피키픽 PICKYPIC 포토부스 — 프리미엄 포토부스 대여 전문' },
    ],
  },
  {
    loc: '/rental',
    images: [
      { loc: '/images/rental/rental-1.jpg', title: '피키픽 포토부스 렌탈 테이블 타입 모던 레트로피키 — 영수증 사진 포토부스 대여' },
      { loc: '/images/rental/rental-2.jpg', title: '피키픽 포토부스 렌탈 테이블 타입 어반 레트로피키 — 영수증 사진 포토부스 대여' },
      { loc: '/images/rental/rental-3.jpg', title: '피키픽 포토부스 렌탈 테이블 타입 모던 미니피키 — 미니 포토부스 대여' },
      { loc: '/images/rental/rental-4.jpg', title: '피키픽 포토부스 렌탈 테이블 타입 어반 미니피키 — 미니 포토부스 대여' },
      { loc: '/images/rental/rental-5.jpg', title: '피키픽 포토부스 렌탈 스탠드 타입 모던피키 — 스탠드형 포토부스 대여' },
      { loc: '/images/rental/rental-6.jpg', title: '피키픽 포토부스 렌탈 스탠드 타입 클래식피키 — 스탠드형 포토부스 대여' },
      { loc: '/images/rental/rental-7.jpg', title: '피키픽 포토부스 렌탈 스탠드 타입 어반피키 — 스탠드형 포토부스 대여' },
      { loc: '/images/rental/rental-8.jpg', title: '피키픽 포토부스 렌탈 부스 타입 아웃도어피키 — 부스형 포토부스 대여' },
      { loc: '/images/rental/rental-9.jpg', title: '피키픽 포토부스 렌탈 부스 타입 에어피키 — 부스형 포토부스 대여' },
    ],
  },
  {
    loc: '/products',
    images: [
      { loc: '/images/products/modern-picky-photo.webp', title: '피키픽 모던피키 Modern Picky — 스탠드형 포토부스 제품' },
      { loc: '/images/products/modern-picky-line.png', title: '피키픽 모던피키 Modern Picky — 스탠드형 포토부스 도면' },
      { loc: '/images/products/classic-picky-photo.webp', title: '피키픽 클래식피키 Classic Picky — 스탠드형 포토부스 제품' },
      { loc: '/images/products/classic-picky-line.png', title: '피키픽 클래식피키 Classic Picky — 스탠드형 포토부스 도면' },
      { loc: '/images/products/urban-picky-photo.webp', title: '피키픽 어반피키 Urban Picky — 스탠드형 포토부스 제품' },
      { loc: '/images/products/urban-picky-line.png', title: '피키픽 어반피키 Urban Picky — 스탠드형 포토부스 도면' },
      { loc: '/images/products/modern-mini-picky-photo.webp', title: '피키픽 모던 미니피키 Modern Mini Picky — 테이블형 포토부스 제품' },
      { loc: '/images/products/modern-mini-picky-line.png', title: '피키픽 모던 미니피키 Modern Mini Picky — 테이블형 포토부스 도면' },
      { loc: '/images/products/urban-mini-picky-photo.webp', title: '피키픽 어반 미니피키 Urban Mini Picky — 테이블형 포토부스 제품' },
      { loc: '/images/products/urban-mini-picky-line.png', title: '피키픽 어반 미니피키 Urban Mini Picky — 테이블형 포토부스 도면' },
      { loc: '/images/products/modern-retro-picky-photo.webp', title: '피키픽 모던 레트로피키 Modern Retro Picky — 레트로 영수증 포토부스 제품' },
      { loc: '/images/products/modern-retro-picky-line.png', title: '피키픽 모던 레트로피키 Modern Retro Picky — 레트로 영수증 포토부스 도면' },
      { loc: '/images/products/urban-retro-picky-photo.webp', title: '피키픽 어반 레트로피키 Urban Retro Picky — 레트로 영수증 포토부스 제품' },
      { loc: '/images/products/urban-retro-picky-line.png', title: '피키픽 어반 레트로피키 Urban Retro Picky — 레트로 영수증 포토부스 도면' },
      { loc: '/images/products/outdoor-picky-photo.webp', title: '피키픽 아웃도어피키 Outdoor Picky — 부스형 포토부스 제품' },
      { loc: '/images/products/outdoor-picky-line.png', title: '피키픽 아웃도어피키 Outdoor Picky — 부스형 포토부스 도면' },
      { loc: '/images/products/air-picky-photo.webp', title: '피키픽 에어피키 Air Picky — 부스형 포토부스 제품' },
      { loc: '/images/products/air-picky-line.png', title: '피키픽 에어피키 Air Picky — 부스형 포토부스 도면' },
    ],
  },
  {
    // Listing thumbnails (alt text as rendered by src/pages/portfolio/index.astro).
    // Sanity items are left out: their images live on cdn.sanity.io and change
    // without a rebuild.
    loc: '/portfolio',
    images: portfolioItems.map((item) => ({
      loc: item.image,
      title: `${item.title} | 포토부스 렌탈`,
    })),
  },
  // Detail pages (alt text as rendered by src/pages/portfolio/[id].astro).
  ...portfolioItems.map((item) => ({
    loc: `/portfolio/${item.id}`,
    images: item.detailImages.map((src, i) => ({
      loc: src,
      title: `${item.title} 포토부스 렌탈 이미지 ${i + 1}`,
    })),
  })),
  {
    loc: '/about',
    images: [
      { loc: '/images/company/company-hero.webp', title: '피키픽 포토부스 회사소개 — 서울 성수동 프리미엄 포토부스 렌탈 기업 PICKYPIC' },
    ],
  },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const urlEntries = pages
    .map(
      (page) => `  <url>
    <loc>${siteUrl}${page.loc}</loc>
${page.images
  .map(
    (img) => `    <image:image>
      <image:loc>${siteUrl}${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`
  )
  .join('\n')}
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
