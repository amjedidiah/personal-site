import { clientStrings } from '../i18n/client';

type CodeCopyContext = {
  code: HTMLElement;
  pre: HTMLPreElement;
  button: HTMLButtonElement;
  status: HTMLParagraphElement;
  signal: AbortSignal;
  timers: Set<number>;
};

const PERMALINK_SVG_ATTRS = {
  viewBox: '0 0 24 24',
  width: '16',
  height: '16',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.7',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
};

const PERMALINK_ICON_PATHS = [
  'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
  'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
];

function setCopyButtonBusy(button: HTMLButtonElement, busy: boolean) {
  button.disabled = busy;
  if (busy) {
    button.setAttribute('aria-busy', 'true');
    button.textContent = clientStrings().article.copying;
    return;
  }
  button.removeAttribute('aria-busy');
}

function selectCodeForManualCopy(code: HTMLElement, pre: HTMLPreElement): boolean {
  const selection = window.getSelection();
  if (!selection) return false;
  const range = document.createRange();
  range.selectNodeContents(code);
  selection.removeAllRanges();
  selection.addRange(range);
  pre.tabIndex = 0;
  pre.focus({ preventScroll: true });
  return true;
}

function scheduleCopyReset(
  button: HTMLButtonElement,
  status: HTMLParagraphElement,
  timers: Set<number>,
  resetTimer: { id: number },
) {
  resetTimer.id = window.setTimeout(() => {
    button.textContent = clientStrings().article.copyCode;
    status.textContent = '';
    timers.delete(resetTimer.id);
  }, 2000);
  timers.add(resetTimer.id);
}

async function copyArticleCode(context: CodeCopyContext, resetTimer: { id: number }) {
  const { code, pre, button, status, signal, timers } = context;
  clearTimeout(resetTimer.id);
  timers.delete(resetTimer.id);
  setCopyButtonBusy(button, true);
  status.textContent = '';
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(code.textContent ?? '');
    if (signal.aborted) return;
    button.textContent = clientStrings().article.copied;
    status.textContent = clientStrings().article.codeCopied;
    scheduleCopyReset(button, status, timers, resetTimer);
  } catch {
    if (signal.aborted) return;
    button.textContent = clientStrings().article.copyCode;
    const selected = selectCodeForManualCopy(code, pre);
    status.textContent = selected
      ? clientStrings().article.copyFailedSelected
      : clientStrings().article.copyFailed;
  } finally {
    if (!signal.aborted) setCopyButtonBusy(button, false);
  }
}

function createHeadingPermalinkIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries(PERMALINK_SVG_ATTRS)) svg.setAttribute(key, value);
  for (const d of PERMALINK_ICON_PATHS) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function attachHeadingPermalinks(prose: HTMLElement, signal: AbortSignal) {
  for (const heading of prose.querySelectorAll<HTMLElement>('h2[id], h3[id]')) {
    const link = document.createElement('a');
    link.className = 'heading-permalink';
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.setAttribute('aria-label', clientStrings().article.sectionLink(heading.textContent?.trim() ?? ''));
    link.append(createHeadingPermalinkIcon());
    link.addEventListener('click', () => { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }, { signal });
    heading.append(link);
  }
}

function enhanceCodeBlock(pre: HTMLPreElement, signal: AbortSignal, timers: Set<number>) {
  const code = pre.querySelector('code');
  if (!code?.textContent?.trim()) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'article-code';
  const toolbar = document.createElement('div');
  toolbar.className = 'article-code-toolbar';
  const status = document.createElement('p');
  status.className = 'article-code-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'article-code-copy';
  button.textContent = clientStrings().article.copyCode;
  toolbar.append(status, button);
  pre.before(wrapper);
  wrapper.append(toolbar, pre);
  const resetTimer = { id: 0 };
  const copyContext = { code, pre, button, status, signal, timers };
  button.addEventListener('click', () => { void copyArticleCode(copyContext, resetTimer); }, { signal });
}

