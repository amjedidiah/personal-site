import { setListingYearStickyTop } from './listing-sticky-top';
import { clientStrings } from '../i18n/client';

export type ListingHeaderCollapseOptions = {
  listingRoot: string;
  getSummary: () => string;
  onLayoutChange?: () => void;
  collapseOnMobile?: boolean;
  openMobileFilters?: () => boolean;
  isMobileFiltersOpen?: () => boolean;
};

export function initListingHeaderCollapse(options: ListingHeaderCollapseOptions) {
  const listingRoot = document.querySelector<HTMLElement>(options.listingRoot);
  if (!listingRoot) return;

  const header = listingRoot.querySelector<HTMLElement>('[data-listing-header]');
  const stuckSentinel = listingRoot.querySelector<HTMLElement>('[data-listing-header-sentinel]');
  const summaryEl = listingRoot.querySelector<HTMLElement>('[data-listing-summary]');
  const expandBtn = listingRoot.querySelector<HTMLButtonElement>('[data-listing-expand]');
  const expandable = listingRoot.querySelector<HTMLElement>('#listing-header-expandable');
  if (!header || !summaryEl || !expandBtn || !expandable) return;

  const mobileView = window.matchMedia('(max-width: 639px)');
  let panelOpen = false;
  let collapsed = header.classList.contains('is-collapsed');
  let stuck = false;
  let syncFrame = 0;
  let scrollSpacer: HTMLDivElement | null = null;
  const headerHeight = () => header.getBoundingClientRect().height;
  let expandedHeaderHeight = headerHeight();

  const setScrollSpacerHeight = (height: number) => {
    if (height <= 0) {
      scrollSpacer?.remove();
      scrollSpacer = null;
      return;
    }
    if (!scrollSpacer) {
      scrollSpacer = document.createElement('div');
      scrollSpacer.dataset.headerCollapseScrollSpacer = '';
      scrollSpacer.setAttribute('aria-hidden', 'true');
      scrollSpacer.className = 'listing-header-scroll-spacer';
      // Keep the results in place. A spacer at the end of the listing lets
      // scroll anchoring move the sentinel when the header collapses, which
      // can repeatedly expand and collapse the header on short result sets.
      header.after(scrollSpacer);
    }
    scrollSpacer.style.height = `${height}px`;
  };

  const syncScrollSpacer = () => {
    // An intentionally closed mobile panel should give space to the results.
    if (options.collapseOnMobile && mobileView.matches) {
      setScrollSpacerHeight(0);
      return;
    }
    const height = headerHeight();
    if (!collapsed) {
      expandedHeaderHeight = height;
    }
    setScrollSpacerHeight(collapsed ? Math.max(0, expandedHeaderHeight - height) : 0);
  };

  const refreshSummary = () => {
    summaryEl.textContent = options.getSummary();
  };

  const stickyTopPx = () => Number.parseFloat(getComputedStyle(header).top) || 0;

  const isHeaderStuck = () => {
    if (getComputedStyle(header).position !== 'sticky') return false;
    const threshold = stickyTopPx() + 0.5;
    if (stuckSentinel) {
      return stuckSentinel.getBoundingClientRect().bottom <= threshold;
    }
    return header.getBoundingClientRect().top <= threshold;
  };

  const notifyLayout = () => {
    setListingYearStickyTop(listingRoot, header, mobileView.matches);
    options.onLayoutChange?.();
    listingRoot.dispatchEvent(new Event('listingheaderlayout'));
  };

  const syncChrome = () => {
    const nextStuck = isHeaderStuck();
    // Scrolling must not remove the control a keyboard user is operating.
    const focusedControl = header.querySelector('.header-toolbar')?.contains(document.activeElement)
      || header.querySelector('.header-filters')?.contains(document.activeElement);
    const shouldCollapse = nextStuck || Boolean(options.collapseOnMobile && mobileView.matches);
    if (shouldCollapse && focusedControl) panelOpen = true;

    if (!shouldCollapse && panelOpen) {
      panelOpen = false;
    }

    const nextCollapsed = shouldCollapse;
    const stateUnchanged =
      nextStuck === stuck
      && nextCollapsed === collapsed
      && header.classList.contains('is-pinned') === panelOpen;

    if (stateUnchanged) return;

    if (!collapsed) expandedHeaderHeight = headerHeight();

    stuck = nextStuck;
    collapsed = nextCollapsed;

    header.classList.toggle('is-stuck', stuck);
    header.classList.toggle('is-collapsed', collapsed);
    header.classList.toggle('is-pinned', panelOpen);
    expandBtn.setAttribute('aria-expanded', String(panelOpen || Boolean(options.isMobileFiltersOpen?.())));
    expandBtn.textContent = panelOpen ? clientStrings().listing.close : clientStrings().listing.filters;

    syncScrollSpacer();
    lastHeaderHeight = headerHeight();

    notifyLayout();
  };

  const scheduleSync = () => {
    if (syncFrame) return;
    syncFrame = window.requestAnimationFrame(() => {
      syncFrame = 0;
      syncChrome();
    });
  };

  expandBtn.addEventListener('click', () => {
    if (mobileView.matches && options.openMobileFilters?.()) return;
    if (!collapsed) return;
    panelOpen = !panelOpen;
    syncChrome();
    refreshSummary();
    if (panelOpen) {
      const first = Array.from(expandable.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])',
      )).find((control) => control.getClientRects().length);
      first?.focus();
    }
  });

  header.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !panelOpen) return;
    expandBtn.focus({ preventScroll: true });
    panelOpen = false;
    syncChrome();
  });

  window.addEventListener('scroll', scheduleSync, { passive: true });
  window.addEventListener('resize', () => {
    if (collapsed) {
      // Measure the natural footprint at the new viewport width without
      // painting an expanded header or disturbing the current panel state.
      header.classList.remove('is-stuck', 'is-collapsed', 'is-pinned');
      expandedHeaderHeight = headerHeight();
      header.classList.toggle('is-stuck', stuck);
      header.classList.toggle('is-collapsed', collapsed);
      header.classList.toggle('is-pinned', panelOpen);
    }
    syncScrollSpacer();
    scheduleSync();
  }, { passive: true });

  let lastHeaderHeight = headerHeight();
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      const nextHeight = headerHeight();
      if (nextHeight === lastHeaderHeight) return;
      lastHeaderHeight = nextHeight;
      syncScrollSpacer();
      notifyLayout();
    });
    resizeObserver.observe(header);
  }

  listingRoot.addEventListener('listingviewchange', () => {
    panelOpen = false;
    syncScrollSpacer();
    scheduleSync();
    refreshSummary();
  });

  refreshSummary();
  scheduleSync();

  return {
    refreshSummary,
    notifyLayout,
    clearPin: () => {
      panelOpen = false;
      syncChrome();
    },
  };
}

export function dispatchListingViewChange(listingRoot: HTMLElement) {
  listingRoot.dispatchEvent(new Event('listingviewchange'));
}
