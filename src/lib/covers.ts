// Generated cover art: blog thumbnails, social cards for on-site posts, and
// covers for projects without a screenshot. Rendered at build time with satori
// (layout to SVG, text as paths, so no system fonts are needed) and sharp.
//
// Thumbnails carry a topic icon and label, not the title: the title already
// sits next to them in every listing. Social cards add the title, since they
// travel without the page around them.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

type Node = { type: string; props: Record<string, unknown> };
type IconNode = [string, Record<string, string>][];

export type Topic = { icon: string; color: string; label: { en: string; fr: string } };

// First matching tag wins, so the more specific topics come first.
const TOPICS: [string[], Topic][] = [
  [['stripe', 'payments'], { icon: 'credit-card', color: '#8f8cff', label: { en: 'Payments', fr: 'Paiements' } }],
  [['ai'], { icon: 'sparkles', color: '#c4a0ff', label: { en: 'AI', fr: 'IA' } }],
  [['git'], { icon: 'git-pull-request', color: '#ff7b72', label: { en: 'Git', fr: 'Git' } }],
  [['testing'], { icon: 'flask-conical', color: '#3fb950', label: { en: 'Testing', fr: 'Tests' } }],
  [['react', 'nextjs', 'redux', 'state-management'], { icon: 'atom', color: '#61d6bb', label: { en: 'React', fr: 'React' } }],
  [['html', 'accessibility'], { icon: 'accessibility', color: '#61d6bb', label: { en: 'Accessibility', fr: 'Accessibilité' } }],
  [['postgres', 'database'], { icon: 'database', color: '#58a6ff', label: { en: 'Databases', fr: 'Bases de données' } }],
  [['web3', 'blockchain'], { icon: 'boxes', color: '#c4a0ff', label: { en: 'Web3', fr: 'Web3' } }],
  [['devops', 'ssh', 'docker', 'wordpress'], { icon: 'terminal', color: '#3fb950', label: { en: 'DevOps', fr: 'DevOps' } }],
  [['career', 'mentorship', 'interviews'], { icon: 'compass', color: '#e8b86d', label: { en: 'Career', fr: 'Carrière' } }],
  [['tools', 'streaming'], { icon: 'radio', color: '#ff7b72', label: { en: 'Tools', fr: 'Outils' } }],
  [['architecture', 'node'], { icon: 'layers', color: '#58a6ff', label: { en: 'Architecture', fr: 'Architecture' } }],
  [['javascript', 'patterns', 'debugging'], { icon: 'braces', color: '#e8b86d', label: { en: 'JavaScript', fr: 'JavaScript' } }],
  [['meta', 'building-in-public'], { icon: 'pen-line', color: '#e8b86d', label: { en: 'Notes', fr: 'Carnet' } }],
];
const FALLBACK: Topic = { icon: 'file-text', color: '#58a6ff', label: { en: 'Article', fr: 'Article' } };

export function topicFor(tags: readonly string[] = []): Topic {
  const lower = tags.map((tag) => tag.toLowerCase());
  return TOPICS.find(([keys]) => keys.some((key) => lower.includes(key)))?.[1] ?? FALLBACK;
}

const BG = '#0d1117';
const FG = '#e6edf3';
const MUTED = '#8b949e';
const root = process.cwd();
const cache = new Map<string, Promise<unknown>>();
const once = <T>(key: string, load: () => Promise<T>) => {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key) as Promise<T>;
};