const CODE_LANGUAGES: Record<string, string> = {
  bash: 'Shell', sh: 'Shell', shell: 'Shell', zsh: 'Shell', css: 'CSS', html: 'HTML',
  javascript: 'JavaScript', js: 'JavaScript', jsx: 'JSX', json: 'JSON', python: 'Python',
  sql: 'SQL', tsx: 'TSX', ts: 'TypeScript', typescript: 'TypeScript', yaml: 'YAML', yml: 'YAML',
};

/**
 * Names each code block by its language and section ("TypeScript example —
 * Embedded Onboarding"), numbered when a section has several, so screen
 * readers can tell the scrollable code regions apart.
 */
export function labelCodeBlocks(prose: HTMLElement) {
  const strings = clientStrings().article;
  const blocks: { pre: HTMLPreElement; section: string }[] = [];
  let section = '';
  for (const element of prose.querySelectorAll<HTMLElement>('h2, h3, pre')) {
    if (element.tagName === 'PRE') blocks.push({ pre: element as HTMLPreElement, section });
    else section = element.textContent?.trim() ?? '';
  }
  const perSection = new Map<string, number>();
  for (const { section: name } of blocks) perSection.set(name, (perSection.get(name) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const { pre, section: name } of blocks) {
    const raw = pre.dataset.language?.toLowerCase() ?? '';
    const language = raw && raw !== 'plaintext' && raw !== 'text'
      ? CODE_LANGUAGES[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
    const index = (seen.get(name) ?? 0) + 1;
    seen.set(name, index);
    const label = strings.codeBlock(language, name);
    pre.dataset.codeLabel = (perSection.get(name) ?? 0) > 1 ? `${label} (${index})` : label;
  }
}

function attachCodeCopyBlocks(prose: HTMLElement, signal: AbortSignal, timers: Set<number>) {
  labelCodeBlocks(prose);
  for (const pre of prose.querySelectorAll<HTMLPreElement>('pre')) {
    enhanceCodeBlock(pre, signal, timers);
  }
}

function wrapArticleTables(prose: HTMLElement) {
  for (const table of prose.querySelectorAll('table')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'article-table-scroll';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', table.caption?.textContent?.trim() || clientStrings().article.dataTable);
    table.before(wrapper);
    wrapper.append(table);
  }
}

function updateScrollableRegions(regions: NodeListOf<HTMLElement>) {
  for (const region of regions) {
    if (region.scrollWidth > region.clientWidth) {
      region.tabIndex = 0;
      if (region.tagName === 'PRE') {
        region.setAttribute('role', 'region');
        region.setAttribute('aria-label', region.dataset.codeLabel || clientStrings().article.codeExample);
      }
    } else region.removeAttribute('tabindex');
  }
}

function observeScrollableRegions(prose: HTMLElement): ResizeObserver | undefined {
  const regions = prose.querySelectorAll<HTMLElement>('pre, .article-table-scroll');
  const update = () => updateScrollableRegions(regions);
  update();
  const observer = 'ResizeObserver' in window ? new ResizeObserver(update) : undefined;
  if (observer) {
    for (const region of regions) observer.observe(region);
  }
  return observer;
}

function bindArticleContentCleanup(
  lifecycle: AbortController,
  timers: Set<number>,
  observer: ResizeObserver | undefined,
) {
  const { signal } = lifecycle;
  const cleanup = () => {
    lifecycle.abort();
    observer?.disconnect();
    for (const timer of timers) clearTimeout(timer);
  };
  document.addEventListener('astro:before-swap', cleanup, { once: true, signal });
  window.addEventListener('pagehide', (event) => { if (!event.persisted) cleanup(); }, { signal });
}

export function enhanceArticleContent() {
  const prose = document.querySelector<HTMLElement>('.project-article .prose, .article-shell .prose');
  if (!prose || prose.dataset.enhanced) return;
  prose.dataset.enhanced = 'true';

  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const timers = new Set<number>();
  const article = prose.closest<HTMLElement>('[data-article-motion]');
  if (article) {
    attachHeadingPermalinks(prose, signal);
    attachCodeCopyBlocks(prose, signal, timers);
  }

  wrapArticleTables(prose);
  const observer = observeScrollableRegions(prose);
  bindArticleContentCleanup(lifecycle, timers, observer);
}
