import type { Locale } from '../i18n/config';

// "What I build" on the home page: what a client or recruiter can hire for, in
// plain words, each backed by work on this site. Every claim needs a project,
// article or record behind it (see PRODUCT.md). French is a machine draft.
export type Capability = {
  id: 'web' | 'mobile' | 'payments' | 'ai';
  icon: 'monitor-smartphone' | 'smartphone' | 'credit-card' | 'sparkles';
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  /** Site paths (locale-free) to the work that proves it. */
  proof: { path: string; label: Record<Locale, string> }[];
};

export const capabilities: Capability[] = [
  {
    id: 'web',
    icon: 'monitor-smartphone',
    title: { en: 'Websites & web apps', fr: 'Sites et applications web' },
    summary: {
      en: 'Fast, accessible websites and web apps, from public sites with search and several languages to dashboards people use every day.',
      fr: 'Des sites et applications web rapides et accessibles, du site public multilingue avec recherche au tableau de bord utilisé au quotidien.',
    },
    proof: [
      { path: '/projects/free-tribe-network', label: { en: 'Free Tribe Network', fr: 'Free Tribe Network' } },
      { path: '/projects/stone-watch-party', label: { en: 'Stone Watch Party', fr: 'Stone Watch Party' } },
      { path: '/projects/crm-praise-centre', label: { en: 'CRM Praise Centre', fr: 'CRM Praise Centre' } },
    ],
  },
  {
    id: 'mobile',
    icon: 'smartphone',
    title: { en: 'Mobile apps', fr: 'Applications mobiles' },
    summary: {
      en: 'iPhone and Android apps built with React Native and published to the app stores, plus web apps people can install on their phones.',
      fr: 'Des applications iPhone et Android conçues avec React Native et publiées sur les stores, ainsi que des applications web installables sur téléphone.',
    },
    proof: [
      { path: '/projects/cocktail-book-club', label: { en: 'Cocktail & Book Club', fr: 'Cocktail & Book Club' } },
      { path: '/projects/ajoflow', label: { en: 'AjoFlow', fr: 'AjoFlow' } },
    ],
  },
  {
    id: 'payments',
    icon: 'credit-card',
    title: { en: 'Payments', fr: 'Paiements' },
    summary: {
      en: 'Online payments with Stripe, Paystack and mobile money, including platforms that split each payment and pay out to many sellers.',
      fr: 'Des paiements en ligne avec Stripe, Paystack et le mobile money, y compris des plateformes qui répartissent chaque paiement et reversent les fonds à de nombreux vendeurs.',
    },
    proof: [
      { path: '/blog/stripe-connect-contractor-platform-architecture', label: { en: 'Stripe platform for 100+ contractors', fr: 'Plateforme Stripe pour plus de 100 prestataires' } },
      { path: '/projects/ajoflow', label: { en: 'AjoFlow', fr: 'AjoFlow' } },
    ],
  },
  {
    id: 'ai',
    icon: 'sparkles',
    title: { en: 'AI features', fr: 'Fonctionnalités d’IA' },
    summary: {
      en: 'AI built into real products: assistants that answer questions, agents that carry out tasks, and scoring that helps people decide.',
      fr: 'De l’IA intégrée à de vrais produits : des assistants qui répondent aux questions, des agents qui exécutent des tâches et des scores qui aident à décider.',
    },
    proof: [
      { path: '/projects/gwela', label: { en: 'Gwela', fr: 'Gwela' } },
      { path: '/projects/ajoflow', label: { en: 'AjoFlow', fr: 'AjoFlow' } },
      { path: '/projects/resume-tailor', label: { en: 'Resume Tailor', fr: 'Resume Tailor' } },
    ],
  },
];