const fonts = () => once('fonts', async () => {
  const font = (pkg: string, file: string) => readFile(path.join(root, 'node_modules/@fontsource', pkg, 'files', file));
  return [
    { name: 'Plex Sans', data: await font('ibm-plex-sans', 'ibm-plex-sans-latin-600-normal.woff'), weight: 600 as const, style: 'normal' as const },
    { name: 'Plex Sans', data: await font('ibm-plex-sans', 'ibm-plex-sans-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
    { name: 'Plex Mono', data: await font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  ];
});

/** Lucide's icon geometry, read from the installed @lucide/astro sources. */
const iconNode = (name: string) => once(`icon:${name}`, async () => {
  const source = await readFile(path.join(root, 'node_modules/@lucide/astro/src/icons', `${name}.ts`), 'utf8');
  const match = /const iconData: LucideIconData = (\{.*\});/.exec(source);
  if (!match) throw new Error(`Lucide icon "${name}" not found`);
  return (JSON.parse(match[1]) as { node: IconNode }).node;
});

const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node =>
  ({ type, props: { style, children: children.length === 1 ? children[0] : children } });

async function icon(name: string, size: number, color: string, strokeWidth = 1.6): Promise<Node> {
  const children = (await iconNode(name)).map(([tag, attrs]) => ({ type: tag, props: attrs }));
  return {
    type: 'svg',
    props: {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color,
      'stroke-width': strokeWidth, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', children,
    },
  };
}

const backdrop = (color: string) => ({
  display: 'flex',
  width: '100%',
  height: '100%',
  position: 'relative',
  backgroundColor: BG,
  backgroundImage: `radial-gradient(circle at 82% 18%, ${color}40 0%, ${color}12 32%, transparent 62%), radial-gradient(circle at 8% 100%, ${color}1f 0%, transparent 45%)`,
});

async function render(node: Node, width: number, height: number) {
  return satori(node as never, { width, height, fonts: await fonts() });
}

/** Topic thumbnail for listings (1200×630 artwork). */
async function thumbnailArt(topic: Topic, locale: 'en' | 'fr') {
  // Sized to stay legible at listing size (about 200px wide).
  return h('div', { ...backdrop(topic.color), flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40 },
    h('div', { position: 'absolute', right: -60, bottom: -90, display: 'flex', opacity: 0.12 }, await icon(topic.icon, 460, topic.color, 1.2)),
    h('div', {
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 280, height: 280,
      borderRadius: 56, border: `4px solid ${topic.color}66`, backgroundColor: `${topic.color}14`,
    }, await icon(topic.icon, 170, topic.color, 1.7)),
    h('div', { display: 'flex', fontFamily: 'Plex Mono', fontSize: 72, letterSpacing: 6, color: FG, textTransform: 'uppercase' }, topic.label[locale]),
  );
}

/** Social card for an on-site post: topic, title, author and site. */
async function socialArt(topic: Topic, locale: 'en' | 'fr', title: string, byline: string, host: string) {
  const size = title.length > 90 ? 52 : title.length > 60 ? 60 : 68;
  // Satori sizes boxes without their padding, so the padding comes off 1200×630 here.
  return h('div', { ...backdrop(topic.color), width: 1200 - 144, height: 630 - 128, flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px' },
    h('div', { position: 'absolute', right: -40, bottom: -70, display: 'flex', opacity: 0.1 }, await icon(topic.icon, 420, topic.color, 1.2)),
    h('div', { display: 'flex', flexDirection: 'column', gap: 48 },
    h('div', { display: 'flex', alignItems: 'center', gap: 18 },
      h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 14, border: `2px solid ${topic.color}66`, backgroundColor: `${topic.color}14` },
        await icon(topic.icon, 36, topic.color, 1.8)),
      h('div', { display: 'flex', fontFamily: 'Plex Mono', fontSize: 26, letterSpacing: 4, color: topic.color, textTransform: 'uppercase' }, topic.label[locale]),
    ),
    h('div', { display: 'flex', fontFamily: 'Plex Sans', fontWeight: 700, fontSize: size, lineHeight: 1.12, letterSpacing: -1.5, color: FG, maxWidth: 1000 }, title),
    ),
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontFamily: 'Plex Mono', fontSize: 24, color: MUTED },
      h('div', { display: 'flex', fontFamily: 'Plex Sans', fontWeight: 600, fontSize: 28, color: FG }, byline),
      h('div', { display: 'flex' }, host),
    ),
  );
}

/** Project cover when there's no screenshot: icon, title and scope (16:10). */
async function projectArt(iconName: string, color: string, title: string, scope: string) {
  return h('div', { ...backdrop(color), width: 1600 - 240, height: 1000, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '0 120px', gap: 34 },
    h('div', { position: 'absolute', right: -80, bottom: -110, display: 'flex', opacity: 0.12 }, await icon(iconName, 640, color, 1.1)),
    h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 168, height: 168, borderRadius: 36, border: `3px solid ${color}66`, backgroundColor: `${color}14` },
      await icon(iconName, 100, color, 1.7)),
    h('div', { display: 'flex', fontFamily: 'Plex Sans', fontWeight: 700, fontSize: 112, letterSpacing: -3, color: FG }, title),
    h('div', { display: 'flex', fontFamily: 'Plex Mono', fontSize: 38, letterSpacing: 4, color: MUTED, textTransform: 'uppercase' }, scope),
  );
}

export async function renderThumbnail(tags: readonly string[], locale: 'en' | 'fr', width: number) {
  const svg = await render(await thumbnailArt(topicFor(tags), locale), 1200, 630);
  return sharp(Buffer.from(svg)).resize(width).webp({ quality: 80 }).toBuffer();
}

export async function renderSocialCard(tags: readonly string[], locale: 'en' | 'fr', title: string, byline: string, host: string) {
  const svg = await render(await socialArt(topicFor(tags), locale, title, byline, host), 1200, 630);
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export async function renderProjectCover(iconName: string, color: string, title: string, scope: string) {
  const svg = await render(await projectArt(iconName, color, title, scope), 1600, 1000);
  return sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
}
