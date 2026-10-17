import type { Locale } from '../i18n/config';

export type ExperienceClient = {
  name: string;
  /** French is a machine draft awaiting review. */
  note: Record<Locale, string>;
  href: string;
  logo: string;
  logoAlt: string;
  /** Tunes logo footprint in the experience grid */
  logoShape?: 'wordmark' | 'mark' | 'gdg';
};

export const experienceClients: ExperienceClient[] = [
  {
    name: 'Fiverr Pro',
    note: { en: 'freelance · payments', fr: 'freelance · paiements' },
    href: 'https://www.fiverr.com/',
    logo: '/brands/fiverr.svg',
    logoAlt: 'Fiverr',
    logoShape: 'wordmark',
  },
  {
    name: 'Remotebase',
    note: { en: 'software engineer', fr: 'ingénieur logiciel' },
    href: 'https://remotebase.com/',
    logo: '/brands/remotebase-mark.png',
    logoAlt: 'Remotebase',
    logoShape: 'mark',
  },
  {
    name: 'GoMyCode',
    note: { en: 'instructor · 4 cohorts', fr: 'formateur · 4 promotions' },
    href: 'https://gomycode.com/',
    logo: '/brands/gomycode-mark.png',
    logoAlt: 'GoMyCode',
    logoShape: 'mark',
  },
  {
    name: 'Google DevFest',
    note: { en: 'speaker', fr: 'conférencier' },
    href: 'https://gdg.community.dev/gdg-enugu/',
    logo: '/brands/gdg-mark.png',
    logoAlt: 'Google Developer Groups Enugu',
    logoShape: 'gdg',
  },
  {
    name: 'Andela',
    note: { en: 'mentor', fr: 'mentor' },
    href: 'https://www.andela.com/',
    logo: '/brands/andela.svg',
    logoAlt: 'Andela',
  },
  {
    name: 'HackerOne',
    note: { en: 'bug bounty research', fr: 'recherche en bug bounty' },
    href: 'https://hackerone.com/',
    logo: '/brands/hackerone.svg',
    logoAlt: 'HackerOne',
  },
];
