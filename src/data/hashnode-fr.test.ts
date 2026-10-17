import { describe, expect, test } from 'bun:test';
import { hashnodePosts } from './hashnode';
import { getHashnodePosts, hashnodeTranslationSlugs } from './hashnode-fr';

describe('French Hashnode listing', () => {
  test('every translation matches a real post, so a renamed slug is caught', () => {
    const slugs = new Set(hashnodePosts.map((post) => post.slug));
    expect(hashnodeTranslationSlugs.filter((slug) => !slugs.has(slug))).toEqual([]);
  });

  test('translates every current post and keeps links and dates', () => {
    const french = getHashnodePosts('fr');
    expect(french.filter((post) => post.lang)).toEqual([]);
    expect(french.map((post) => [post.url, post.date])).toEqual(hashnodePosts.map((post) => [post.url, post.date]));
  });

  test('leaves English untouched', () => {
    expect(getHashnodePosts('en')).toBe(hashnodePosts);
  });
});
