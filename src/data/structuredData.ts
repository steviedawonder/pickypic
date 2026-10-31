/**
 * Builders for every JSON-LD node on the site.
 *
 * Nodes reference each other by stable @id, so the company is described once
 * (in full on the pages Google and Naver read it from: /, /en, /about) and every
 * other node points at it with { "@id": ORG_ID } instead of repeating a copy
 * that can drift.
 *
 * URLs here must match <link rel="canonical"> byte for byte — no trailing slash
 * (the root stays "/"), percent-encoded. pageUrl() is the one place that rule
 * lives; BaseLayout builds the canonical tag with it too.
 */
import { company } from './company';
import { sanityCrop } from '../utils/sanityImage';

export const SITE = 'https://picky-pic.com';
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;
export const LOGO_ID = `${SITE}/#logo`;

export type Lang = 'ko' | 'en';
export type Node = Record<string, unknown>;
export interface Crumb {
  name: string;
  href: string;
}

// WebSite.name must equal Organization.name for Google's site-name system, and
// both match og:site_name. alternateName is read in order of preference.
const NAME = company.brand;
const ALT_NAMES = ['피키픽', '피키픽 포토부스', 'PICKYPIC PHOTOBOOTH'];

/** Canonical form of a path: no trailing slash except the root. */
export function canonicalPath(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : '/';
}

/** Absolute canonical URL for a page path (query and hash dropped, Hangul percent-encoded). */
export function pageUrl(path: string): string {
  // Decode first so a raw Hangul slug and an already-encoded request path come
  // out byte-identical (URL re-encodes with uppercase hex either way).
  let decoded = path;
  try {
    decoded = decodeURI(path);
  } catch {
    // Malformed escape sequence: keep the path as given.
  }
  const u = new URL(decoded, SITE);
  u.search = '';
  u.hash = '';
  u.pathname = canonicalPath(u.pathname);
  return u.href;
}

/** Absolute URL for an asset (image, file). */
export function assetUrl(src: string): string {
  return new URL(src, SITE).href;
}

/**
 * Sanity stores the admin's <input type="datetime-local"> value with no zone.
 * It was typed in Korea, so read it as KST; JSON-LD and article:* meta need a
 * zoned ISO 8601 value or a crawler has to guess.
 */
export function isoDate(v?: string | null): string | undefined {
  if (!v) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(v)) return v;
  return `${/T\d{2}:\d{2}$/.test(v) ? `${v}:00` : v}+09:00`;
}

/** 16:9, 4:3 and 1:1 crops — Google's Article image recommendation. */
export function articleImages(src: string): string[] {
  if (!src) return [];
  if (!src.startsWith('https://cdn.sanity.io/')) return [assetUrl(src)];
  return [
    [1200, 675],
    [1200, 900],
    [1200, 1200],
  ].map(([w, h]) => sanityCrop(src, w, h));
}

/** Full company node. Emitted on /, /en and /about only (Google: home or about page). */
export function orgNode(lang: Lang): Node {
  const en = lang === 'en';
  return {
    // Organization is listed explicitly because Naver's 사이트 연관채널 markup
    // documents only Person and Organization; LocalBusiness alone may be skipped.
    '@type': ['Organization', 'LocalBusiness'],
    '@id': ORG_ID,
    name: NAME,
    alternateName: ALT_NAMES,
    legalName: en ? company.nameEn : company.name,
    url: `${SITE}/`,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: company.logo,
      contentUrl: company.logo,
      width: company.logoWidth,
      height: company.logoHeight,
      caption: NAME,
    },
    // Real photos: Google advises against a logo as a page's representative image.
    image: [assetUrl('/images/hero/main-1.jpg'), assetUrl('/images/hero/main-2.jpg')],
    description: en ? company.descriptionEn : company.description,
    telephone: company.phoneE164,
    email: company.email,
    foundingDate: company.foundingDate,
    taxID: company.businessNumber,
    address: en
      ? {
          '@type': 'PostalAddress',
          streetAddress: 'Pungnim Techwon 205-206, 31 Seongsui-ro 18-gil',
          addressLocality: 'Seongdong-gu',
          addressRegion: 'Seoul',
          postalCode: '04787',
          addressCountry: 'KR',
        }
      : {
          '@type': 'PostalAddress',
          streetAddress: '성수이로18길 31, 풍림테크원 205,206호',
          addressLocality: '성동구',
          addressRegion: '서울특별시',
          postalCode: '04787',
          addressCountry: 'KR',
        },
    ...(company.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: company.geo.lat, longitude: company.geo.lng } }
      : {}),
    sameAs: company.sameAs,
    knowsLanguage: ['ko', 'en', 'ja'],
    areaServed: [
      { '@type': 'Country', name: en ? 'South Korea' : '대한민국' },
      { '@type': 'Country', name: en ? 'Singapore' : '싱가포르' },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: company.phoneE164,
        email: company.email,
        availableLanguage: ['ko', 'en'],
      },
      { '@type': 'ContactPoint', contactType: 'partnerships', email: company.partnerEmail },
    ],
  };
}

/**
 * Every other page carries a slim node so @id references resolve on the page.
 * Organization only: a LocalBusiness without an address is an invalid item.
 */
export function orgRef(): Node {
  return { '@type': 'Organization', '@id': ORG_ID, name: NAME, url: `${SITE}/`, logo: company.logo };
}

