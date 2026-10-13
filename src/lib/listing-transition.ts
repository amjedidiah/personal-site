// Keep controls live while only the archive changes. Unsupported browsers and
// reduced-motion users get the same synchronous state update without animation.
import { observeReducedMotion, prefersReducedMotion } from './motion';

let activeTransition: ViewTransition | undefined;
let clearActiveItems = () => {};
let pendingUpdate: (() => void) | undefined;
let updateRevision = 0;

function isOffViewport(bounds: DOMRect): boolean {
  return bounds.bottom < 0 || bounds.top > window.innerHeight;
}

function shouldLimitItemTransitionsToViewport(root: HTMLElement | null, itemCount: number): boolean {
  return root?.hasAttribute('data-listing-viewport-transitions') === true || itemCount > 24;
}

function shouldSkipListingItemNaming(bounds: DOMRect, key: string, usedKeys: Set<string>): boolean {
  if (bounds.width === 0) return true;
  if (bounds.height === 0) return true;
  return usedKeys.has(key);
}

observeReducedMotion(() => {
  if (prefersReducedMotion()) activeTransition?.skipTransition();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) activeTransition?.skipTransition();
});

export function transitionListing(root: HTMLElement | null, update: () => void, options: { items?: boolean } = {}) {
  const results = root?.querySelector<HTMLElement>('[data-listing-results]');
  const revision = ++updateRevision;
  if (activeTransition) {
    activeTransition.skipTransition();
    clearActiveItems();
    results?.style.removeProperty('view-transition-name');
    document.documentElement.classList.remove('listing-transition');
    // Preserve earlier changes (e.g. type before platform) but never make the
    // next choice wait behind snapshot capture. The old callback is invalidated.
    const pending = pendingUpdate;
    pendingUpdate = undefined;
    pending?.();
    update();
    return;
  }
  if (!results || !document.startViewTransition || prefersReducedMotion()
    || root?.querySelector('[data-listing-filter-sheet][open]')) {
    update();
    return;
  }

  const items = root?.hasAttribute('data-listing-item-transitions') && options.items !== false
    ? Array.from(results.querySelectorAll<HTMLElement>('[data-listing-key]')) : [];
  const names = new Map<string, string>();
  for (const item of items) {
    const key = item.dataset.listingKey ?? '';
    if (!names.has(key)) names.set(key, `listing-item-${names.size}`);
  }
  const clearItems = () => {
    for (const item of items) {
      item.style.removeProperty('view-transition-name');
      item.style.removeProperty('view-transition-class');
    }
  };
  const nameVisibleItems = () => {
    clearItems();
    const used = new Set<string>();
    for (const item of items) {
      const bounds = item.getBoundingClientRect();
      const key = item.dataset.listingKey ?? '';
      if (shouldSkipListingItemNaming(bounds, key, used)) continue;
      // Small portfolios can move rows into view from their actual old position.
      // Bound snapshot work to the viewport if the archive grows much larger.
      if (shouldLimitItemTransitionsToViewport(root, names.size) && isOffViewport(bounds)) continue;
      used.add(key);
      item.style.viewTransitionName = names.get(key) ?? 'none';
      item.style.setProperty('view-transition-class', 'listing-item');
    }
  };
  nameVisibleItems();
  clearActiveItems = clearItems;
  results.style.viewTransitionName = 'listing-results';
  document.documentElement.classList.add('listing-transition');
  pendingUpdate = update;
  const transition = document.startViewTransition(() => {
    if (revision !== updateRevision) return;
    const pending = pendingUpdate;
    pendingUpdate = undefined;
    pending?.();
    nameVisibleItems();
  });
  activeTransition = transition;
  // A skipped snapshot is expected when visitors make another choice quickly.
  void transition.ready.catch(() => {});
  void transition.finished.catch(() => {}).then(() => {
    if (activeTransition !== transition) return;
    results.style.removeProperty('view-transition-name');
    document.documentElement.classList.remove('listing-transition');
    clearItems();
    clearActiveItems = () => {};
    activeTransition = undefined;
  });
}

export function focusListingRecovery(root: HTMLElement | null, selector: string) {
  const filter = root?.querySelector<HTMLElement>(selector);
  const target = filter?.getClientRects().length
    ? filter
    : root?.querySelector<HTMLElement>('[data-listing-expand]');
  target?.focus({ preventScroll: true });
}
