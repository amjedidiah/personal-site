import type { Locale } from '../i18n/config';

// Curated current work and offers; availability is a fallback for the GitHub feed.
// Review monthly and when the work or services offered change, in both languages.
export const current = {
  reviewedAt: '2026-10-17',
  availability: 'Open to project conversations',
  availabilityDetail: 'Websites, mobile apps, payments and AI features.',
  appReview: 'I also polish AI-generated apps, test critical flows, and address security issues before launch.',
  work: {
    name: 'Gwela',
    href: '/projects/gwela',
    description: 'a shared AI session product',
    research: 'application security through HackerOne bug bounty programs',
  },
};

// Machine-drafted French awaiting review.
const currentFr: typeof current = {
  ...current,
  availability: 'Ouvert aux discussions de projet',
  availabilityDetail: 'Sites web, applications mobiles, paiements et fonctionnalités d’IA.',
  appReview: 'Je peaufine aussi les applications générées par IA, je teste les parcours critiques et je corrige les failles de sécurité avant le lancement.',
  work: {
    ...current.work,
    href: '/fr/projects/gwela',
    description: 'un produit de session IA partagée',
    research: 'la sécurité applicative via les programmes de bug bounty de HackerOne',
  },
};

export function getCurrent(locale: Locale): typeof current {
  return locale === 'fr' ? currentFr : current;
}
