import type { Locale } from '../i18n/config';

// Shared by enhanced submissions, native submissions, and the API response.
// French is a machine draft awaiting review.
export const feedbackSuccessCopy: Record<Locale, { title: string; detail: string }> = {
  en: {
    title: 'Thanks for sharing your feedback.',
    detail: 'Your feedback has been received. I appreciate you taking the time.',
  },
  fr: {
    title: 'Merci pour votre avis.',
    detail: 'Votre avis a bien été reçu. Merci d’avoir pris le temps de l’écrire.',
  },
};

export const feedbackSuccess = feedbackSuccessCopy.en;