export function websiteNode(): Node {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: NAME,
    alternateName: ALT_NAMES,
    // Japanese has no URLs (client-side swap only), so it is not claimed here.
    inLanguage: ['ko', 'en'],
    publisher: { '@id': ORG_ID },
  };
}

export function webPageNode(o: {
  url: string;
  type?: string;
  name: string;
  description?: string;
  lang: Lang;
  image?: string;
  about?: string;
  mainEntity?: string;
}): Node {
  return {
    '@type': o.type ?? 'WebPage',
    '@id': o.url,
    url: o.url,
    name: o.name,
    ...(o.description ? { description: o.description } : {}),
    inLanguage: o.lang,
    isPartOf: { '@id': WEBSITE_ID },
    ...(o.about ? { about: { '@id': o.about } } : {}),
    ...(o.mainEntity ? { mainEntity: { '@id': o.mainEntity } } : {}),
    ...(o.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: o.image } } : {}),
  };
}

export function breadcrumbNode(pageCanonical: string, items: Crumb[], lang: Lang): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageCanonical}#breadcrumb`,
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      // Naver's breadcrumb guide: a generic crumb name like "홈" is not useful.
      // The visible breadcrumb keeps its label; only the markup is renamed.
      name: i === 0 && canonicalPath(c.href) === '/' ? (lang === 'en' ? NAME : '피키픽') : c.name,
      item: pageUrl(c.href),
    })),
  };
}

const MODEL_GROUPS: Record<Lang, { name: string; items: string[] }[]> = {
  ko: [
    { name: '스탠드형 포토부스', items: ['Modern Picky', 'Classic Picky', 'Urban Picky'] },
    { name: '테이블형 포토부스', items: ['Modern Mini Picky', 'Urban Mini Picky', 'Modern Retro Picky', 'Urban Retro Picky'] },
    { name: '부스형 포토부스', items: ['Outdoor Picky', 'Air Picky'] },
  ],
  // English markets sell the two Retro models as Receipt models — see enProductNames.ts.
  en: [
    { name: 'Stand type', items: ['Modern Picky', 'Classic Picky', 'Urban Picky'] },
    { name: 'Table type', items: ['Modern Mini Picky', 'Urban Mini Picky', 'Modern Receipt Picky', 'Urban Receipt Picky'] },
    { name: 'Booth type', items: ['Outdoor Picky', 'Air Picky'] },
  ],
};

/** Rental service. No price anywhere: a Service/Offer without one raises no Google error. */
export function serviceNode(o: {
  url: string;
  lang: Lang;
  name: string;
  serviceType: string;
  description: string;
  areaServed?: ('KR' | 'SG')[];
  /** Limit the catalogue to the models the page is about (e.g. the two Retro models). */
  models?: string[];
}): Node {
  const en = o.lang === 'en';
  const country = { KR: en ? 'South Korea' : '대한민국', SG: en ? 'Singapore' : '싱가포르' };
  const groups = MODEL_GROUPS[o.lang]
    .map((g) => ({ ...g, items: g.items.filter((m) => !o.models || o.models.includes(m)) }))
    .filter((g) => g.items.length > 0);
  return {
    '@type': 'Service',
    '@id': `${o.url}#service`,
    name: o.name,
    serviceType: o.serviceType,
    description: o.description,
    provider: { '@id': ORG_ID },
    areaServed: (o.areaServed ?? ['KR', 'SG']).map((c) => ({ '@type': 'Country', name: country[c] })),
    mainEntityOfPage: { '@id': o.url },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: en ? 'Photo Booth Rental Catalogue' : '포토부스 렌탈 카탈로그',
      itemListElement: groups.map((g) => ({
        '@type': 'OfferCatalog',
        name: g.name,
        itemListElement: g.items.map((m) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: en ? `${m} rental` : `${m} 렌탈` },
        })),
      })),
    },
  };
}

export function blogPostingNode(o: {
  url: string;
  headline: string;
  description?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  image?: string;
  authorName?: string | null;
  section?: string | null;
  tags?: string[] | null;
  wordCount?: number;
}): Node {
  // Posts signed "PICKYPIC" are the company writing, not a person called PICKYPIC.
  const person = o.authorName && o.authorName !== NAME;
  return {
    '@type': 'BlogPosting',
    '@id': `${o.url}#article`,
    mainEntityOfPage: { '@id': o.url },
    url: o.url,
    headline: o.headline,
    ...(o.description ? { description: o.description } : {}),
    ...(isoDate(o.datePublished) ? { datePublished: isoDate(o.datePublished) } : {}),
    ...(isoDate(o.dateModified) ? { dateModified: isoDate(o.dateModified) } : {}),
    inLanguage: 'ko',
    ...(o.wordCount ? { wordCount: o.wordCount } : {}),
    ...(o.image ? { image: articleImages(o.image) } : {}),
    author: person ? { '@type': 'Person', name: o.authorName, worksFor: { '@id': ORG_ID } } : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    ...(o.section ? { articleSection: o.section } : {}),
    ...(o.tags?.length ? { keywords: o.tags.map((t) => t.replace(/^#/, '')) } : {}),
  };
}

/** Serialise nodes as one @graph. `<` is escaped so CMS text can never close the script element. */
export function jsonLd(graph: Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
