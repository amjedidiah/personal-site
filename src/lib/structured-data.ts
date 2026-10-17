// schema.org JSON-LD for search engines. Base.astro emits one @graph per page:
// the site and its author on every page, plus whatever the page adds (service,
// profile, case study, article, breadcrumbs). Nodes reference each other by @id.
//
// Only verifiable facts belong here (see PRODUCT.md). No Review or
// AggregateRating: Google treats reviews a business publishes about itself as
// self-serving and ignores or penalises them.
import { getProfile } from '../data/profile';
import { coverSocialCard } from './cover-paths';
import { localePath, type Locale } from '../i18n/config';
import type { LocalizedPost } from './blog';
import type { LocalizedProject } from './projects';

export type JsonLdNode = Record<string, unknown>;

export const SAME_AS = [
  'https://github.com/amjedidiah',
  'https://www.linkedin.com/in/am-jedidiah/',
  'https://twitter.com/am_jedidiah',
  'https://amjedidiah.hashnode.dev',
];

const absolute = (site: URL, path: string) => new URL(path, site).href;
const ids = (site: URL) => ({
  person: absolute(site, '/#person'),
  website: absolute(site, '/#website'),
  service: absolute(site, '/#service'),
});

const copy = {
  en: {
    jobTitle: 'Full-stack engineer',
    serviceName: 'Jedidiah Amaraegbu, Stripe and full-stack development',
    catalog: 'Development services',
    services: [
      'Stripe integration and Stripe Connect platforms',
      'Web application development',
      'Mobile app development with React Native',
      'Review and hardening of AI-generated apps',
    ],
  },
  // Machine-drafted French awaiting review.
  fr: {
    jobTitle: 'Ingénieur full-stack',
    serviceName: 'Jedidiah Amaraegbu, développement Stripe et full-stack',
    catalog: 'Services de développement',
    services: [
      'Intégration Stripe et plateformes Stripe Connect',
      'Développement d’applications web',
      'Développement d’applications mobiles avec React Native',
      'Revue et sécurisation d’applications générées par IA',
    ],
  },
} satisfies Record<Locale, unknown>;

export function websiteNode(site: URL, locale: Locale): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': ids(site).website,
    url: absolute(site, localePath(locale, '/')),
    name: 'Jedidiah Amaraegbu',
    inLanguage: locale,
    publisher: { '@id': ids(site).person },
  };
}

export function personNode(site: URL, locale: Locale): JsonLdNode {
  const profile = getProfile(locale);
  return {
    '@type': 'Person',
    '@id': ids(site).person,
    name: profile.name,
    url: absolute(site, localePath(locale, '/about')),
    image: absolute(site, '/hero-portrait.webp'),
    jobTitle: copy[locale].jobTitle,
    description: profile.description,
    address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Nigeria, Nsukka' },
    // Current credentials only; the about page lists expired ones with their dates.
    hasCredential: [{
      '@type': 'EducationalOccupationalCredential',
      name: 'Stripe Professional Payments Developer',
      credentialCategory: 'certification',
      dateCreated: '2022-11',
      url: 'https://stripecertifications.credential.net/efcd44b0-6e66-4262-89c2-5a513bdec126',
      recognizedBy: { '@type': 'Organization', name: 'Stripe', url: 'https://stripe.com' },
    }],
    knowsAbout: [
      'Stripe', 'Stripe Connect', 'Payment integrations', 'TypeScript', 'React', 'React Native',
      'Next.js', 'Node.js', 'Full-stack web development', 'Mobile app development',
    ],
    sameAs: SAME_AS,
  };
}

export function serviceNode(site: URL, locale: Locale): JsonLdNode {
  const text = copy[locale];
  return {
    '@type': 'ProfessionalService',
    '@id': ids(site).service,
    name: text.serviceName,
    url: absolute(site, localePath(locale, '/')),
    image: absolute(site, '/og.png'),
    description: getProfile(locale).description,
    founder: { '@id': ids(site).person },
    address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    email: 'imunacode@gmail.com',
    telephone: '+2348165972229',
    sameAs: SAME_AS,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: text.catalog,
      itemListElement: text.services.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
    },
  };
}

export function profilePageNode(site: URL, locale: Locale, path: string): JsonLdNode {
  return {
    '@type': 'ProfilePage',
    url: absolute(site, path),
    inLanguage: locale,
    mainEntity: { '@id': ids(site).person },
  };
}

export function caseStudyNode(site: URL, locale: Locale, project: LocalizedProject, path: string, imagePath?: string): JsonLdNode {
  return {
    '@type': 'CreativeWork',
    name: project.data.title,
    ...(imagePath ? { image: absolute(site, imagePath) } : {}),
    description: project.data.description,
    url: absolute(site, path),
    inLanguage: project.translated ? locale : 'en',
    creator: { '@id': ids(site).person },
    dateCreated: project.data.dateStart,
    dateModified: project.data.dateEnd,
    keywords: project.data.tech.join(', '),
    ...(project.data.url ? { sameAs: project.data.url } : {}),
  };
}

export function blogPostingNode(site: URL, locale: Locale, post: LocalizedPost, path: string): JsonLdNode {
  return {
    '@type': 'BlogPosting',
    headline: post.data.title,
    ...(post.data.description ? { description: post.data.description } : {}),
    url: absolute(site, path),
    mainEntityOfPage: absolute(site, path),
    inLanguage: post.translated ? locale : 'en',
    datePublished: post.data.date.toISOString(),
    image: absolute(site, coverSocialCard(locale, post.id)),
    author: { '@id': ids(site).person, name: getProfile(locale).name, url: absolute(site, localePath(locale, '/about')) },
    publisher: { '@id': ids(site).person },
    ...(post.data.tags?.length ? { keywords: post.data.tags.join(', ') } : {}),
  };
}

export function breadcrumbNode(site: URL, items: { name: string; path: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(site, item.path),
    })),
  };
}

/** One JSON-LD document; `<` is escaped so content can never close the script tag. */
export function serializeJsonLd(nodes: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}
