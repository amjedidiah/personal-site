import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    platforms: z.array(z.enum(['web', 'mobile'])),
    mobileDelivery: z.enum(['native', 'pwa']).optional(),
    disciplines: z.array(z.enum(['front-end', 'back-end'])).min(1),
    type: z.enum(['founder', 'client', 'oss']),
    url: z.string().optional(),
    urlLabel: z.string().optional(),
    urlSecondary: z.string().optional(),
    urlSecondaryLabel: z.string().optional(),
    videos: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    metric: z.string().optional(),
    role: z.string().optional(),
    evidence: z.string().optional(),
    image: image().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    order: z.number(),
    dateStart: z.iso.date(),
    dateEnd: z.iso.date(),
  }).refine((project) => project.dateEnd >= project.dateStart, {
    message: 'The latest commit date must be on or after the first commit date.',
    path: ['dateEnd'],
  }),
});

// French case studies hold only what changes between languages. Facts (dates,
// links, tech, platforms, order) come from the English record with the same id;
// see src/lib/projects.ts. `reviewed` stays false until a fluent speaker signs off
// on the machine draft.
const projectsFr = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects-fr' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    role: z.string().optional(),
    evidence: z.string().optional(),
    metric: z.string().optional(),
    urlLabel: z.string().optional(),
    urlSecondaryLabel: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    reviewed: z.boolean().default(false),
  }),
});

// French translations of on-site posts, matched to the English post by id. Date,
// tags and featured stay on the English record; see src/lib/blog.ts.
const blogFr = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog-fr' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    reviewed: z.boolean().default(false),
  }),
});

export const collections = { blog, blogFr, projects, projectsFr };
