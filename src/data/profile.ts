import type { Locale } from '../i18n/config';

// Established positioning. Current work and offers live in current.ts.
export const profile = {
  name: 'Jedidiah Amaraegbu',
  roles: 'full-stack engineer · Stripe-certified developer',
  homeTitle: 'Stripe, Web & Mobile App Developer | Jedidiah Amaraegbu',
  description: 'Stripe-certified full-stack developer for web and mobile apps, Stripe Connect platforms and payment integrations. Lagos-based, working remotely worldwide.',
  coreStack: ['TypeScript', 'React.js', 'Node.js'],
  introduction: 'I’m a full-stack engineer and Stripe-certified developer based in Lagos, Nigeria. I empower individuals and businesses with quality websites, mobile apps, payment systems and AI features, mostly with TypeScript, React, Node.js and Python.',
  delivery: 'I empower individuals and businesses with quality websites, mobile apps, payment systems and AI features, to improve user interactions and business processes.',
  yearsExperience: 6,
  /** The CV lives in Google Docs; this exports the current version as a PDF. */
  cvUrl: 'https://docs.google.com/document/d/1_6ohHcb4bY9K7168NzdT5_nF9qKQSTtr70kRpAQrN6o/export?format=pdf',
  developersMentored: 200,
};

type ProfileCopy = Pick<typeof profile, 'roles' | 'homeTitle' | 'description' | 'introduction' | 'delivery'>;

// Machine-drafted French awaiting review. Update alongside the English above.
const profileFr: ProfileCopy = {
  roles: 'ingénieur full-stack · développeur certifié Stripe',
  homeTitle: 'Développeur Stripe, web et mobile | Jedidiah Amaraegbu',
  description: 'Développeur full-stack certifié Stripe\u00a0: applications web et mobiles, plateformes Stripe Connect et intégrations de paiement. Basé à Lagos, en télétravail.',
  introduction: 'Je suis ingénieur full-stack et développeur certifié Stripe, basé à Lagos, au Nigeria. Je conçois des sites web, des applications mobiles, des systèmes de paiement et des fonctionnalités d’IA pour des startups et des entreprises en croissance, principalement avec TypeScript, React et Node.js.',
  delivery: 'Je conçois des sites web, des applications mobiles, des systèmes de paiement et des fonctionnalités d’IA pour des startups et des entreprises en croissance, de la première version jusqu’au produit sur lequel on compte.',
};

export function getProfile(locale: Locale): typeof profile {
  return locale === 'fr' ? { ...profile, ...profileFr } : profile;
}
