import type { APIRoute } from 'astro';
import { getProfile } from '../data/profile';
import { getExternalPosts, getPosts } from '../lib/blog';
import { getProjects } from '../lib/projects';
import { SAME_AS } from '../lib/structured-data';

// A plain-text guide for AI assistants (https://llmstxt.org), built from the same
// data as the pages so it never drifts from them. English only; /fr mirrors it.
export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const profile = getProfile('en');
  const projects = (await getProjects('en')).sort((a, b) => a.data.order - b.data.order);
  const posts = (await getPosts('en')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const external = await getExternalPosts('en');
  const link = (title: string, href: string, note?: string) => `- [${title}](${href})${note ? `: ${note}` : ''}`;

  const body = [
    `# ${profile.name}`,
    '',
    `> ${profile.description}`,
    '',
    profile.introduction,
    '',
    `- Experience: ${profile.yearsExperience}+ years; mentored ${profile.developersMentored}+ developers`,
    '- Credential: Stripe Professional Payments Developer (2022): https://stripecertifications.credential.net/efcd44b0-6e66-4262-89c2-5a513bdec126',
    '- Location: Lagos, Nigeria; works remotely worldwide',
    '- Contact: imunacode@gmail.com, WhatsApp +234 816 597 2229',
    `- CV (PDF): ${profile.cvUrl}`,
    `- Languages: English; French site at ${url('/fr')}`,
    '',
    '## Pages',
    '',
    link('Home', url('/'), 'current work, availability, featured projects and articles'),
    link('About', url('/about'), 'background, experience, credentials, client recommendations'),
    link('Projects', url('/projects'), 'all case studies'),
    link('Blog', url('/blog'), 'all articles'),
    '',
    '## Case studies',
    '',
    ...projects.map((project) => link(project.data.title, url(`/projects/${project.id}`), project.data.description)),
    '',
    '## Articles',
    '',
    ...posts.map((post) => link(post.data.title, url(`/blog/${post.id}`), post.data.description)),
    '',
    '## Optional',
    '',
    ...external.map((post) => link(post.title, post.url, post.brief)),
    '',
    '## Profiles',
    '',
    ...SAME_AS.map((href) => `- ${href}`),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
