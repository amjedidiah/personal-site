# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The existing site supports these audience hypotheses:

- Prospective project clients evaluating app development, payments, and polish of AI-generated apps before contacting Jedidiah.
- Technical readers exploring articles, case studies, and implementation lessons.
- Potential collaborators and hiring teams evaluating contribution scope, experience, and credentials.

Working editorial priority: clients and founders with an app to launch or improve. Technical readers, collaborators, and hiring teams remain supported. This follows the content audit direction authorized for implementation; it is not a claim about measured visitor demographics.

## Product Purpose

Jedidiah Amaraegbu's personal professional website presents his work, writing, experience, and contact options. Visitors can examine project contributions and evidence, read technical articles, and start a relevant conversation.

## Positioning

The durable promise is apps and payments that hold up in production. Primary roles are full-stack engineer and Stripe-certified developer (the Implementation Architect certification expired on 1 October 2026, so it is history, not a current title), with TypeScript, React.js and Node.js as the core stack. AI-native workflows with Cursor and Claude Code support delivery; security research remains a supporting capability and current activity. Established positioning lives in `src/data/profile.ts`; the social preview and installed-app description are generated from it during prebuild. Current work and offers, including code review, interface improvements, testing, and security fixes for AI-generated apps, live in `src/data/current.ts`. Project records distinguish independent builds, client work, and open-source contributions, with project-specific roles, scope, and evidence.

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
- Homepage availability refreshes from a public GitHub issue. Dated fallback content in `src/data/current.ts` remains available when refresh fails or JavaScript is unavailable. Do not assume availability is permanently open. Gwela’s historical build notes remain dated in its project record.
- Production offline support serves saved content with a connection/freshness notice and a recovery action. Preserve the distinction between a saved copy and current content.
- Feedback is sent by email through `/api/feedback`; the site does not store submissions in a database. Delivery requires environment configuration. Failed submissions retain the draft and offer recovery.
- Core browsing and reading remain usable without JavaScript. Interactive views and preferences enhance the rendered content.
- The site is bilingual: English at `/`, French at `/fr/` for Francophone clients. Interface copy lives in `src/i18n/` and page markup in `src/views/`, so `src/pages/` and `src/pages/fr/` are thin wrappers. French case studies in `src/content/projects-fr/` hold only translatable fields and merge over the English facts. On-site posts are translated in `src/content/blog-fr/`; Hashnode articles stay in English on Hashnode, with French titles and summaries in `src/data/hashnode-fr.ts` (add one there when a new Hashnode post is scraped, or it lists in English). French copy began as a machine draft: files marked `reviewed: false` (and `ui.ts`) await native review. When English copy changes, update the French alongside it.
- The Stripe Connect article is republished on the site from Hashnode; an on-site post whose id matches a Hashnode slug replaces the Hashnode entry in listings (`getExternalPosts` in `src/lib/blog.ts`). Its Hashnode copy should point its canonical URL at the site.
- Search: `site` comes from `PUBLIC_SITE_URL` (falling back to `https://amjedidiah.vercel.app`, the address verified in Google Search Console; `vercel.json` 308-redirects the older `personal-site-flame-theta.vercel.app` there) and drives canonical URLs, hreflang, the sitemap and JSON-LD (`src/lib/structured-data.ts`). URLs never end in a slash. `/llms.txt` summarises the site for AI assistants and is generated from the same data, so it needs no manual upkeep. `robots.txt` allows every crawler, AI ones included, on purpose.
- Development uses `astro dev --background`, managed with `astro dev stop`, `astro dev status`, and `astro dev logs`, as required by `AGENTS.md`.

## Brand Commitments

- The public name is Jedidiah Amaraegbu; the site's wordmark is `amjedidiah` and installed-app short name is `amjed`.
- Existing writing uses a direct, first-person voice and concrete technical explanations.
- Preserve accurate attribution, contribution scope, and project status. A demo, prototype, independent build, client contribution, and production product must not be presented as interchangeable.

## Evidence on Hand

- Project case studies and their explicit role/evidence fields: `src/content/projects/`.
- LinkedIn recommendations, quoted verbatim with the recommender's name, headline and relationship: `src/data/testimonials.ts`. Shown on the home page (clients), About (all) and the related case studies. Never reword or add to them, and never mark them up as Review schema. French pages show labelled translations (machine drafts awaiting review) with the original one click away.
- Local articles and the external writing archive: `src/content/blog/` and `src/data/hashnode.ts`.
- Experience, credential references, speaking links, and contact information: `src/views/AboutPage.astro` with copy in `src/i18n/ui.ts`.
- Project imagery: `src/assets/projects/`, with optional captions and alt text in project records. Some preview images are intentionally disabled pending readiness.
- Identity and social-preview assets: the face favicon and installed-app icons in `public/`, plus `public/og.png`.
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
