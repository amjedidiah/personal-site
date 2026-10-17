import type { APIRoute, GetStaticPaths } from 'astro';
import { getProfile } from '../../data/profile';
import { locales } from '../../i18n/config';
import { getExternalPosts, getPosts } from '../../lib/blog';
import { THUMBNAIL_WIDTHS } from '../../lib/cover-paths';
import { renderSocialCard, renderThumbnail } from '../../lib/covers';

// Built once per deploy: topic thumbnails for every listed post (on-site and
// Hashnode) and social cards for on-site posts, in each language.
type Props =
  | { kind: 'thumbnail'; locale: (typeof locales)[number]; tags: string[]; width: number }
  | { kind: 'social'; locale: (typeof locales)[number]; tags: string[]; title: string };

export const getStaticPaths = (async () => {
  const paths = [];
  for (const locale of locales) {
    const onSite = await getPosts(locale);
    const listed = [
      ...onSite.map((post) => ({ slug: post.id, tags: post.data.tags ?? [] })),
      ...(await getExternalPosts(locale)).map((post) => ({ slug: post.slug, tags: post.tags })),
    ];
    for (const { slug, tags } of listed) {
      for (const width of THUMBNAIL_WIDTHS) {
        paths.push({ params: { file: `${locale}/${slug}-${width}.webp` }, props: { kind: 'thumbnail', locale, tags, width } });
      }
    }
    for (const post of onSite) {
      paths.push({ params: { file: `${locale}/${post.id}.png` }, props: { kind: 'social', locale, tags: post.data.tags ?? [], title: post.data.title } });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props, site }) => {
  if (props.kind === 'thumbnail') {
    const image = await renderThumbnail(props.tags, props.locale, props.width);
    return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/webp' } });
  }
  const host = site ? new URL(site).host : 'amjedidiah.vercel.app';
  const image = await renderSocialCard(props.tags, props.locale, props.title, getProfile(props.locale).name, host);
  return new Response(new Uint8Array(image), { headers: { 'Content-Type': 'image/png' } });
};
