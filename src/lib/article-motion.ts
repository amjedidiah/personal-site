import { observeReducedMotion, prefersReducedMotion } from './motion';

const ENTRANCE_SELECTORS = ['[data-reading-headline] h1', '[data-reading-headline] .lead', '[data-reading-meta]'];

function canAnimateEntrance(target: HTMLElement | null): target is HTMLElement {
  if (!target) return false;
  if (!target.getClientRects().length) return false;
  return typeof target.animate === 'function';
}

function claimArticleMotionRoot(): HTMLElement | null {
  const article = document.querySelector<HTMLElement>('[data-article-motion]');
  if (!article || article.dataset.motionInitialized) return null;
  article.dataset.motionInitialized = 'true';
  return article;
}

function shouldAnimateArticleEntrance(): boolean {
  if (prefersReducedMotion()) return false;
  return document.visibilityState === 'visible';
}

function entranceDurationFor(article: HTMLElement): number {
  return article.dataset.readingKind === 'project' ? 400 : 300;
}

function createEntranceAnimations(article: HTMLElement, duration: number): Animation[] {
  const animations: Animation[] = [];
  for (const selector of ENTRANCE_SELECTORS) {
    const target = article.querySelector<HTMLElement>(selector);
    if (!canAnimateEntrance(target)) continue;
    const animation = target.animate([{ transform: 'translateY(4px)' }, { transform: 'none' }], {
      duration, easing: 'cubic-bezier(.16, 1, .3, 1)',
    });
    animation.id = 'article-entrance';
    animations.push(animation);
  }
  return animations;
}

function bindArticleMotionLifecycle(article: HTMLElement, animations: Animation[], lifecycle: AbortController) {
  const { signal } = lifecycle;
  const cancel = () => {
    for (const animation of animations) animation.cancel();
    article.classList.remove('article-entering');
  };
  const cleanup = () => {
    cancel();
    lifecycle.abort();
  };
  void Promise.all(animations.map((animation) => animation.finished.catch(() => {}))).then(cleanup);
  observeReducedMotion(() => {
    if (prefersReducedMotion()) cleanup();
  }, signal);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cleanup();
  }, { signal });
  window.addEventListener('pagehide', cleanup, { once: true, signal });
}

export function initArticleMotion() {
  const article = claimArticleMotionRoot();
  if (!article || !shouldAnimateArticleEntrance()) return;
  const duration = entranceDurationFor(article);
  article.style.setProperty('--reading-entrance-duration', `${duration}ms`);
  article.classList.add('article-entering');
  const lifecycle = new AbortController();
  bindArticleMotionLifecycle(article, createEntranceAnimations(article, duration), lifecycle);
}
