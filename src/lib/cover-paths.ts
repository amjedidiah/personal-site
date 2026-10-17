import type { Locale } from '../i18n/config';

// Where the generated blog covers live (built by src/pages/covers/[...file].ts).
// Thumbnails exist for every listed post; social cards only for on-site posts.
export const THUMBNAIL_WIDTHS = [480, 960] as const;
export const THUMBNAIL_RATIO = '1200 / 630';

export function coverThumbnail(locale: Locale, slug: string) {
  const [small, large] = THUMBNAIL_WIDTHS.map((width) => `/covers/${locale}/${slug}-${width}.webp`);
  return { src: small, srcset: `${small} 480w, ${large} 960w`, width: 480, height: 252 };
}

export const coverSocialCard = (locale: Locale, slug: string) => `/covers/${locale}/${slug}.png`;
