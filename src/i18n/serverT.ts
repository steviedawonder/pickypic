import { translations, type Lang } from './translations';

/**
 * Build-time translation lookup for shared chrome (Navbar, Footer, floating
 * button).
 *
 * Those components carry Korean fallback text and rely on the client-side
 * `data-i18n` pass to swap it. That leaves Korean labels in the served HTML of
 * /en/ pages — which is what text extractors read: LLM fetchers, link-preview
 * scrapers and Google's pre-render pass do not run our translation script.
 *
 * Resolving the label here means /en/ ships English in the markup itself. The
 * `data-i18n` attributes stay in place so the client pass still handles the
 * ko -> jp switch on Korean pages.
 */
export function serverT(pathname: string) {
  const lang: Lang = pathname.startsWith('/en') ? 'en' : 'ko';
  return (key: string): string =>
    translations[lang]?.[key] ?? translations.ko[key] ?? key;
}
