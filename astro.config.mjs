// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://picky-pic.com',
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
      filter: (page) =>
        !page.includes('/shop') &&
        !page.includes('/admin') &&
        !page.includes('/studio') &&
        !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const url = item.url;

        // Highest priority: home + primary SEO landing pages
        const top = [
          'https://picky-pic.com/',
          'https://picky-pic.com/rental',
          'https://picky-pic.com/photobooth-rental',
          'https://picky-pic.com/photobooth-purchase',
          'https://picky-pic.com/photobooth-startup',
          'https://picky-pic.com/popup-photobooth',
          'https://picky-pic.com/corporate-event',
          'https://picky-pic.com/retro-photobooth',
          'https://picky-pic.com/singapore-photobooth',
        ];
        if (top.some((u) => url === u || url === u + '/')) {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }

        // Second tier: about, products, portfolio, blog index
        const second = [
          'https://picky-pic.com/about',
          'https://picky-pic.com/products',
          'https://picky-pic.com/portfolio',
          'https://picky-pic.com/blog',
          'https://picky-pic.com/collaboration',
          'https://picky-pic.com/ai-personal-color',
        ];
        if (second.some((u) => url === u || url === u + '/' || url.startsWith(u + '/'))) {
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
