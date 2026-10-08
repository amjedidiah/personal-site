import { describe, expect, test } from 'bun:test';
import { toPrecacheEntry } from './index.mjs';

describe('toPrecacheEntry', () => {
  test('maps the home page to the root', () => {
    expect(toPrecacheEntry('index.html')).toEqual({ url: '/', key: '/' });
  });

  test('fetches nested pages by directory URL and keys them without the trailing slash', () => {
    expect(toPrecacheEntry('about/index.html')).toEqual({ url: '/about/', key: '/about' });
    expect(toPrecacheEntry('blog/hello-world/index.html')).toEqual({
      url: '/blog/hello-world/',
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
