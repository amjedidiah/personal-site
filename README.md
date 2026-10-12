# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Current status feed

The homepage renders dated fallback content from `src/data/current.ts`, then checks two public GitHub issues on load and every five minutes while the tab is visible. If GitHub is unavailable, the fallback stays visible and is marked as unrefreshed.

- [Availability issue](https://github.com/amjedidiah/personal-site/issues/1): open means available for project conversations; closed means unavailable. Its first paragraph is the open-state detail.
- [Gwela update issue](https://github.com/amjedidiah/personal-site/issues/2): a public record for build updates. Dated case-study notes are maintained in `src/content/projects/gwela.md`.

Established positioning lives in `src/data/profile.ts`. Current work, the AI app review offer, and dated availability fallback live in `src/data/current.ts`; review them monthly and when the work changes. The `CurrentWork` component keeps Home and About in sync. Featured writing is selected using the existing `featured` metadata.

The [content review implementation report](docs/content-review-implementation-2026-10-12.md) records evidence, verification limits, and the maintenance responsibilities for each content source.

Keep the fallback in `src/data/current.ts` accurate for visitors without JavaScript or during an API outage. The issue URLs and response validation live in `src/lib/current-feed.ts`.

## Offline support

Production builds emit `dist/sw.js` from `integrations/service-worker/`. It precaches every built file, versioned by a hash of their contents, so each deploy installs a fresh cache and deletes the old one.

- Pages load network-first. If the network fails or takes longer than 3s, a cached copy is served. Routes that were never cached fall back to `/offline`.
- Cached pages are tagged `data-cached-copy` on `<html>`, which shows the notice in `src/components/OfflineNotice.astro` as a banner above the header. It checks every 15s, on reconnect and when the tab regains focus, and changes to "back online" once the site responds.
- The status dot after the wordmark (`src/components/FreshnessDot.astro`) shows on every cached page: grey on a saved copy, blue with a pulse once the site responds. It is display-only. Dismissing the notice (× or Esc) keeps it hidden on later saved pages for the browser session, until a fresh page loads. If the site comes back, the notice reappears with "load latest".
- Everything else (hashed `/_astro/` assets, fonts, images, icons) loads from cache first, then the network.
- Dev builds never register the worker. They also remove any worker left behind by `astro preview`, which uses the same port.

Kill switch: if a broken worker ships, build with `SW_KILL_SWITCH=1` and deploy. That build emits a `sw.js` that clears caches, unregisters itself and reloads open tabs. Its pages also stop registering the worker. Deploy a normal build afterwards to turn offline support back on.

## Private feedback

Project case studies link to a project-specific feedback form; the footer links to the general form. Submissions are sent privately by the Astro `/api/feedback` endpoint, deployed as a Vercel Function. No feedback is stored in the site or a database. The form keeps the draft when a submission fails and offers a direct email link.

Configure `GMAIL_USER` and `GMAIL_APP_PASSWORD` in Vercel Project Settings → Environment Variables for each environment that should accept feedback. `FEEDBACK_TO` is optional and defaults to `GMAIL_USER`. The password must be a Google App Password from an account with 2-Step Verification, not the account password. Add the same values to ignored `.env.local` for local end-to-end testing; `.env.example` lists the names. Redeploy after changing Vercel environment variables.

The endpoint uses a honeypot, same-origin checks, and input size limits. If submission volume becomes abusive, add a Vercel Firewall rate limit scoped to `POST /api/feedback`; do not rely on in-memory counters in a serverless function. Run `node --experimental-strip-types --test tests/feedback.test.ts` to check validation and delivery behavior without sending real mail.
