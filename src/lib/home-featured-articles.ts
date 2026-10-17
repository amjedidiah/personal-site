import type { CollectionEntry } from 'astro:content';
import type { HashnodePost } from '../data/hashnode';

export type HomeFeaturedArticle = {
  /** The post id or Hashnode slug; names its generated cover. */
  slug: string;
  title: string;
  description?: string;
  date: Date;
  href: string;
  external: boolean;
  focus?: string;
  /** Language of the title and description when they're still untranslated. */
  lang?: string;
};

/** Localized posts (see lib/blog.ts) say whether a translation exists. */
type LocalInput = CollectionEntry<'blog'> & { translated?: boolean };
type HashnodeInput = HashnodePost & { lang?: string };

const toLocal = (post: LocalInput): HomeFeaturedArticle => ({
  slug: post.id,
  title: post.data.title,
  description: post.data.description,
  date: post.data.date,
  href: `/blog/${post.id}`,
  external: false,
  focus: post.data.tags?.[0],
  lang: post.translated === false ? 'en' : undefined,
});

const toHashnode = (post: HashnodeInput): HomeFeaturedArticle => ({
  slug: post.slug,
  title: post.title,
  description: post.brief,
  date: new Date(`${post.date}T00:00:00Z`),
  href: post.url,
  external: true,
  focus: post.tags[0],
  lang: post.lang,
});

/** Up to `limit` articles: explicit `featured` → newest backfill. */
export function pickHomeFeaturedArticles(
  localPosts: LocalInput[],
  hashnodePosts: HashnodeInput[],
  limit = 2,
): HomeFeaturedArticle[] {
  const seen = new Set<string>();
  const out: HomeFeaturedArticle[] = [];

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
