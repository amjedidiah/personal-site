import type { APIRoute } from 'astro';

// RFC 9116. Built on every deploy, so Expires (required, at most a year out)
// stays current as long as the site keeps deploying.
export const GET: APIRoute = ({ site }) => {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  const body = [
    'Contact: mailto:imunacode@gmail.com',
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    'Preferred-Languages: en, fr',
    `Canonical: ${new URL('/.well-known/security.txt', site).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
