import { applyArticleScrollOffset, getArticleScrollSpyLine, initArticleScrollOffset } from './article-scroll-offset';
import { prefersReducedMotion } from './motion';
import { clientStrings } from '../i18n/client';

export const ARTICLE_TOC_OVERVIEW_ID = 'overview';

function setLinkActiveState(links: HTMLAnchorElement[], id: string | null) {
  for (const link of links) {
    const active = id !== null && link.hash === `#${id}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function updateTocCurrentLabel(links: HTMLAnchorElement[], currentLabel: Element | null) {
  if (!currentLabel) return;
  const activeLink = links.find((link) => link.getAttribute('aria-current') === 'location');
  currentLabel.textContent = activeLink?.textContent ?? clientStrings().article.overview;
}

function shouldCloseTocOnEscape(
  event: KeyboardEvent,
  compact: MediaQueryList,
  disclosure: HTMLDetailsElement | null,
): disclosure is HTMLDetailsElement {
  if (event.key !== 'Escape') return false;
  if (!compact.matches) return false;
  return disclosure?.open === true;
}

function syncTocHash(id: string | null) {
  if (!id) {
    if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`);
    return;
  }
  const nextHash = `#${id}`;
  if (location.hash !== nextHash) {
    history.replaceState(null, '', `${location.pathname}${location.search}${nextHash}`);
  }
}

function visibleNavHeight(): number {
  const nav = Array.from(document.querySelectorAll<HTMLElement>('.desktop-nav, .mobile-topbar'))
    .find((element) => element.offsetHeight > 0);
  return nav?.offsetHeight ?? 56;
}

function prepareTocTarget(target: HTMLElement) {
  applyArticleScrollOffset();
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

function closeTocDisclosure(compact: MediaQueryList, disclosure: HTMLDetailsElement | null) {
  if (compact.matches && disclosure) disclosure.open = false;
}

function navigateToArticleOverview(event: MouseEvent, target: HTMLElement, link: HTMLAnchorElement) {
  const layout = target.closest<HTMLElement>('.article-layout');
  if (!layout) return;
  event.preventDefault();
  const top = layout.getBoundingClientRect().top + window.scrollY - visibleNavHeight();
  if (location.hash !== `#${ARTICLE_TOC_OVERVIEW_ID}`) history.pushState(null, '', link.hash);
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
}

let teardownArticleToc: (() => void) | null = null;

export function initArticleToc() {
  teardownArticleToc?.();
  teardownArticleToc = null;

  const toc = document.querySelector<HTMLElement>('[data-article-toc]');
  if (!toc) {
    teardownArticleToc = initArticleScrollOffset();
    return;
  }

  const disclosure = toc.querySelector('details');
  const summary = toc.querySelector('summary');
  const currentLabel = toc.querySelector('[data-toc-current]');
  const compact = window.matchMedia('(max-width: 800px)');
  const syncDisclosure = () => { if (disclosure) disclosure.open = !compact.matches; };
  syncDisclosure();
  compact.addEventListener('change', syncDisclosure);

  const onClick = (event: MouseEvent) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-toc-link]');
    if (!link) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    closeTocDisclosure(compact, disclosure);
    prepareTocTarget(target);
    if (target.id === ARTICLE_TOC_OVERVIEW_ID) {
      // The headline is sticky: its current rectangle is not its original
      // document position. Anchor Overview to the start of the article grid.
      navigateToArticleOverview(event, target, link);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!shouldCloseTocOnEscape(event, compact, disclosure)) return;
    disclosure.open = false;
    summary?.focus({ preventScroll: true });
  };
  toc.addEventListener('click', onClick);
  toc.addEventListener('keydown', onKeyDown);

  const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('a[data-toc-link]'));
  const sections = links
    .map((link) => {
      const id = link.getAttribute('href')?.slice(1);
      return id ? document.getElementById(id) : null;
    })
    .filter((section): section is HTMLElement => section !== null);

  if (sections.length === 0) return;

  const headingSections = sections.filter((section) => section.id !== ARTICLE_TOC_OVERVIEW_ID);
  const teardownScrollOffset = initArticleScrollOffset();
  let scrollFrame = 0;

  const setActive = (id: string | null, syncHash = false) => {
    setLinkActiveState(links, id);
    updateTocCurrentLabel(links, currentLabel);
    if (syncHash) syncTocHash(id);
  };

  const activeSectionId = () => {
    if (headingSections.length === 0) {
      return sections.some((section) => section.id === ARTICLE_TOC_OVERVIEW_ID) ? ARTICLE_TOC_OVERVIEW_ID : null;
    }

    const scrollOffset = getArticleScrollSpyLine();

    if (headingSections[0].getBoundingClientRect().top > scrollOffset) {
      return ARTICLE_TOC_OVERVIEW_ID;
    }

    let current = headingSections[0].id;
    for (const section of headingSections) {
      // Native fragment scrolling rounds to device pixels; keep the chosen
      // section active when it lands fractionally below the measured line.
      if (section.getBoundingClientRect().top <= scrollOffset + 1) current = section.id;
    }
    return current;
  };

  const updateFromScroll = () => {
    scrollFrame = 0;
    setActive(activeSectionId(), true);
  };

  const onScroll = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(updateFromScroll);
  };

  const onHashChange = () => {
    const id = location.hash.slice(1);
    if (sections.some((section) => section.id === id)) setActive(id, false);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('hashchange', onHashChange);

  teardownArticleToc = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('hashchange', onHashChange);
    teardownScrollOffset?.();
    cancelAnimationFrame(scrollFrame);
    compact.removeEventListener('change', syncDisclosure);
    toc.removeEventListener('click', onClick);
    toc.removeEventListener('keydown', onKeyDown);
  };

  const initialId = location.hash.slice(1);
  if (initialId && sections.some((section) => section.id === initialId)) {
    setActive(initialId, false);
  } else {
    // Do not manufacture an initial fragment: browsers may jump to it while
    // completing the first navigation, moving the title out of view.
    setActive(activeSectionId(), false);
  }
}
