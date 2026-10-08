// Keep controls live while only the archive changes. Unsupported browsers and
// reduced-motion users get the same synchronous state update without animation.
let activeTransition: ViewTransition | undefined;

export function transitionListing(root: HTMLElement | null, update: () => void) {
  const results = root?.querySelector<HTMLElement>('[data-listing-results]');
  if (!results || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }

  activeTransition?.skipTransition();
  results.style.viewTransitionName = 'listing-results';
  const transition = document.startViewTransition(update);
  activeTransition = transition;
  // A skipped snapshot is expected when visitors make another choice quickly.
  void transition.ready.catch(() => {});
  void transition.finished.catch(() => {}).then(() => {
    if (activeTransition !== transition) return;
    results.style.removeProperty('view-transition-name');
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
