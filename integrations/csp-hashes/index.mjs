import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Astro's CSP hashes the scripts and styles it bundles, but not `is:inline`
// scripts (theme setup, install prompt, service worker registration, ...).
// After the build, this adds a hash for every executable inline script to the
// page's own policy, so they keep working without 'unsafe-inline'. It also
// moves the policy <meta> straight after <meta charset>: a <meta> policy only
// covers what comes after it, so no script may run before it.

const CSP_META = /<meta http-equiv="content-security-policy" content="([^"]*)"\s*\/?>/i;
const INLINE_SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
// Only these script types execute; JSON and JSON-LD are data and need no hash.
const EXECUTABLE_TYPE = /^(|text\/javascript|application\/javascript|module)$/i;

const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

function scriptType(attributes = '') {
  return /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attributes)?.[1] ?? '';
}

/** Returns the page with its inline script hashes in script-src and the policy first in <head>. */
export function addInlineScriptHashes(html) {
  const meta = CSP_META.exec(html);
  if (!meta) return html;

  const hashes = new Set();
  for (const [, attributes = '', body] of html.matchAll(INLINE_SCRIPT)) {
    if (/\bsrc\s*=/i.test(attributes) || !EXECUTABLE_TYPE.test(scriptType(attributes))) continue;
    hashes.add(sha256(body));
  }

  const directives = meta[1].split(';').map((part) => part.trim()).filter(Boolean);
  const index = directives.findIndex((part) => part.startsWith('script-src '));
  const scriptSrc = index === -1 ? ["script-src 'self'"] : [directives[index]];
  const missing = [...hashes].filter((hash) => !scriptSrc[0].split(/\s+/).includes(hash));
  const updated = [scriptSrc[0], ...missing].join(' ');
  if (index === -1) directives.push(updated); else directives[index] = updated;

  const policy = `<meta http-equiv="content-security-policy" content="${directives.join('; ')}">`;
  const withoutMeta = html.replace(meta[0], '');
  const charset = /<meta charset="[^"]*"\s*\/?>/i.exec(withoutMeta);
  if (!charset) return withoutMeta.replace(/<head([^>]*)>/i, `<head$1>${policy}`);
  return withoutMeta.replace(charset[0], `${charset[0]}${policy}`);
}

async function listHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHtml(fullPath);
    return entry.name.endsWith('.html') ? [fullPath] : [];
  }));
  return nested.flat();
}

/** Must run before the service worker integration, which hashes the final HTML. */
export default function cspInlineHashes() {
  return {
    name: 'csp-inline-hashes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const files = await listHtml(fileURLToPath(dir));
        let changed = 0;
        for (const file of files) {
          const html = await readFile(file, 'utf8');
          const updated = addInlineScriptHashes(html);
          if (updated !== html) {
            await writeFile(file, updated);
            changed += 1;
          }
        }
        logger.info(`Hashed inline scripts into the CSP of ${changed} of ${files.length} pages.`);
      },
    },
  };
}
