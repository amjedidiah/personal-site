import { current, getCurrent } from '../data/current';
import type { Locale } from '../i18n/config';

export const currentIssueUrls = {
  availability: 'https://api.github.com/repos/amjedidiah/personal-site/issues/1',
  latest: 'https://api.github.com/repos/amjedidiah/personal-site/issues/2',
} as const;

type Issue = {
  state?: unknown;
  title?: unknown;
  body?: unknown;
  updated_at?: unknown;
};

function asIssue(value: unknown): Issue | null {
  return value !== null && typeof value === 'object' ? value as Issue : null;
}

function firstParagraph(value: unknown): string {
  return typeof value === 'string' ? value.split(/\n\s*\n/, 1)[0].trim() : '';
}

// French is a machine draft awaiting review.
const availabilityCopy = {
  en: { open: 'Open to project conversations', closed: 'Not taking new projects', closedDetail: 'You can still get in touch about future work.' },
  fr: { open: 'Ouvert aux discussions de projet', closed: 'Pas de nouveaux projets pour le moment', closedDetail: 'Vous pouvez tout de même me contacter pour de futurs projets.' },
} satisfies Record<Locale, Record<string, string>>;

export function parseAvailabilityIssue(value: unknown, locale: Locale = 'en') {
  const issue = asIssue(value);
  if (issue?.state !== 'open' && issue?.state !== 'closed') return null;

  const available = issue.state === 'open';
  const copy = availabilityCopy[locale];
  // The issue body is written in English, so other locales use the curated detail.
  const openDetail = locale === 'en' ? firstParagraph(issue.body) || current.availabilityDetail : getCurrent(locale).availabilityDetail;
  return {
    available,
    label: available ? copy.open : copy.closed,
    detail: available ? openDetail : copy.closedDetail,
  };
}

export function parseLatestIssue(value: unknown) {
  const issue = asIssue(value);
  const title = typeof issue?.title === 'string' ? issue.title.trim() : '';
  const updatedAt = typeof issue?.updated_at === 'string' ? issue.updated_at : '';
  if (!title || !updatedAt || Number.isNaN(Date.parse(updatedAt))) return null;

  return {
    title,
    detail: firstParagraph(issue?.body) || 'No details published yet.',
    updatedAt,
    href: 'https://github.com/amjedidiah/personal-site/issues/2',
  };
}
