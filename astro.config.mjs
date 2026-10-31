// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

const SITE = 'https://picky-pic.com';

// Canonical URLs carry no trailing slash; only the root keeps its "/".
// Pages still build as /rental/index.html (build.format 'directory'), which
// Vercel serves at /rental. The slash form is 301'd by the last redirect in
// vercel.json, before the adapter's own 308 for trailingSlash 'never' runs.
// Canonicals, sitemaps, RSS, hreflang and internal links all use this form.
/** @param {string} url */
const canonical = (url) => (url === `${SITE}/` ? url : url.replace(/\/+$/, ''));

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  security: {
    // Astro only trusts Host / X-Forwarded-Host values listed here. With the
    // list empty it builds SSR request URLs as https://localhost/..., so the
    // prerendered 404 page it fetches for an empty-body 404 (e.g. GET on a
    // POST-only API route) resolves to localhost, the fetch is refused, and
    // Vercel answers 500 FUNCTION_INVOCATION_FAILED instead of 404.
    allowedDomains: [
      { protocol: 'https', hostname: 'picky-pic.com' },
      { protocol: 'https', hostname: '**.vercel.app' },
    ],
  },
  adapter: vercel(),
  vite: {
    // @ts-ignore vite version mismatch between astro and @tailwindcss/vite
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    sitemap({
      // Site is single-language at the URL level (client-side i18n only).
      // Removing i18n config so we don't emit incorrect xhtml:link alternates.
      // (The one ko/en pair gets hreflang in the HTML via src/data/i18nPairs.ts.)
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '');
        // /blog is rendered on demand and listed in sitemap-blog.xml, where its
        // lastmod is the newest post rather than the build time.
        return !/^\/(shop|admin|studio|api)(\/|$)/.test(path) && path !== '/blog';
      },
      // Sitemaps written by our own endpoints, so the index — the one URL to
      // submit to Search Console and Naver Search Advisor — covers everything.
      customSitemaps: [
        `${SITE}/sitemap-blog.xml`,
        `${SITE}/sitemap-portfolio.xml`,
        `${SITE}/image-sitemap.xml`,
      ],
      changefreq: 'weekly',
      priority: 0.7,
      // No `lastmod`: stamping every URL with the build time on each deploy
      // teaches crawlers to ignore the field. The blog and portfolio sitemaps
      // carry real per-URL dates from Sanity.
      serialize(item) {
        const url = canonical(item.url);

        // Highest priority: home + primary SEO landing pages
        const top = [
          `${SITE}/`,
          `${SITE}/rental`,
          `${SITE}/photobooth-rental`,
          `${SITE}/photobooth-purchase`,
          `${SITE}/photobooth-startup`,
          `${SITE}/popup-photobooth`,
          `${SITE}/corporate-event`,
          `${SITE}/retro-photobooth`,
          `${SITE}/en/singapore-photobooth`,
          `${SITE}/en`,
          `${SITE}/en/kickstarter`,
        ];
        if (top.includes(url)) {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }

        // Second tier: about, products, portfolio (+ details), collaboration, AI pages
        // (the blog index lives in sitemap-blog.xml)
        const second = [
          `${SITE}/about`,
          `${SITE}/products`,
          `${SITE}/portfolio`,
          `${SITE}/collaboration`,
          `${SITE}/ai-photobooth`,
          `${SITE}/ai-personal-color`,
        ];
        if (second.some((u) => url === u || url.startsWith(u + '/'))) {
          return { ...item, priority: 0.9, changefreq: 'weekly' };
        }

        // Support and detail pages
        if (url.includes('/support') || url.includes('/products/')) {
          return { ...item, priority: 0.7, changefreq: 'monthly' };
        }

        return item;
      },
    }),
  ],
});
