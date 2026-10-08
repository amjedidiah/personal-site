import type { APIRoute } from 'astro';
import { submitFeedback } from '../../lib/feedback-server';

export const prerender = false;

export const POST: APIRoute = ({ request }) => submitFeedback(request);
