// Text that browser scripts write at runtime. Kept apart from ui.ts so client
// bundles only carry these strings. French is a machine draft awaiting review.
import { intlLocale, toLocale, type Locale } from './config';

const en = {
  newTab: ' (opens in a new tab)',
  share: { idle: 'share', copied: 'link copied', announce: 'Link copied' },
  contact: {
    via: (label: string, channel: 'email' | 'WhatsApp', newTab: boolean) =>
      `${label} via ${channel}${newTab ? ' (opens in a new tab)' : ''}`,
  },
  typewriter: { pause: 'Pause text', resume: 'Resume text' },
  offline: {
    offline: { text: 'Showing a saved copy', tip: 'Saved copy', announce: 'Showing a saved copy of this page.' },
    online: { text: 'You’re back online', tip: 'Back online', announce: 'You’re back online. The latest version can be loaded.' },
  },
  status: {
    button: { loading: 'Checking…', rateLimited: 'Retry later', offline: 'Offline', error: 'Retry status', idle: 'Refresh status' },
    fallback: 'Showing the last reviewed status',
    paused: (until: string, last: string) => `Live refresh is paused until ${until}. ${last}`,
    offline: (last: string) => `You’re offline. ${last} Refresh will resume when you reconnect.`,
    available: (last: string) => `Refresh is available again. ${last}`,
    saved: (at: string) => `Saved status from ${at}.`,
    checking: (last: string) => `Checking availability… ${last}`,
    lastChecked: (at: string) => `Last checked ${at}.`,
    live: (at: string) => `Live availability checked ${at}.`,
    unpublishedLabel: 'Availability not published',
    unpublishedDetail: 'Please get in touch to ask about timing.',
    unpublished: 'No availability published. Get in touch to ask about timing.',
    error: (last: string) => `Couldn’t refresh availability. ${last} Retry or get in touch to ask about timing.`,
  },
  listing: {
    filters: 'Filters',
    close: 'Close',
    showResults: (label: string) => `Show ${label}`,
  },
  article: {
    overview: 'Overview',
    copyCode: 'Copy code',
    copying: 'Copying…',
    copied: 'Copied',
    codeCopied: 'Code copied.',
    copyFailedSelected: 'Copy failed. Code selected for manual copying.',
    copyFailed: 'Copy failed. Select the code to copy it manually.',
    sectionLink: (heading: string) => `Link to section: ${heading}`,
    dataTable: 'Data table',
    codeExample: 'Code example',
  },
  feedback: {
    sending: 'Sending…',
    sendingStatus: 'Sending your feedback…',
    notSent: (message: string) => `Feedback not sent. ${message} Your message is still here.`,
    unconfirmed: 'Couldn’t confirm your feedback was sent. Please try again.',
    offline: 'Couldn’t confirm your feedback was sent. Check your connection and try again.',
    rateLimited: 'Too many messages in a short time. Please wait about ten minutes and try again.',
  },
};

export type ClientStrings = typeof en;

const fr: ClientStrings = {
  newTab: ' (s’ouvre dans un nouvel onglet)',
  share: { idle: 'partager', copied: 'lien copié', announce: 'Lien copié' },
  contact: {
    via: (label, channel, newTab) =>
      `${label} ${channel === 'email' ? 'par e-mail' : 'via WhatsApp'}${newTab ? ' (s’ouvre dans un nouvel onglet)' : ''}`,
  },
  typewriter: { pause: 'Mettre le texte en pause', resume: 'Reprendre le texte' },
  offline: {
    offline: { text: 'Copie enregistrée affichée', tip: 'Copie enregistrée', announce: 'Une copie enregistrée de cette page est affichée.' },
    online: { text: 'Vous êtes de nouveau en ligne', tip: 'De nouveau en ligne', announce: 'Vous êtes de nouveau en ligne. La dernière version peut être chargée.' },
  },
  status: {
    button: { loading: 'Vérification…', rateLimited: 'Réessayer plus tard', offline: 'Hors ligne', error: 'Réessayer', idle: 'Actualiser le statut' },
    fallback: 'Dernier statut vérifié affiché',
    paused: (until, last) => `L’actualisation en direct est suspendue jusqu’au ${until}. ${last}`,
    offline: (last) => `Vous êtes hors ligne. ${last} L’actualisation reprendra à la reconnexion.`,
    available: (last) => `L’actualisation est de nouveau disponible. ${last}`,
    saved: (at) => `Statut enregistré le ${at}.`,
    checking: (last) => `Vérification de la disponibilité… ${last}`,
    lastChecked: (at) => `Dernière vérification\u00a0: ${at}.`,
    live: (at) => `Disponibilité vérifiée en direct\u00a0: ${at}.`,
    unpublishedLabel: 'Disponibilité non publiée',
    unpublishedDetail: 'Contactez-moi pour connaître mes délais.',
    unpublished: 'Aucune disponibilité publiée. Contactez-moi pour connaître mes délais.',
    error: (last) => `Impossible d’actualiser la disponibilité. ${last} Réessayez ou contactez-moi pour connaître mes délais.`,
  },
  listing: {
    filters: 'Filtres',
    close: 'Fermer',
    showResults: (label) => `Afficher ${label}`,
  },
  article: {
    overview: 'Aperçu',
    copyCode: 'Copier le code',
    copying: 'Copie…',
    copied: 'Copié',
    codeCopied: 'Code copié.',
    copyFailedSelected: 'La copie a échoué. Le code est sélectionné pour une copie manuelle.',
    copyFailed: 'La copie a échoué. Sélectionnez le code pour le copier manuellement.',
    sectionLink: (heading) => `Lien vers la section\u00a0: ${heading}`,
    dataTable: 'Tableau de données',
    codeExample: 'Exemple de code',
  },
  feedback: {
    sending: 'Envoi…',
    sendingStatus: 'Envoi de votre avis…',
    notSent: (message) => `Avis non envoyé. ${message} Votre message est toujours là.`,
    unconfirmed: 'Impossible de confirmer l’envoi de votre avis. Veuillez réessayer.',
    offline: 'Impossible de confirmer l’envoi de votre avis. Vérifiez votre connexion et réessayez.',
    rateLimited: 'Trop de messages en peu de temps. Veuillez patienter une dizaine de minutes, puis réessayer.',
  },
};

const strings: Record<Locale, ClientStrings> = { en, fr };

/** The page's locale, from `<html lang>` (set by Base.astro). */
export function pageLocale(): Locale {
  return toLocale(document.documentElement.lang);
}

export function clientStrings(locale: Locale = pageLocale()): ClientStrings {
  return strings[locale];
}

export function pageIntlLocale(): string {
  return intlLocale[pageLocale()];
}
