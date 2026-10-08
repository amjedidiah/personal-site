const SCROLL_BUFFER_PX = 12;

const navElement = () => Array.from(
  document.querySelectorAll<HTMLElement>('.desktop-nav, .mobile-topbar'),
).find((nav) => nav.getBoundingClientRect().height > 0);

const stickyStackElements = () => {
  const chrome = document.querySelector<HTMLElement>('.article-chrome');
  if (chrome && getComputedStyle(chrome).display !== 'contents' && getComputedStyle(chrome).position === 'sticky') return [chrome];

  const rail = document.querySelector<HTMLElement>('.article-rail');
  if (rail && window.matchMedia('(max-width: 800px)').matches && getComputedStyle(rail).position === 'sticky') return [rail];

  const headline = document.querySelector<HTMLElement>('.project-headline, .article-headline');
  return headline && getComputedStyle(headline).position === 'sticky' ? [headline] : [];
};

/** Offset for scroll-margin and hash jumps (full sticky stack when pinned). */
export function getArticleScrollMargin(): number {
  const stack = stickyStackElements();
  if (stack.length === 0) {
    const nav = navElement();
    return (nav?.offsetHeight ?? 56) + 48 + SCROLL_BUFFER_PX;
  }

  const anchor = stack[0];
  const stickyTop = Number.parseFloat(getComputedStyle(anchor).top) || 0;
  const stackHeight = stack.reduce((total, element) => total + element.offsetHeight, 0);
  return stickyTop + stackHeight + SCROLL_BUFFER_PX;
}

/** Line used by TOC scroll spy while scrolling (sticky UI currently in view). */
export function getArticleScrollSpyLine(): number {
  const navBottom = navElement()?.getBoundingClientRect().bottom ?? 0;
  let offset = navBottom;

  for (const element of stickyStackElements()) {
    const rect = element.getBoundingClientRect();
    if (rect.top <= navBottom + 1) offset = Math.max(offset, rect.bottom);
  }

  if (offset <= navBottom + SCROLL_BUFFER_PX) {
    return getArticleScrollMargin();
  }

  return offset + SCROLL_BUFFER_PX;
}

export function applyArticleScrollOffset(root: ParentNode = document) {
  const layout = root.querySelector('.article-layout:is(.has-toc, .has-rail)');
  const article = layout?.closest<HTMLElement>('article');
  if (!article) return;

  const scrollMargin = getArticleScrollMargin();
  article.style.setProperty('--article-scroll-offset', `${scrollMargin}px`);
  article.style.setProperty('--article-sticky-bottom', `${scrollMargin - SCROLL_BUFFER_PX}px`);
}

export function initArticleScrollOffset(root: ParentNode = document): (() => void) | null {
  if (!root.querySelector('.article-layout:is(.has-toc, .has-rail)')) return null;

  const refresh = () => applyArticleScrollOffset(root);
  refresh();

  window.addEventListener('resize', refresh, { passive: true });

  let resizeObserver: ResizeObserver | null = null;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(refresh);
    for (const selector of ['.article-chrome', '.article-rail', '.project-headline', '.article-headline', '.desktop-nav', '.mobile-topbar']) {
      const element = root.querySelector(selector);
      if (element) resizeObserver.observe(element);
    }
  }

  return () => {
    window.removeEventListener('resize', refresh);
    resizeObserver?.disconnect();
  };
}
