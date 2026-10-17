import type { Locale } from '../i18n/config';

// Established positioning. Current work and offers live in current.ts.
export const profile = {
  name: 'Jedidiah Amaraegbu',
  roles: 'full-stack engineer · Stripe-certified developer',
  homeTitle: 'Stripe, Web & Mobile App Developer | Jedidiah Amaraegbu',
  description: 'Stripe-certified full-stack developer for web and mobile apps, Stripe Connect platforms and payment integrations. Lagos-based, working remotely worldwide.',
  coreStack: ['TypeScript', 'React.js', 'Node.js'],
  introduction: 'I’m a full-stack engineer and Stripe-certified developer based in Lagos, Nigeria. I build applications and payment integrations with TypeScript, React and Node.js, using Cursor and Claude Code throughout my development workflow.',
  delivery: 'I build apps and payment integrations with TypeScript, React and Node.js, using Cursor and Claude Code throughout development.',
  yearsExperience: 6,
  developersMentored: 200,
};

type ProfileCopy = Pick<typeof profile, 'roles' | 'homeTitle' | 'description' | 'introduction' | 'delivery'>;

// Machine-drafted French awaiting review. Update alongside the English above.
const profileFr: ProfileCopy = {
  roles: 'ingénieur full-stack · développeur certifié Stripe',
  homeTitle: 'Développeur Stripe, web et mobile | Jedidiah Amaraegbu',
  description: 'Développeur full-stack certifié Stripe\u00a0: applications web et mobiles, plateformes Stripe Connect et intégrations de paiement. Basé à Lagos, en télétravail.',
  introduction: 'Je suis ingénieur full-stack et développeur certifié Stripe, basé à Lagos, au Nigeria. Je conçois des applications et des intégrations de paiement avec TypeScript, React et Node.js, en utilisant Cursor et Claude Code tout au long de mon workflow de développement.',
  delivery: 'Je conçois des applications et des intégrations de paiement avec TypeScript, React et Node.js, en utilisant Cursor et Claude Code tout au long du développement.',
};

export function getProfile(locale: Locale): typeof profile {
  return locale === 'fr' ? { ...profile, ...profileFr } : profile;
}
