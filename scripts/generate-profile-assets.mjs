// Keep the static social card and installed-app description aligned with the site.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { profile } from '../src/data/profile.ts';

const escapeXml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const nameParts = profile.name.split(' ');
const roles = profile.roles.split(' · ');
const portrait = await sharp(fileURLToPath(new URL('../src/assets/favicon-face.png', import.meta.url)))
  .resize(280, 280).png().toBuffer();
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0c10"/>
  <circle cx="442" cy="320" r="146" fill="none" stroke="#39424d" stroke-width="2"/>
  <g font-family="Arial, Helvetica, sans-serif">
    ${nameParts.map((name, index) => `<text x="615" y="${220 + index * 60}" fill="#d5dbe3" font-size="50" font-weight="700">${escapeXml(name)}</text>`).join('')}
    ${roles.map((role, index) => `<text x="615" y="${330 + index * 32}" fill="#a3acb9" font-size="23">${escapeXml(role)}</text>`).join('')}
    <text x="615" y="408" fill="#a3acb9" font-size="19">${escapeXml(profile.coreStack.join(' · '))}</text>
    <text x="615" y="448" fill="#4da3ff" font-size="21">amjedidiah</text>
  </g>
  <rect y="626" width="1200" height="4" fill="#4da3ff"/>
</svg>`;
const image = await sharp(Buffer.from(card)).composite([{ input: portrait, left: 302, top: 180 }]).png().toBuffer();
const output = new URL('../public/og.png', import.meta.url);
const existing = await readFile(output).catch((error) => { if (error.code !== 'ENOENT') throw error; });
if (!existing?.equals(image)) await writeFile(output, image);

const manifestPath = new URL('../public/manifest.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.description !== profile.description) {
  manifest.description = profile.description;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
