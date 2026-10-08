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
- [Gwela update issue](https://github.com/amjedidiah/personal-site/issues/2): edit its title and first paragraph to publish a new update. The issue's edit time is shown on the site.

Keep the fallback in `src/data/current.ts` accurate for visitors without JavaScript or during an API outage. The issue URLs and response validation live in `src/lib/current-feed.ts`.
