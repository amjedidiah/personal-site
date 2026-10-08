import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const templateDir = path.dirname(fileURLToPath(import.meta.url));

// 404.html is served by the host for unknown routes; offline misses use /offline instead.
const EXCLUDED_FILES = new Set(['sw.js', '404.html']);

async function listFiles(root, dir = root) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(root, fullPath);
    return [path.relative(root, fullPath).split(path.sep).join('/')];
  }));
  return nested.flat();
}

function isPrecacheable(file) {
  return !EXCLUDED_FILES.has(file) && !path.posix.basename(file).startsWith('.') && !file.endsWith('.map');
}

/**
 * Maps a build output path to the URL fetched during install and the cache key
 * it is stored under. Pages are fetched by directory URL and keyed without the
 * trailing slash so `/about` and `/about/` resolve to the same entry.
 */
export function toPrecacheEntry(file) {
  if (file === 'index.html') return { url: '/', key: '/' };
  if (file.endsWith('/index.html')) {
    const directory = `/${file.slice(0, -'index.html'.length)}`;
    return { url: directory, key: directory.slice(0, -1) };
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
