# AGENTS.md

## Development

When starting the dev server, use background mode:

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Run tests with `bun test` (there is no `test` script). Routes use `trailingSlash: 'never'`, so in dev `/fr/` 404s; use `/fr`.

The home page's availability line is read live from GitHub issue #1 (first paragraph of its body). When the services on offer change, update that issue and `src/data/current.ts` together.

## Commits

- No AI attribution in commit messages or PR descriptions: no `Co-Authored-By` lines for an AI tool, no `Claude-Session` links, no "Generated with" footers.
- Commit or push only when asked.
- `main` has a GitHub ruleset that blocks force pushes.

## Documentation

Full documentation: <https://docs.astro.build>

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
