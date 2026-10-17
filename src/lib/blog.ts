import { getCollection, type CollectionEntry } from 'astro:content';
import { getHashnodePosts } from '../data/hashnode-fr';
import { localePath, type Locale } from '../i18n/config';

export type LocalizedPost = CollectionEntry<'blog'> & {
  /** The entry whose Markdown body renders for this locale. */
  content: CollectionEntry<'blog'> | CollectionEntry<'blogFr'>;
  /** False when the locale has no translation yet and the English post is shown. */
  translated: boolean;
};

/** On-site posts with title, description and body in the requested locale (English fallback). */
export async function getPosts(locale: Locale): Promise<LocalizedPost[]> {
  const posts = await getCollection('blog');
  if (locale === 'en') return posts.map((post) => ({ ...post, content: post, translated: true }));

  const translations = new Map((await getCollection('blogFr')).map((entry) => [entry.id, entry]));
  return posts.map((post) => {
    const translation = translations.get(post.id);
    if (!translation) return { ...post, content: post, translated: false };
    const { reviewed: _reviewed, ...fields } = translation.data;
    const defined = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
    return { ...post, data: { ...post.data, ...defined }, content: translation, translated: true };
  });
}

export type ArchiveLink = {
  id: string;
  title: string;
  date: Date;
  href: string;
  external: boolean;
  /** Language of the title when it differs from the page. */
  lang?: string;
};

/** Static paths for /blog/[id] in one locale, with older/newer links across the whole archive. */
export async function getBlogPaths(locale: Locale) {
  const posts = await getPosts(locale);
  const archive: ArchiveLink[] = [
    ...posts.map((post) => ({
      id: post.id,
      title: post.data.title,
      date: post.data.date,
      href: localePath(locale, `/blog/${post.id}`),
      external: false,
      lang: post.translated ? undefined : 'en',
    })),
    ...getHashnodePosts(locale).map((post) => ({
      id: post.slug,
      title: post.title,
      date: new Date(post.date),
      href: post.url,
      external: true,
      lang: post.lang,
    })),
  ].sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return posts.map((post) => {
    const archiveIndex = archive.findIndex((item) => item.id === post.id && !item.external);
    const tags = post.data.tags ?? [];
    return {
      params: { id: post.id },
      props: {
        post,
        previous: archive[archiveIndex + 1] ?? null,
        next: archive[archiveIndex - 1] ?? null,
        related: posts
          .filter((candidate) => candidate.id !== post.id)
          .sort((a, b) => {
            const sharedA = (a.data.tags ?? []).filter((tag) => tags.includes(tag)).length;
            const sharedB = (b.data.tags ?? []).filter((tag) => tags.includes(tag)).length;
            return sharedB - sharedA || b.data.date.valueOf() - a.data.date.valueOf();
          })
          .slice(0, 2),
      },
    };
  });
}
