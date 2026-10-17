import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templateDir = path.dirname(fileURLToPath(import.meta.url));

// 404.html is served by the host for unknown routes; offline misses use /offline instead.
// og.png is only fetched by social crawlers, never by the page.
// robots.txt, llms.txt and the sitemap are for crawlers, not visitors.
const EXCLUDED_FILES = new Set(['sw.js', '404.html', 'og.png', 'robots.txt', 'llms.txt']);
// Photos (and every srcset width of them) are cached on first view by sw.js
// instead, so a visit doesn't download images the visitor never looks at.
const LAZY_EXTENSIONS = new Set(['.webp', '.avif', '.jpg', '.jpeg', '.gif']);
// Most visitors read the English pages, so only those are precached. Translated
// pages (/fr/...) are cached as they're visited; their offline page is kept so
// a French reader never falls back to English.
const LOCALE_PAGE = /^fr\/.*index\.html$/;
const LOCALE_PRECACHED = new Set(['fr/offline/index.html']);

async function listFiles(root, dir = root) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(root, fullPath);
    return [path.relative(root, fullPath).split(path.sep).join('/')];
  }));
  return nested.flat();
}

// Generated social cards (covers/<locale>/<post>.png) are for link previews only.
const SOCIAL_CARD = /^covers\/.+\.png$/;

export function isPrecacheable(file) {
  return !EXCLUDED_FILES.has(file)
    && !SOCIAL_CARD.test(file)
    && !file.split('/').some((segment) => segment.startsWith('.'))
    && !file.endsWith('.map')
    && !LAZY_EXTENSIONS.has(path.posix.extname(file).toLowerCase())
    && (!LOCALE_PAGE.test(file) || LOCALE_PRECACHED.has(file));
}

/**
 * Maps a build output path to the URL fetched during install and the cache key
 * it is stored under. Pages use their canonical slash-free URL (the host
 * redirects `/about/` to `/about`), which is also the key sw.js looks up.
 */
export function toPrecacheEntry(file) {
  if (file === 'index.html') return { url: '/', key: '/' };
  if (file.endsWith('/index.html')) {
    const page = `/${file.slice(0, -'/index.html'.length)}`;
    return { url: page, key: page };
  }
  return { url: `/${file}`, key: `/${file}` };
}

/** Emits dist/sw.js with every built file precached, versioned by content hash. */
export default function serviceWorker() {
  return {
    name: 'service-worker',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const swPath = path.join(outDir, 'sw.js');

        if (process.env.SW_KILL_SWITCH === '1') {
          await writeFile(swPath, await readFile(path.join(templateDir, 'kill-switch.js')));
          logger.warn('SW_KILL_SWITCH=1: emitted a service worker that unregisters itself.');
          return;
        }

        const files = (await listFiles(outDir)).filter(isPrecacheable).sort();
        const template = await readFile(path.join(templateDir, 'sw.js'), 'utf8');

        const hash = createHash('sha256').update(template);
        for (const file of files) {
          hash.update(file).update(await readFile(path.join(outDir, file)));
        }
        const version = hash.digest('hex').slice(0, 12);

        const source = template
          .replace('self.__SW_VERSION__', () => JSON.stringify(version))
          .replace('self.__SW_PRECACHE__', () => JSON.stringify(files.map(toPrecacheEntry)));
        await writeFile(swPath, source);
        logger.info(`sw.js ${version}: precached ${files.length} files.`);
      },
    },
  };
}
