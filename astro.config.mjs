// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import serviceWorker from './integrations/service-worker/index.mjs';
import vercel from '@astrojs/vercel';

export default defineConfig({
  adapter: vercel(),
  build: { format: 'directory' },
  server: {
    allowedHosts: ['prepituitary-chasidy-phonesthemic.ngrok-free.dev'],
  },
  devToolbar: { enabled: false },
  fonts: [{
    provider: fontProviders.google(),
    name: 'IBM Plex Sans',
    cssVariable: '--font-plex',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    subsets: ['latin'],
    fallbacks: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  }],
  integrations: [serviceWorker()],
});
