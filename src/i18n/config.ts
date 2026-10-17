// Locales mirror `i18n` in astro.config.mjs. English is served at the root and
// every other locale under its own prefix (/fr/...).
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = { en: 'English', fr: 'Français' };
/** BCP 47 tags for Intl formatting; British English matches the existing copy. */
export const intlLocale: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR' };
export const ogLocale: Record<Locale, string> = { en: 'en_GB', fr: 'fr_FR' };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function toLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

const prefixPattern = new RegExp(`^/(${locales.filter((locale) => locale !== defaultLocale).join('|')})(?=[/?#]|$)`);

/** The locale a pathname belongs to: `/fr/projects` → `fr`, `/projects` → `en`. */
export function localeFromPath(pathname: string): Locale {
  return toLocale(pathname.match(prefixPattern)?.[1]);
}

/** Drops a locale prefix: `/fr/projects/gwela` → `/projects/gwela`, `/fr` → `/`. */
export function stripLocale(path: string): string {
  const stripped = path.replace(prefixPattern, '');
  if (!stripped) return '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}

/**
 * Prefixes an unprefixed site path for a locale, leaving English paths as they
 * are: `localePath('fr', '/about#contact')` → `/fr/about#contact`.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = stripLocale(path);
  if (locale === defaultLocale) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}
