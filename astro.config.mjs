// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import serviceWorker from './integrations/service-worker/index.mjs';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// The public origin behind canonical URLs, hreflang, the sitemap and share
// links. Set PUBLIC_SITE_URL (e.g. https://amjedidiah.com) once the custom
// domain is live; until then the Vercel production address stands in.
const site = process.env.PUBLIC_SITE_URL || 'https://personal-site-flame-theta.vercel.app';

// Private or utility pages: kept out of the sitemap (they're also noindex).
const unlisted = /\/(feedback|offline)(\/|$)/;

export default defineConfig({
  site,
  adapter: vercel(),
  build: { format: 'directory' },
  // One URL per page: internal links never end in a slash, and the host
  // redirects /about/ to /about so search engines don't see duplicates.
  trailingSlash: 'never',
  server: {
    allowedHosts: ['prepituitary-chasidy-phonesthemic.ngrok-free.dev'],
  },
  devToolbar: { enabled: false },
  // English stays at the root; French lives under /fr/. Keep in sync with src/i18n/config.ts.
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  fonts: [{
    provider: fontProviders.google(),
    name: 'IBM Plex Sans',
    cssVariable: '--font-plex',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    subsets: ['latin'],
    fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  }],
  integrations: [
    serviceWorker(),
    sitemap({
      filter: (page) => !unlisted.test(new URL(page).pathname),
      i18n: { defaultLocale: 'en', locales: { en: 'en', fr: 'fr' } },
    }),
  ],
});
