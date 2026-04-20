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
      filter: (page) => !page.includes('/shop') && !page.includes('/admin'),
      i18n: {
        defaultLocale: 'ko',
        locales: {
          ko: 'ko',
          en: 'en',
          ja: 'ja',
        },
      },
    }),
  ],
});
