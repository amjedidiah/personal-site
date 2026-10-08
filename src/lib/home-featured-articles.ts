import type { CollectionEntry } from 'astro:content';
import type { HashnodePost } from '../data/hashnode';

export type HomeFeaturedArticle = {
  title: string;
  description?: string;
  date: Date;
  href: string;
  external: boolean;
  focus?: string;
};

const toLocal = (post: CollectionEntry<'blog'>): HomeFeaturedArticle => ({
  title: post.data.title,
  description: post.data.description,
  date: post.data.date,
  href: `/blog/${post.id}`,
  external: false,
  focus: post.data.tags?.[0],
});

const toHashnode = (post: HashnodePost): HomeFeaturedArticle => ({
  title: post.title,
  description: post.brief,
  date: new Date(`${post.date}T00:00:00Z`),
  href: post.url,
  external: true,
  focus: post.tags[0],
});

/** Always surface on the homepage when the post exists (id = filename). */
const HOME_PINNED_LOCAL_BLOG_IDS = ['hello-world'] as const;

/** Up to `limit` articles: pinned local → explicit `featured` → newest backfill. */
export function pickHomeFeaturedArticles(
  localPosts: CollectionEntry<'blog'>[],
  hashnodePosts: HashnodePost[],
  limit = 2,
): HomeFeaturedArticle[] {
  const seen = new Set<string>();
  const out: HomeFeaturedArticle[] = [];

  for (const id of HOME_PINNED_LOCAL_BLOG_IDS) {
    if (out.length >= limit) break;
    const post = localPosts.find((p) => p.id === id);
    if (!post) continue;
    const article = toLocal(post);
    seen.add(article.href);
    out.push(article);
  }

  const featured: HomeFeaturedArticle[] = [
    ...localPosts.filter((p) => p.data.featured).map(toLocal),
    ...hashnodePosts.filter((p) => p.featured).map(toHashnode),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

  for (const article of featured) {
    if (seen.has(article.href) || out.length >= limit) continue;
    seen.add(article.href);
    out.push(article);
  }

  if (out.length >= limit) return out;

  const backfill = [
    ...localPosts.map(toLocal),
    ...hashnodePosts.map(toHashnode),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

  for (const article of backfill) {
    if (seen.has(article.href) || out.length >= limit) continue;
    seen.add(article.href);
    out.push(article);
  }

  return out;
}
