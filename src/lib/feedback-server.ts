import nodemailer from 'nodemailer';
import { feedbackSuccess } from '../data/feedback-copy.ts';

// URL-encoded UTF-8 can use nine bytes per UTF-16 code unit. Allow the
// advertised field lengths, including non-ASCII text, within a bounded body.
const MAX_BODY_BYTES = 32_000;
const MAX_MESSAGE_LENGTH = 3_000;
const MAX_EMAIL_LENGTH = 254;
const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

type Feedback = { message: string; email: string; source: string; website: string };
type FeedbackEnvironment = {
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
  FEEDBACK_TO?: string;
};

function respond(request: Request, status: number, message: string): Response {
  if (request.headers.get('accept')?.includes('application/json')) {
    return Response.json({ message }, { status, headers: RESPONSE_HEADERS });
  }

  if (status === 200) {
    return new Response(null, {
      status: 303,
      headers: { ...RESPONSE_HEADERS, Location: new URL('/feedback/thanks', request.url).href },
    });
  }

  // Native form submissions still get a useful error if JavaScript is unavailable.
  const safeMessage = message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Feedback could not be sent</title><style>body{font:1rem/1.6 system-ui;background:#0a0c10;color:#c9d1d9;max-width:42rem;margin:12vh auto;padding:0 1.25rem}a{color:#58a6ff}@media(max-width:520px){.email-only{display:none}}@media(min-width:521px){.whatsapp-only{display:none}}</style></head><body><main><h1>Feedback could not be sent</h1><p>${safeMessage}</p><p>Use your browser’s Back button to return to the form and try again. You can also <a class="email-only" href="mailto:imunacode@gmail.com">email me directly</a><a class="whatsapp-only" href="https://wa.me/2348165972229">message me on WhatsApp</a>.</p></main></body></html>`;
  return new Response(html, {
    status,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export function validateFeedback(params: URLSearchParams): Feedback | string {
  const message = params.get('message')?.trim() ?? '';
  const email = params.get('email')?.trim() ?? '';
  const source = params.get('source') ?? '';
  const website = params.get('website')?.trim() ?? '';

  if (website) return { message, email, source, website };
  if (message.length < 5) return 'Please write at least five characters.';
  if (message.length > MAX_MESSAGE_LENGTH) return 'Please use 3,000 characters or fewer.';
  if (email.length > MAX_EMAIL_LENGTH || (email && !/^[^\s@<>,;:()[\]]+@[^\s@<>,;:()[\]]+\.[^\s@<>,;:()[\]]+$/.test(email))) {
    return 'Please enter a valid email address, or leave that field empty.';
  }
  if (source !== 'site' && !/^project:[a-z0-9-]{1,80}$/.test(source)) {
    return 'This feedback link is invalid. Please use the site feedback link in the footer.';
  }
  return { message, email, source, website };
}

export async function submitFeedback(request: Request, env: FeedbackEnvironment = {
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  FEEDBACK_TO: process.env.FEEDBACK_TO,
}): Promise<Response> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return respond(request, 403, 'Please submit the form from this site.');
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return respond(request, 403, 'Please submit the form from this site.');
  }
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    return respond(request, 415, 'This form could not be read. Please reload the page and try again.');
  }
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > MAX_BODY_BYTES) {
    return respond(request, 413, 'Your message is too long. Please shorten it and try again.');
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return respond(request, 400, 'This form could not be read. Please try again.');
  }
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    return respond(request, 413, 'Your message is too long. Please shorten it and try again.');
  }

  const feedback = validateFeedback(new URLSearchParams(body));
  if (typeof feedback === 'string') return respond(request, 400, feedback);
  if (feedback.website) return respond(request, 200, feedbackSuccess.title);

  const user = env.GMAIL_USER;
  const password = env.GMAIL_APP_PASSWORD;
  const recipient = env.FEEDBACK_TO || user;
  if (!user || !password || !recipient) {
    return respond(request, 503, 'Sending is unavailable right now.');
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
      text: `Source: ${feedback.source}\nReply email: ${feedback.email || 'Not provided'}\n\n${feedback.message}`,
    });
    return respond(request, 200, feedbackSuccess.title);
  } catch (error) {
    console.error('Feedback email delivery failed', error instanceof Error ? error.name : 'Unknown error');
    return respond(request, 502, 'The message could not be delivered.');
  }
}
