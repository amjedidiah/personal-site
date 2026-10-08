# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The existing site supports these audience hypotheses:

- Prospective project clients evaluating payments, platform architecture, and production AI work before contacting Jedidiah.
- Technical readers exploring articles, case studies, and implementation lessons.
- Potential collaborators and hiring teams evaluating contribution scope, experience, and credentials.

Open decision: the primary audience has not been selected. These audiences are inferred from the site's current copy, workflows, and resume/contact links; their order does not establish priority.

## Product Purpose

Jedidiah Amaraegbu's personal professional website presents his work, writing, experience, and contact options. Visitors can examine project contributions and evidence, read technical articles, and start a relevant conversation.

## Positioning

The site's existing copy emphasizes payments engineering, Stripe architecture, production AI, and security research. Its project records distinguish independent builds, client work, and open-source contributions, with project-specific roles, scope, and evidence.

## Operating Context

- Visitors enter through the homepage, project archive, blog archive, individual case studies or articles, and the about page.
- Project and blog archives support timeline, alphabetical list, and interactive Explore views. Filters narrow projects by type and platform, and writing by category.
- Case studies and articles support direct links and section anchors. Navigation connects the archive, related or adjacent work, and contact or feedback paths.
- Writing combines local articles with external Hashnode entries; external destinations are identified.
- Project feedback and general feedback are private submissions. Direct contact options include email and phone/WhatsApp links.

## Capabilities and Constraints

- This is an existing Astro website with TypeScript and Markdown content collections, deployed through the Vercel adapter. Project and blog pages are prerendered; the feedback endpoint runs on the server.
- Project records in `src/content/projects/` and their schema in `src/content.config.ts` own project titles, descriptions, technologies, roles, evidence, delivery platforms, links, and chronology. Native mobile apps and mobile PWAs are distinct.
- Local writing lives in `src/content/blog/`; external article metadata lives in `src/data/hashnode.ts`.
- Homepage availability and the latest Gwela update can refresh from public GitHub issues. Dated fallback content in `src/data/current.ts` remains available when refresh fails or JavaScript is unavailable. Do not assume availability is permanently open.
- Production offline support serves saved content with a connection/freshness notice and a recovery action. Preserve the distinction between a saved copy and current content.
- Feedback is sent by email through `/api/feedback`; the site does not store submissions in a database. Delivery requires environment configuration. Failed submissions retain the draft and offer recovery.
- Core browsing and reading remain usable without JavaScript. Interactive views and preferences enhance the rendered content.
- Development uses `astro dev --background`, managed with `astro dev stop`, `astro dev status`, and `astro dev logs`, as required by `AGENTS.md`.

## Brand Commitments

- The public name is Jedidiah Amaraegbu; the site's wordmark is `amjed`.
- Existing writing uses a direct, first-person voice and concrete technical explanations.
- Preserve accurate attribution, contribution scope, and project status. A demo, prototype, independent build, client contribution, and production product must not be presented as interchangeable.

## Evidence on Hand

- Project case studies and their explicit role/evidence fields: `src/content/projects/`.
- Local articles and the external writing archive: `src/content/blog/` and `src/data/hashnode.ts`.
- Experience, credential references, speaking links, and contact information: `src/pages/about.astro`.
- Project imagery: `src/assets/projects/`, with optional captions and alt text in project records. Some preview images are intentionally disabled pending readiness.
- Identity and social-preview assets: `public/favicon.svg`, `public/og.svg`, and related icons.
- These are repository-provided records and references, not an independent verification of their external claims. Do not invent testimonials, customer logos, adoption figures, financial outcomes, or additional credentials.

## Product Principles

1. Help visitors understand the actual work, the author's contribution, and the evidence behind it.
2. Keep project status and attribution precise; clearly distinguish demonstrations from production evidence.
3. Make browsing, reading, and recovery work across direct links, constrained connections, and unavailable enhancements.
4. Keep contact and private feedback easy to reach, with useful failure recovery.
5. Preserve established product behavior and factual content during refinement; make changes to positioning explicit.

## Accessibility & Inclusion

The user explicitly requested accessibility, complete UI states, and purposeful motion improvements.

- Preserve semantic headings and landmarks, descriptive control names, visible keyboard focus, and logical focus recovery.
- Keep all core paths keyboard-operable, including filters, disclosures, and Explore navigation.
- Respect reduced-motion preferences; content and state changes remain understandable without spatial animation.
- Keep content readable across mobile and desktop sizes, light and dark preferences, and long or missing content.
- Keep article anchors clear of sticky navigation and overflowing code or tables accessible.
- A formal conformance target or certification has not been established.
