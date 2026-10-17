import { describe, expect, test } from 'bun:test';
import { isPrecacheable, toPrecacheEntry } from './index.mjs';

describe('isPrecacheable', () => {
  test('precaches pages, scripts, styles, fonts and icons', () => {
    for (const file of ['index.html', '_astro/Base.css', '_astro/motion.js', '_astro/fonts/a.woff2', 'icon-face-192.png', 'brands/google.svg', 'manifest.json']) {
      expect(isPrecacheable(file)).toBe(true);
    }
  });

  test('precaches English pages and the French offline page only', () => {
    expect(isPrecacheable('fr/offline/index.html')).toBe(true);
    expect(isPrecacheable('fr/index.html')).toBe(false);
    expect(isPrecacheable('fr/projects/gwela/index.html')).toBe(false);
    expect(isPrecacheable('free-tribe/index.html')).toBe(true);
  });

  test('leaves photos to the runtime image cache', () => {
    for (const file of ['hero-portrait.webp', '_astro/me.CIwkFSJR_116WBv.webp', 'photo.JPG']) {
      expect(isPrecacheable(file)).toBe(false);
    }
  });

  test('skips the worker, 404 page, social card, dotfiles and source maps', () => {
    for (const file of ['sw.js', '404.html', 'og.png', 'robots.txt', 'llms.txt', '.DS_Store', '_astro/motion.js.map']) {
      expect(isPrecacheable(file)).toBe(false);
    }
  });
});

describe('toPrecacheEntry', () => {
  test('maps the home page to the root', () => {
    expect(toPrecacheEntry('index.html')).toEqual({ url: '/', key: '/' });
  });

  test('fetches and keys nested pages by their canonical slash-free URL', () => {
    expect(toPrecacheEntry('about/index.html')).toEqual({ url: '/about', key: '/about' });
    expect(toPrecacheEntry('blog/hello-world/index.html')).toEqual({
      url: '/blog/hello-world',
      key: '/blog/hello-world',
    });
  });

  test('keeps asset paths as-is', () => {
    expect(toPrecacheEntry('_astro/three.module.js')).toEqual({
      url: '/_astro/three.module.js',
      key: '/_astro/three.module.js',
    });
  });
});
