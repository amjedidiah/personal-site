import { getArticleScrollMargin } from './article-scroll-offset';
import { observeReducedMotion, prefersReducedMotion } from './motion';

type ReadingProgressMetrics = {
  scrollTop: number;
  bodyTop: number;
  bodyBottom: number;
  viewportHeight: number;
  topInset: number;
  bottomInset: number;
};

/** Reading ends when the last line reaches the viewport above any bottom nav. */
export function getReadingProgress(metrics: ReadingProgressMetrics) {
  const { scrollTop, bodyTop, bodyBottom, viewportHeight, topInset, bottomInset } = metrics;
  const end = bodyBottom - viewportHeight + bottomInset;
  const start = Math.min(bodyTop - topInset, end - 1);
  return Math.min(1, Math.max(0, (scrollTop - start) / (end - start)));
}

export function initPageProgress() {
  const progress = document.querySelector<HTMLElement>('[data-page-progress]');
  if (!progress) return;
  const body = document.querySelector<HTMLElement>('[data-reading-body]');
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  let frame = 0;
  let topInset = 0;
  let bottomInset = 0;
  const supportsTimeline = CSS.supports('animation-timeline: view()')
    && CSS.supports('timeline-scope: --reading-body')
    && CSS.supports('animation-range: entry 100% exit 0%');
  const update = () => {
    frame = 0;
    const scrollRoot = document.scrollingElement ?? document.documentElement;
    const scrollTop = scrollRoot.scrollTop;
    const bounds = body?.getBoundingClientRect();
    const value = bounds
      ? getReadingProgress({
        scrollTop,
        bodyTop: bounds.top + scrollTop,
        bodyBottom: bounds.bottom + scrollTop,
        viewportHeight: window.innerHeight,
        topInset,
        bottomInset,
      })
      : Math.min(1, Math.max(0, scrollTop / Math.max(1, scrollRoot.scrollHeight - window.innerHeight)));
    progress.style.setProperty('--page-progress', String(value));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const refresh = () => {
    if (body) {
      bottomInset = document.querySelector('.mobile-nav')?.getBoundingClientRect().height ?? 0;
      topInset = Math.min(getArticleScrollMargin(), Math.max(0, window.innerHeight - bottomInset - 1));
      document.documentElement.style.setProperty('--reading-top', `${topInset}px`);
      document.documentElement.style.setProperty('--reading-bottom', `${bottomInset}px`);
      // The entry/exit ranges have the same reading boundaries as the fallback
      // for articles longer than the usable viewport. Short posts use JS.
      const native = supportsTimeline && !prefersReducedMotion()
        && body.getBoundingClientRect().height > window.innerHeight - topInset - bottomInset + 1;
      progress.dataset.readingProgress = native ? 'css' : 'js';
    }
    schedule();
  };
  window.addEventListener('scroll', () => { if (progress.dataset.readingProgress !== 'css') schedule(); }, { passive: true, signal });
  window.addEventListener('resize', refresh, { passive: true, signal });
  window.addEventListener('load', refresh, { once: true, signal });
  window.addEventListener('pageshow', refresh, { signal });
  observeReducedMotion(refresh, signal);
  const observer = body && 'ResizeObserver' in window ? new ResizeObserver(refresh) : undefined;
  if (body && observer) {
    observer.observe(body);
    for (const element of document.querySelectorAll('.article-rail, [data-reading-headline], .desktop-nav, .mobile-topbar, .mobile-nav')) {
      observer.observe(element);
    }
  }
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    lifecycle.abort();
    observer?.disconnect();
    cancelAnimationFrame(frame);
  }, { signal });
  refresh();
}
