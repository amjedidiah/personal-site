import { describe, expect, it } from 'bun:test';
import type { CollectionEntry } from 'astro:content';
import type { HashnodePost } from '../src/data/hashnode';
import { pickHomeFeaturedArticles } from '../src/lib/home-featured-articles';

const local = (id: string, date: string, featured?: boolean): CollectionEntry<'blog'> => ({
  id,
  collection: 'blog',
  data: {
    title: id,
    date: new Date(`${date}T00:00:00Z`),
    featured,
  },
  body: '',
});

const hashnode = (slug: string, date: string, featured?: boolean): HashnodePost => ({
  title: slug,
  slug,
  url: `https://example.com/${slug}`,
  brief: 'brief',
  date,
  tags: ['ai'],
  featured,
});

describe('pickHomeFeaturedArticles', () => {
  it('prefers featured entries then fills by date', () => {
    const articles = pickHomeFeaturedArticles(
      [
        local('older', '2026-01-01'),
        local('featured-local', '2026-05-01', true),
      ],
      [hashnode('featured-remote', '2026-03-01', true)],
      2,
    );
    expect(articles.map((a) => a.href)).toEqual([
      '/blog/featured-local',
      'https://example.com/featured-remote',
    ]);
  });

  it('backfills when fewer than limit are featured', () => {
    const articles = pickHomeFeaturedArticles(
      [local('only', '2026-10-01', true)],
      [hashnode('newest', '2026-09-01'), hashnode('older', '2026-01-01')],
      2,
    );
    expect(articles).toHaveLength(2);
    expect(articles[0].href).toBe('/blog/only');
    expect(articles[1].href).toBe('https://example.com/newest');
  });
});
