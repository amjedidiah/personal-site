import { setListingYearStickyTop } from './listing-sticky-top';

export type ListingTimelineYearSpyConfig = {
  listingRoot: string;
  viewsToSkip: Array<'list' | 'explore'>;
  exploreJumpEvent?: string;
  exploreSelectJumpEvent?: string;
};

export function initListingTimelineYearSpy(config: ListingTimelineYearSpyConfig) {
  const listingRoot = document.querySelector<HTMLElement>(config.listingRoot);
  if (!listingRoot) return;

  const yearGroups = Array.from(document.querySelectorAll<HTMLElement>('.year-group'));
  const yearLabels = yearGroups.map((group) => group.querySelector<HTMLElement>('.year-label'));
  const yearLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.year-nav a'));
  const mobileView = window.matchMedia('(max-width: 639px)');
  let activeFrame = 0;
  let lastActiveYear: string | undefined;

  const syncYearHighlight = () => {
    const active = yearLinks.find((link) => link.classList.contains('is-active'));
    const nav = active?.parentElement;
    if (!active || !nav) return;
    nav.style.setProperty('--jump-highlight-width', `${active.offsetWidth}px`);
    nav.style.setProperty('--jump-highlight-x', `${active.offsetLeft}px`);
    nav.style.setProperty('--jump-highlight-y', `${active.offsetTop + active.offsetHeight - 1}px`);
  };

  const activateLatestVisibleYear = () => {
    const latestVisibleGroup = yearGroups.find((group) => !group.hidden);
    const activeYear = latestVisibleGroup?.querySelector<HTMLElement>('.year-label')?.textContent?.trim();
    if (!activeYear) return;
    yearLinks.forEach((link) => {
      link.classList.toggle('is-active', link.hash === `#year-${activeYear}`);
    });
    syncYearHighlight();
  };

  const shouldTrackYear = () => {
    const view = listingRoot.dataset.view;
    return view !== undefined && !config.viewsToSkip.includes(view as 'list' | 'explore');
  };

  const updateActiveYear = () => {
    activeFrame = 0;
    if (!yearGroups.length || !shouldTrackYear()) return;
    const visibleYearGroups = yearGroups.filter((group) => !group.hidden);
    if (!visibleYearGroups.length) return;

    const stickyHeader = listingRoot.querySelector<HTMLElement>('[data-listing-header]')
      ?? document.querySelector<HTMLElement>('.header-controls');
    if (!stickyHeader) return;
    const stickyTop = setListingYearStickyTop(listingRoot, stickyHeader, mobileView.matches);
    const marker = Math.max(stickyHeader.getBoundingClientRect().bottom, stickyTop) + 12;
    const activeIndex = visibleYearGroups.findIndex((group) => {
      const bounds = group.getBoundingClientRect();
      return bounds.top <= marker && bounds.bottom > marker;
    });
    const fallbackIndex = visibleYearGroups.findIndex((group) => group.getBoundingClientRect().top > marker);
    const index = activeIndex >= 0 ? activeIndex : fallbackIndex >= 0 ? fallbackIndex : visibleYearGroups.length - 1;
    const activeGroup = visibleYearGroups[index];
    const activeYear = activeGroup.querySelector<HTMLElement>('.year-label')?.textContent?.trim();

    const mobileYears = window.matchMedia('(max-width: 520px)').matches;
    yearLabels.forEach((label) => {
      if (!label) return;
      const group = label.closest<HTMLElement>('.year-group');
      label.classList.toggle('is-active', group === activeGroup);
      const labelTop = label.getBoundingClientRect().top;
      const groupTop = group?.getBoundingClientRect().top ?? 0;
      label.classList.toggle(
        'is-stuck',
        mobileYears
          && shouldTrackYear()
          && groupTop < stickyTop
          && Math.abs(labelTop - stickyTop) < 1
          && group === activeGroup,
      );
    });
    yearLinks.forEach((link) => {
      link.classList.toggle('is-active', link.hash === `#year-${activeYear}`);
    });
    syncYearHighlight();
    if (activeYear !== lastActiveYear) {
      lastActiveYear = activeYear;
      listingRoot.dispatchEvent(new Event('listingyearchange'));
    }
  };

  const requestActiveYearUpdate = () => {
    if (activeFrame) return;
    activeFrame = window.requestAnimationFrame(updateActiveYear);
  };

  yearLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (listingRoot.dataset.view !== 'explore' || !config.exploreJumpEvent) return;
      event.preventDefault();
      const year = link.hash.replace('#year-', '');
      listingRoot.dispatchEvent(new CustomEvent(config.exploreJumpEvent, { detail: year }));
      yearLinks.forEach((item) => item.classList.toggle('is-active', item === link));
      syncYearHighlight();
      window.history.replaceState({}, '', link.hash);
    });
  });

  if (config.exploreSelectJumpEvent) {
    listingRoot.addEventListener(config.exploreSelectJumpEvent, (event) => {
      if (listingRoot.dataset.view !== 'explore') return;
      const year = String((event as CustomEvent<string>).detail);
      yearLinks.forEach((link) => link.classList.toggle('is-active', link.hash === `#year-${year}`));
      syncYearHighlight();
    });
  }

  window.addEventListener('scroll', requestActiveYearUpdate, { passive: true });
  window.addEventListener('resize', requestActiveYearUpdate, { passive: true });

  const remeasureStickyTop = () => {
    const stickyHeader = listingRoot.querySelector<HTMLElement>('[data-listing-header]')
      ?? document.querySelector<HTMLElement>('.header-controls');
    if (stickyHeader) setListingYearStickyTop(listingRoot, stickyHeader, mobileView.matches);
  };

  listingRoot.addEventListener('listingheaderlayout', () => {
    remeasureStickyTop();
    requestActiveYearUpdate();
  });

  return {
    syncYearHighlight,
    activateLatestVisibleYear,
    requestActiveYearUpdate,
    remeasureStickyTop,
    refreshYearNavLinks: () => {
      yearGroups.forEach((group) => group); // keep reference fresh after filter
    },
    updateYearLinkDisabledState: (getGroupHidden: (hash: string) => boolean) => {
      yearLinks.forEach((link) => {
        const disabled = getGroupHidden(link.hash);
        link.classList.toggle('is-disabled', disabled);
        link.setAttribute('aria-disabled', String(disabled));
        link.tabIndex = disabled ? -1 : 0;
      });
    },
  };
}
