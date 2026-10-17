import nodemailer from 'nodemailer';
import { feedbackSuccessCopy } from '../data/feedback-copy.ts';
import { localePath, toLocale, type Locale } from '../i18n/config.ts';

// URL-encoded UTF-8 can use nine bytes per UTF-16 code unit. Allow the
// advertised field lengths, including non-ASCII text, within a bounded body.
const MAX_BODY_BYTES = 32_000;
const MAX_MESSAGE_LENGTH = 3_000;
const MAX_EMAIL_LENGTH = 254;
const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  // The no-JavaScript error page below has one inline <style> and no scripts.
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

type Feedback = { message: string; email: string; source: string; website: string };

// French is a machine draft awaiting review.
const messages = {
  en: {
    crossSite: 'Please submit the form from this site.',
    unreadableReload: 'This form could not be read. Please reload the page and try again.',
    unreadable: 'This form could not be read. Please try again.',
    tooLarge: 'Your message is too long. Please shorten it and try again.',
    tooShort: 'Please write at least five characters.',
    tooLong: 'Please use 3,000 characters or fewer.',
    email: 'Please enter a valid email address, or leave that field empty.',
    source: 'This feedback link is invalid. Please use the site feedback link in the footer.',
    unavailable: 'Sending is unavailable right now.',
    undelivered: 'The message could not be delivered.',
    errorTitle: 'Feedback could not be sent',
    errorBack: 'Use your browser’s Back button to return to the form and try again. You can also',
    errorEmail: 'email me directly',
    errorWhatsApp: 'message me on WhatsApp',
  },
  fr: {
    crossSite: 'Veuillez envoyer le formulaire depuis ce site.',
    unreadableReload: 'Ce formulaire n’a pas pu être lu. Veuillez recharger la page et réessayer.',
    unreadable: 'Ce formulaire n’a pas pu être lu. Veuillez réessayer.',
    tooLarge: 'Votre message est trop long. Veuillez le raccourcir et réessayer.',
    tooShort: 'Veuillez écrire au moins cinq caractères.',
    tooLong: 'Veuillez utiliser 3\u00a0000 caractères au maximum.',
    email: 'Veuillez saisir une adresse e-mail valide, ou laisser ce champ vide.',
    source: 'Ce lien d’avis n’est pas valide. Veuillez utiliser le lien d’avis du pied de page.',
    unavailable: 'L’envoi est indisponible pour le moment.',
    undelivered: 'Le message n’a pas pu être remis.',
    errorTitle: 'Votre avis n’a pas pu être envoyé',
    errorBack: 'Utilisez le bouton Retour de votre navigateur pour revenir au formulaire et réessayer. Vous pouvez aussi',
    errorEmail: 'm’écrire directement',
    errorWhatsApp: 'm’envoyer un message sur WhatsApp',
  },
} satisfies Record<Locale, Record<string, string>>;

/** The form posts to /api/feedback?locale=fr from French pages. */
function requestLocale(request: Request): Locale {
  return toLocale(new URL(request.url).searchParams.get('locale'));
}
type FeedbackEnvironment = {
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
  FEEDBACK_TO?: string;
};

function respond(request: Request, status: number, message: string): Response {
  const locale = requestLocale(request);
  const copy = messages[locale];
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ message }, { status, headers: RESPONSE_HEADERS });
  }

  if (status === 200) {
    return new Response(null, {
      status: 303,
      headers: { ...RESPONSE_HEADERS, Location: new URL(localePath(locale, '/feedback/thanks'), request.url).href },
    });
  }

  // Native form submissions still get a useful error if JavaScript is unavailable.
  const safeMessage = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${copy.errorTitle}</title><style>body{font:1rem/1.6 system-ui;background:#0a0c10;color:#c9d1d9;max-width:42rem;margin:12vh auto;padding:0 1.25rem}a{color:#58a6ff}@media(max-width:520px){.email-only{display:none}}@media(min-width:521px){.whatsapp-only{display:none}}</style></head><body><main><h1>${copy.errorTitle}</h1><p>${safeMessage}</p><p>${copy.errorBack} <a class="email-only" href="mailto:imunacode@gmail.com">${copy.errorEmail}</a><a class="whatsapp-only" href="https://wa.me/2348165972229">${copy.errorWhatsApp}</a>.</p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function validateFeedback(params: URLSearchParams, locale: Locale = 'en'): Feedback | string {
  const copy = messages[locale];
  const message = params.get('message')?.trim() ?? '';
  const email = params.get('email')?.trim() ?? '';
  const source = params.get('source') ?? '';
  const website = params.get('website')?.trim() ?? '';

  if (website) return { message, email, source, website };
  if (message.length < 5) return copy.tooShort;
  if (message.length > MAX_MESSAGE_LENGTH) return copy.tooLong;
  if (email.length > MAX_EMAIL_LENGTH || (email && !/^[^\s@<>,;:()[\]]+@[^\s@<>,;:()[\]]+\.[^\s@<>,;:()[\]]+$/.test(email))) {
    return copy.email;
  }
  if (source !== 'site' && !/^project:[a-z0-9-]{1,80}$/.test(source)) {
    return copy.source;
  }
  return { message, email, source, website };
}

export async function submitFeedback(request: Request, env: FeedbackEnvironment = {
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  FEEDBACK_TO: process.env.FEEDBACK_TO,
}): Promise<Response> {
  const locale = requestLocale(request);
  const copy = messages[locale];
  const success = feedbackSuccessCopy[locale].title;
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return respond(request, 403, copy.crossSite);
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return respond(request, 403, copy.crossSite);
  }
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    return respond(request, 415, copy.unreadableReload);
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > MAX_BODY_BYTES) {
    return respond(request, 413, copy.tooLarge);
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return respond(request, 400, copy.unreadable);
  }
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    return respond(request, 413, copy.tooLarge);
  }

  const feedback = validateFeedback(new URLSearchParams(body), locale);
  if (typeof feedback === 'string') return respond(request, 400, feedback);
  if (feedback.website) return respond(request, 200, success);

  const user = env.GMAIL_USER;
  const password = env.GMAIL_APP_PASSWORD;
  const recipient = env.FEEDBACK_TO || user;
  if (!user || !password || !recipient) {
    return respond(request, 503, copy.unavailable);
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: password },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
    await transporter.sendMail({
      from: user,
      to: recipient,
      replyTo: feedback.email || undefined,
      subject: feedback.source === 'site' ? 'Site feedback' : `Project feedback: ${feedback.source.slice(8)}`,
      text: `Source: ${feedback.source}\nLanguage: ${locale}\nReply email: ${feedback.email || 'Not provided'}\n\n${feedback.message}`,
    });
    return respond(request, 200, success);
  } catch (error) {
    console.error('Feedback email delivery failed', error instanceof Error ? error.name : 'Unknown error');
    return respond(request, 502, copy.undelivered);
  }
}
