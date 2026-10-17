// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import cspInlineHashes from './integrations/csp-hashes/index.mjs';
import serviceWorker from './integrations/service-worker/index.mjs';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// The public origin behind canonical URLs, hreflang, the sitemap and share
// links. Set PUBLIC_SITE_URL (e.g. https://amjedidiah.com) once the custom
// domain is live; until then the Vercel production address stands in.
const site = process.env.PUBLIC_SITE_URL || 'https://amjedidiah.vercel.app';

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
  // github-dark-default keeps comments at AA contrast (github-dark's are 3:1).
  markdown: { shikiConfig: { theme: 'github-dark-default' } },
  // Content Security Policy, emitted as a <meta> on every page with a hash for
  // each inline script and style. The site loads nothing from other origins
  // except the GitHub API (availability status). Inline style *attributes*
  // (Shiki code blocks, a few layout values) are allowed through style-src-attr
  // only, so <style> elements still need a hash. frame-ancestors can't be set
  // from a <meta>; vercel.json sends it as a header with the other headers.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://api.github.com",
        // data: for the blurred placeholders shown while project images load.
        "img-src 'self' data:",
        "font-src 'self'",
        "media-src 'self'",
        "manifest-src 'self'",
        "worker-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },
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
    // Before serviceWorker(), which versions the precache from the final HTML.
    cspInlineHashes(),
    serviceWorker(),
    sitemap({
      filter: (page) => !unlisted.test(new URL(page).pathname),
      i18n: { defaultLocale: 'en', locales: { en: 'en', fr: 'fr' } },
    }),
  ],
});
