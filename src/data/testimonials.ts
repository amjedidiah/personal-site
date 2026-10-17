import type { Locale } from '../i18n/config';

// Public LinkedIn recommendations, quoted verbatim. Excerpts are cut only at
// sentence boundaries; " … " marks skipped sentences. Don't edit wording or fix
// typos inside a quote. Translations are shown as translations ("Traduit de
// l’anglais") with the original one click away, never in place of it.
// French translations are machine drafts awaiting native review.
// Titles are the recommenders' LinkedIn headlines.
export const linkedInRecommendationsUrl = 'https://www.linkedin.com/in/am-jedidiah/details/recommendations/';

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  relationship: 'client' | 'manager' | 'colleague';
  /** Year the recommendation was written. */
  year: number;
  /** The recommender's own words, in English. */
  quote: string;
  /** Translations of `quote` for other locales. */
  translations: Partial<Record<Locale, string>>;
  /** Case study the recommendation is about, if any. */
  projectId?: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 'arviset',
    name: 'Matthieu (Mateo) Arviset',
    role: 'CPO, COO & Partner at OWQLO',
    relationship: 'client',
    year: 2024,
    quote: "I wholeheartedly endorse Jedidiah as a top-tier Stripe expert. They were instrumental in resolving a complex issue with our payment processing system that was causing significant revenue loss. Their in-depth knowledge of Stripe's platform, combined with their exceptional problem-solving skills, quickly identified and resolved the problem.",
    translations: {
      fr: 'Je recommande sans réserve Jedidiah, un expert Stripe de premier plan. Il a joué un rôle déterminant dans la résolution d’un problème complexe de notre système de traitement des paiements, qui nous faisait perdre un chiffre d’affaires important. Sa connaissance approfondie de la plateforme Stripe, alliée à d’excellentes capacités de résolution de problèmes, lui a permis d’identifier et de corriger rapidement le problème.',
    },
  },
  {
    id: 'nwaneri',
    name: 'Chizo Nwaneri',
    role: 'Senior Pastor, CRM Praise Center',
    relationship: 'client',
    year: 2026,
    quote: 'He took the time to understand our vision and translated it into a functional, visually appealing, and highly responsive website that truly represents our ministry. … I confidently recommend Jedidiah to anyone looking for a reliable, innovative, and highly competent web developer.',
    translations: {
      fr: 'Il a pris le temps de comprendre notre vision et l’a traduite en un site fonctionnel, attrayant et parfaitement responsive, qui représente fidèlement notre ministère. … Je recommande en toute confiance Jedidiah à quiconque recherche un développeur web fiable, innovant et hautement compétent.',
    },
    projectId: 'crm-praise-centre',
  },
  {
    id: 'oluwagbemi-jacob',
    name: 'Tosin Oluwagbemi-jacob',
    role: 'Founder, Free Tribe Network',
    relationship: 'client',
    year: 2024,
    quote: 'When he managed the development and build of the Free Tribe Network website— Jedi showed exceptional organizational skills, diligence, and technical expertise. I love the way he would navigate even the most complex of issues like he had rehearsed for it.',
    translations: {
      fr: 'Lorsqu’il a piloté le développement et la construction du site de Free Tribe Network, Jedi a fait preuve d’un sens de l’organisation, d’une rigueur et d’une expertise technique exceptionnels. J’aimais sa façon d’aborder même les problèmes les plus complexes, comme s’il s’y était préparé à l’avance.',
    },
    projectId: 'free-tribe-network',
  },
  {
    id: 'ahmad',
    name: 'Faizan Ahmad',
    role: 'Software Engineer at Amazon',
    relationship: 'manager',
    year: 2023,
    quote: 'He is a dedicated engineer with a knack for trying new technologies. … In addition to his technical skills, I admire his ability to meet tight deadlines along with his soft skills.',
    translations: {
      fr: 'C’est un ingénieur investi, doué pour essayer de nouvelles technologies. … Au-delà de ses compétences techniques, j’admire sa capacité à tenir des délais serrés, ainsi que ses qualités humaines.',
    },
  },
  {
    id: 'akinwale',
    name: 'Temitayo Akinwale',
    role: 'Head of Operations',
    relationship: 'colleague',
    year: 2023,
    quote: 'He was an instructor with us and I must say that he is awesome at programming. His students took weeks to adjust to his absence as he was a very patient and respectful instructor.',
    translations: {
      fr: 'Il était formateur chez nous, et je dois dire qu’il est excellent en programmation. Ses étudiants ont mis des semaines à s’habituer à son départ, tant il était patient et respectueux.',
    },
  },
  {
    id: 'agina-obu',
    name: 'Boma Agina-Obu',
    role: 'Product Designer',
    relationship: 'manager',
    year: 2026,
    quote: 'He wasn’t waiting to be told what to do; he just stepped in and made things easier for everyone. He’s easy to work with, takes responsibility seriously, and genuinely adds value to the team.',
    translations: {
      fr: 'Il n’attendait pas qu’on lui dise quoi faire\u00a0; il intervenait de lui-même et facilitait la tâche de tout le monde. Il est facile à vivre au travail, prend ses responsabilités au sérieux et apporte une vraie valeur à l’équipe.',
    },
  },
];

export const clientTestimonials = testimonials.filter((testimonial) => testimonial.relationship === 'client');
