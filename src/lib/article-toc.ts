import { applyArticleScrollOffset, getArticleScrollSpyLine, initArticleScrollOffset } from './article-scroll-offset';

export const ARTICLE_TOC_OVERVIEW_ID = 'overview';

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
    const target = link ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null;
    if (!target) return;
    if (compact.matches && disclosure) disclosure.open = false;
    applyArticleScrollOffset();
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    if (target.id === ARTICLE_TOC_OVERVIEW_ID) {
      // The headline is sticky: its current rectangle is not its original
      // document position. Anchor Overview to the start of the article grid.
      const layout = target.closest<HTMLElement>('.article-layout');
      if (!layout) return;
      event.preventDefault();
      const nav = Array.from(document.querySelectorAll<HTMLElement>('.desktop-nav, .mobile-topbar'))
        .find((element) => element.offsetHeight > 0);
      const top = layout.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight ?? 56);
      if (location.hash !== `#${ARTICLE_TOC_OVERVIEW_ID}`) history.pushState(null, '', link!.hash);
      window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !compact.matches || !disclosure?.open) return;
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
    links.forEach((link) => {
      const active = id !== null && link.hash === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const activeLink = links.find((link) => link.getAttribute('aria-current') === 'location');
    if (currentLabel) currentLabel.textContent = activeLink?.textContent ?? 'Overview';

    if (!syncHash) return;
    if (!id) {
      if (location.hash) {
        history.replaceState(null, '', `${location.pathname}${location.search}`);
      }
      return;
    }
    const nextHash = `#${id}`;
    if (location.hash !== nextHash) {
      history.replaceState(null, '', `${location.pathname}${location.search}${nextHash}`);
    }
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
      if (section.getBoundingClientRect().top <= scrollOffset) current = section.id;
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
