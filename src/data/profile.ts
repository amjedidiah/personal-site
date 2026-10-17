import type { Locale } from '../i18n/config';

// Established positioning. Current work and offers live in current.ts.
export const profile = {
  name: 'Jedidiah Amaraegbu',
  roles: 'full-stack engineer · Stripe Implementation Architect',
  homeTitle: 'Jedidiah Amaraegbu | Full-stack Engineer & Stripe Architect',
  description: 'Full-stack engineer and Stripe-certified developer in Lagos, Nigeria. TypeScript, React, Node.js and AI-native workflows for apps and payments.',
  coreStack: ['TypeScript', 'React.js', 'Node.js'],
  introduction: 'I’m a full-stack engineer and Stripe-certified developer based in Lagos, Nigeria. I build applications and payment integrations with TypeScript, React and Node.js, using Cursor and Claude Code throughout my development workflow.',
  delivery: 'I build apps and payment integrations with TypeScript, React and Node.js, using Cursor and Claude Code throughout development.',
  yearsExperience: 6,
  developersMentored: 200,
};

type ProfileCopy = Pick<typeof profile, 'roles' | 'homeTitle' | 'description' | 'introduction' | 'delivery'>;

// Machine-drafted French awaiting review. Update alongside the English above.
const profileFr: ProfileCopy = {
  roles: 'ingénieur full-stack · Stripe Implementation Architect',
  homeTitle: 'Jedidiah Amaraegbu | Ingénieur full-stack et architecte Stripe',
  description: 'Ingénieur full-stack et développeur certifié Stripe à Lagos, au Nigeria. TypeScript, React, Node.js et workflows natifs IA pour vos applications et vos paiements.',
  introduction: 'Je suis ingénieur full-stack et développeur certifié Stripe, basé à Lagos, au Nigeria. Je conçois des applications et des intégrations de paiement avec TypeScript, React et Node.js, en utilisant Cursor et Claude Code tout au long de mon workflow de développement.',
  delivery: 'Je conçois des applications et des intégrations de paiement avec TypeScript, React et Node.js, en utilisant Cursor et Claude Code tout au long du développement.',
};

export function getProfile(locale: Locale): typeof profile {
  return locale === 'fr' ? { ...profile, ...profileFr } : profile;
}
