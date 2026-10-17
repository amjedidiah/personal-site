import type { Locale } from '../i18n/config';

const monthLabels: Record<Locale, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
};

// Calendar dates stay strings so formatting cannot shift the commit's day by timezone.
export function formatProjectDate(date: string, locale: Locale = 'en') {
  const [year, month] = date.split('-').map(Number);
  return `${monthLabels[locale][month - 1]} ${year}`;
}
