export type ExperienceClient = {
  name: string;
  note: string;
  href: string;
  logo: string;
  logoAlt: string;
  /** Tunes logo footprint in the experience grid */
  logoShape?: 'wordmark' | 'mark' | 'gdg';
};

export const experienceClients: ExperienceClient[] = [
  {
    name: 'Fiverr Pro',
    note: '100+ contractors',
    href: 'https://www.fiverr.com/',
    logo: '/brands/fiverr.svg',
    logoAlt: 'Fiverr',
    logoShape: 'wordmark',
  },
  {
    name: 'Remotebase',
    note: 'cross-border payments',
    href: 'https://remotebase.com/',
    logo: '/brands/remotebase-mark.png',
    logoAlt: 'Remotebase',
    logoShape: 'mark',
  },
  {
    name: 'GoMyCode',
    note: '4 cohorts trained',
    href: 'https://gomycode.com/',
    logo: '/brands/gomycode-mark.png',
    logoAlt: 'GoMyCode',
    logoShape: 'mark',
  },
  {
    name: 'Google DevFest',
    note: 'speaker',
    href: 'https://gdg.community.dev/gdg-enugu/',
    logo: '/brands/gdg-mark.png',
    logoAlt: 'Google Developer Groups Enugu',
    logoShape: 'gdg',
  },
  {
    name: 'Andela',
    note: 'mentor',
    href: 'https://www.andela.com/',
    logo: '/brands/andela.svg',
    logoAlt: 'Andela',
  },
  {
    name: 'HackerOne',
    note: 'Bounty program',
    href: 'https://hackerone.com/',
    logo: '/brands/hackerone.svg',
    logoAlt: 'HackerOne',
  },
];
