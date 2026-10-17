import { createHash } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import { addInlineScriptHashes } from './index.mjs';

const hash = (text: string) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`;
const page = (head: string, body = '') =>
  `<!DOCTYPE html><html><head><meta charset="utf-8">${head}</head><body>${body}</body></html>`;
const policy = `<meta http-equiv="content-security-policy" content="default-src 'self'; script-src 'self' 'sha256-bundled='; style-src 'self'">`;

describe('addInlineScriptHashes', () => {
  test('adds a hash for each executable inline script', () => {
    const html = addInlineScriptHashes(page(`<script>a()</script>${policy}`, '<script type="module">b()</script>'));
    expect(html).toContain(`script-src 'self' 'sha256-bundled=' ${hash('a()')} ${hash('b()')}`);
  });

  test('skips external scripts and JSON data blocks', () => {
    const html = addInlineScriptHashes(page(policy, '<script src="/x.js"></script><script type="application/ld+json">{}</script><script type="application/json">[]</script>'));
    expect(html).toContain("script-src 'self' 'sha256-bundled='; style-src");
  });

  test('moves the policy straight after <meta charset> so it covers every script', () => {
    const html = addInlineScriptHashes(page(`<script>a()</script>${policy}`));
    expect(html.indexOf('content-security-policy')).toBeLessThan(html.indexOf('<script>'));
    expect(html.match(/content-security-policy/g)).toHaveLength(1);
  });

  test('does not repeat a hash Astro already added', () => {
    const html = addInlineScriptHashes(page(`<meta http-equiv="content-security-policy" content="script-src 'self' ${hash('a()')}">`, '<script>a()</script>'));
    expect(html.split(hash('a()'))).toHaveLength(2);
  });

  test('leaves pages without a policy untouched', () => {
    const html = page('<script>a()</script>');
    expect(addInlineScriptHashes(html)).toBe(html);
  });
});
