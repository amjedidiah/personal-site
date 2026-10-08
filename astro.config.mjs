// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import serviceWorker from './integrations/service-worker/index.mjs';

export default defineConfig({
  build: { format: 'directory' },
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
