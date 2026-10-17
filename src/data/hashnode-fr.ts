import type { Locale } from '../i18n/config';
import { hashnodePosts, type HashnodePost } from './hashnode';

// French titles and summaries for the Hashnode archive, keyed by slug. Kept apart
// from hashnode.ts because scripts/scrape-hashnode.mjs rewrites that file. The
// articles themselves stay in English on Hashnode; listings say so.
// Machine-drafted French awaiting native review.
const hashnodeFr: Record<string, { title: string; brief: string }> = {
  'stacked-pull-requests-github-guide': {
    title: 'Le zen des PR empilées\u00a0: arrêter de livrer des «\u00a0murs de code\u00a0»',
    brief: 'Découpez les grosses pull requests en PR empilées, plus petites et plus faciles à gérer, pour améliorer la qualité des revues de code.',
  },
  'systematizing-intuition-coding-seniority': {
    title: 'Systématiser l’intuition\u00a0: comment coder la «\u00a0séniorité\u00a0» dans une IA',
    brief: 'Contrôles de risque, validation aux frontières et règles de revue pour guider le développement assisté par IA.',
  },
  'ai-coding-teacher-mindset': {
    title: 'Maîtriser le code avec l’IA\u00a0: le modèle mental du «\u00a0développeur junior\u00a0»',
    brief: 'Pourquoi les ingénieurs vivent des expériences si différentes avec les outils de code IA, et un cadre de mentorat pour les rendre plus efficaces.',
  },
  'advanced-ssh-guide': {
    title: 'Le guide complet de SSH\u00a0: sujets avancés',
    brief: 'Exploration approfondie des fonctionnalités avancées de SSH\u00a0: tunnels, configuration, clés et transfert d’agent.',
  },
  'beginners-guide-to-ssh': {
    title: 'Guide de SSH pour débutants',
    brief: 'Les bases de SSH pour accéder à un serveur distant, déployer du code et gérer des instances cloud.',
  },
  'senior-engineer-3-step-recovery-plan-rebuild-trust': {
    title: 'Vous avez laissé tomber la balle\u00a0? Le plan de rattrapage en 3\u00a0étapes de l’ingénieur senior pour regagner la confiance',
    brief: 'La façon dont vous gérez une échéance manquée définit votre séniorité davantage que l’erreur elle-même.',
  },
  'understanding-web3-blockchain-complete-beginner-guide-2025': {
    title: 'L’aube d’un nouvel Internet\u00a0: comprendre le monde du Web3 et de la blockchain',
    brief: 'Tutoriel complet pour débuter avec le Web3 et la blockchain.',
  },
  'self-host-wordpress-docker-fly-io': {
    title: 'Hébergement WordPress gratuit\u00a0: guide pas à pas pour déployer avec Docker et Fly.io',
    brief: 'Un tutoriel de 2025 pour déployer WordPress avec Docker et Fly.io. Vérifiez les offres d’hébergement actuelles avant de le suivre.',
  },
  'guide-to-bulletproof-react-components': {
    title: 'Le zen de React\u00a0: guide pratique pour des composants à toute épreuve',
    brief: 'Un guide engagé sur l’architecture, le développement piloté par les tests et des hooks performants.',
  },
  'postgres-swiss-army-knife': {
    title: 'Postgres, bien plus qu’une base de données\u00a0: un couteau suisse pour le développement moderne',
    brief: 'Exploiter tout le potentiel de PostgreSQL, du stockage de données au véritable outil de développement.',
  },
  'spice-up-your-debugging-the-hidden-art-of-styled-console-logs': {
    title: 'Pimentez votre débogage\u00a0: l’art méconnu des logs de console stylisés',
    brief: 'Faites passer votre console du monochrome au magnifique.',
  },
  'stripe-connect-contractor-platform-architecture': {
    title: 'Comment j’ai conçu une plateforme Stripe Connect pour plus de 100\u00a0prestataires du secteur public',
    brief: 'L’architecture Stripe Connect d’une plateforme au service de plus d’une centaine de prestataires du secteur public.',
  },
  'why-obs-is-the-ultimate-choice-for-livestreaming': {
    title: 'Pourquoi OBS est le meilleur choix pour le livestream',
    brief: 'Pourquoi OBS Studio surpasse les outils propres aux plateformes en matière de personnalisation, de contrôle et de portée.',
  },
  'react-state-management-useref-usestate': {
    title: 'La gestion d’état dans React\u00a0: explorer useRef et useState',
    brief: 'Différences, points communs et usage combiné de useRef et useState.',
  },
  'understanding-state-management-in-react-usestate-context-api-usereducer-and-redux': {
    title: 'Comprendre la gestion d’état dans React\u00a0: useState, Context API, useReducer et Redux',
    brief: 'Le guide visuel\u00a0: useState, Context API, useReducer et Redux.',
  },
  'redux-saga-vs-redux-promise-middleware-comparison': {
    title: 'Choisir entre redux-saga et redux-promise-middleware dans Redux\u00a0: guide pour débutants',
    brief: 'Démystifier l’asynchrone dans Redux\u00a0: redux-saga face à redux-promise-middleware.',
  },
  'mentorship-software-engineering-career-benefits': {
    title: 'Le pouvoir du mentorat\u00a0: accélérer votre carrière d’ingénieur logiciel',
    brief: 'Les avantages d’avoir un mentor quand on est ingénieur logiciel.',
  },
  'technical-interviews-guides': {
    title: 'Guide complet pour résoudre les problèmes en entretien technique comme un pro',
    brief: 'Maîtriser l’art de la résolution de problèmes en entretien de code.',
  },
  'reusable-functions': {
    title: 'Comprendre les fonctions réutilisables\u00a0: guide pratique avec exemples de code',
    brief: 'Gagner en efficacité et en qualité de code grâce aux fonctions réutilisables en JavaScript.',
  },
  'an-overview-of-middlewares': {
    title: 'Tour d’horizon des middlewares',
    brief: 'Comprendre les patterns de middleware en développement web.',
  },
  'server-side-redirecting-in-nextjs': {
    title: 'Les redirections côté serveur dans Next.js',
    brief: 'Gérer les redirections côté serveur dans une application Next.js.',
  },
  '8-must-take-courses-to-become-a-complete-react-developer-in-2023': {
    title: '8\u00a0cours indispensables pour devenir un développeur React complet en 2023',
    brief: 'Un parcours d’apprentissage choisi pour les développeurs React.',
  },
  'semantic-markup': {
    title: 'Le balisage sémantique',
    brief: 'L’importance et la pratique du HTML sémantique.',
  },
};

export type LocalizedHashnodePost = HashnodePost & {
  /** Set to the text's language when it differs from the page (an untranslated post). */
  lang?: string;
};

/**
 * Hashnode posts with titles and summaries in the requested locale. A post
 * published after the last translation pass keeps its English text, marked
 * with `lang` so it is still announced correctly.
 */
export function getHashnodePosts(locale: Locale): LocalizedHashnodePost[] {
  if (locale === 'en') return hashnodePosts;
  return hashnodePosts.map((post) => {
    const translation = hashnodeFr[post.slug];
    return translation ? { ...post, ...translation } : { ...post, lang: 'en' };
  });
}

export const hashnodeTranslationSlugs = Object.keys(hashnodeFr);
