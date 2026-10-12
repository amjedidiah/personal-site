import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { submitFeedback } from '../../lib/feedback-server';

export const prerender = false;

export const POST: APIRoute = ({ request }) => submitFeedback(request, {
  GMAIL_USER: getSecret('GMAIL_USER'),
  GMAIL_APP_PASSWORD: getSecret('GMAIL_APP_PASSWORD'),
  FEEDBACK_TO: getSecret('FEEDBACK_TO'),
});
