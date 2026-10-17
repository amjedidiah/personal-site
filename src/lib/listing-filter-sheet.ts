import { observeReducedMotion, prefersReducedMotion } from './motion';
import { clientStrings } from '../i18n/client';

type FilterSheetOptions = {
  getResultLabel: () => string;
  clearFilters: () => void;
};

function shouldTrackTouchMove(
  dialogOpen: boolean,
  startY: number | undefined,
  touchCount: number,
): startY is number {
  if (!dialogOpen) return false;
  if (startY === undefined) return false;
  return touchCount === 1;
}

type FilterSheetElements = {
  root: HTMLElement;
  dialog: HTMLDialogElement;
  trigger: HTMLButtonElement;
  body: HTMLElement;
  results: HTMLButtonElement;
  filters: HTMLElement;
  sort: HTMLElement | null;
};

function getFilterSheetElements(root: HTMLElement | null): FilterSheetElements | null {
  if (!root) return null;
  const dialog = root.querySelector<HTMLDialogElement>('[data-listing-filter-sheet]');
  if (!dialog || typeof dialog.showModal !== 'function') return null;
  const trigger = root.querySelector<HTMLButtonElement>('[data-listing-expand]');
  const body = dialog.querySelector<HTMLElement>('[data-filter-sheet-body]');
  const results = dialog.querySelector<HTMLButtonElement>('[data-filter-sheet-results]');
  const filters = root.querySelector<HTMLElement>('[data-listing-filter-controls]');
  if (!trigger) return null;
  if (!body) return null;
  if (!results) return null;
  if (!filters) return null;
  return {
    root,
    dialog,
    trigger,
    body,
    results,
    filters,
    sort: root.querySelector<HTMLElement>('.list-sort-nav'),
  };
}

// Move the existing controls into the top layer only while open. Their event
// handlers, selection state, URL handling and desktop layout stay shared.
export function initListingFilterSheet(initialRoot: HTMLElement | null, options: FilterSheetOptions) {
  const sheet = getFilterSheetElements(initialRoot);
  if (!sheet) return;
  const { root, dialog, trigger, body, results, filters, sort } = sheet;

  const mobile = window.matchMedia('(max-width: 639px)');
  const inlineControls = trigger.getAttribute('aria-controls') ?? '';
  const abort = new AbortController();
  const { signal } = abort;
  let entrance: Animation | undefined;
  let scrollPosition = { left: 0, top: 0 };
  let moved: Array<{ node: HTMLElement; marker: Comment }> = [];

  const notifyLayout = () => root.dispatchEvent(new Event('listingheaderlayout'));
  const refreshResults = () => {
    results.textContent = clientStrings().listing.showResults(options.getResultLabel());
  };
  const syncTrigger = () => {
    trigger.setAttribute('aria-controls', mobile.matches ? dialog.id : inlineControls);
    if (mobile.matches) trigger.setAttribute('aria-haspopup', 'dialog');
    else trigger.removeAttribute('aria-haspopup');
  };
  const cancelEntrance = () => {
    entrance?.cancel();
    entrance = undefined;
  };
  const putControlsBack = () => {
    for (const { node, marker } of moved) marker.replaceWith(node);
    moved = [];
    trigger.setAttribute('aria-expanded', 'false');
    notifyLayout();
  };
  const restoreScrollPosition = () => {
    window.scrollTo({ ...scrollPosition, behavior: 'instant' });
  };
  const focusAfterClose = () => {
    if (trigger.getClientRects().length) {
      trigger.focus({ preventScroll: true });
      return;
    }
    const target = Array.from(root.querySelectorAll<HTMLElement>('[data-listing-header] button, [data-listing-header] a'))
      .find((control) => control.getClientRects().length && control.getAttribute('aria-disabled') !== 'true');
    target?.focus({ preventScroll: true });
  };
  const restore = (restoreFocus = true, restoreScroll = true) => {
    cancelEntrance();
    if (!moved.length) return;
    putControlsBack();
    if (restoreScroll) restoreScrollPosition();
    if (restoreFocus) focusAfterClose();
  };
  const close = (restoreFocus = true, restoreScroll = true) => {
    if (dialog.open) dialog.close();
    restore(restoreFocus, restoreScroll);
  };
  const open = () => {
    if (!mobile.matches) return false;
    if (dialog.open) return true;
    scrollPosition = { left: window.scrollX, top: window.scrollY };
    const move = (node: HTMLElement | null | undefined, destination: string) => {
      const host = dialog.querySelector(destination);
      if (!node || !host) return;
      const marker = document.createComment('filter control location');
      node.before(marker);
      moved.push({ node, marker });
      host.appendChild(node);
    };
    move(filters, '[data-filter-sheet-filters]');
    move(sort, '[data-filter-sheet-sort]');
    refreshResults();
    body.scrollTop = 0;
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    notifyLayout();
    if (!prefersReducedMotion()) {
      entrance = dialog.animate(
        [{ transform: 'translateY(16px)' }, { transform: 'translateY(0)' }],
        { duration: 220, easing: 'cubic-bezier(.16, 1, .3, 1)' },
      );
    }
    return true;
  };

  for (const button of dialog.querySelectorAll<HTMLButtonElement>('[data-filter-sheet-close]')) {
    button.addEventListener('click', () => close(), { signal });
  }
  dialog.querySelector('[data-filter-sheet-clear]')?.addEventListener('click', options.clearFilters, { signal });
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); }, { signal });
  dialog.addEventListener('close', () => { if (!dialog.open) restore(); }, { signal });
  root.addEventListener('listingfilterchange', refreshResults, { signal });
  root.addEventListener('listingviewchange', () => close(), { signal });
  mobile.addEventListener('change', () => { if (!mobile.matches) close(); syncTrigger(); }, { signal });

  // Older Safari chains gestures from non-overflowing modal containers despite
  // overscroll-behavior. Contain boundary gestures without fixing the page body;
  // allow scrolling inside the sheet and leave pinch/browser zoom available.
  const canScroll = (target: EventTarget | null, delta: number) => {
    if (!(target instanceof Node) || !body.contains(target)) return false;
    return delta > 0 ? body.scrollTop + body.clientHeight < body.scrollHeight - 1 : body.scrollTop > 0;
  };
  const shouldPreventWheel = (event: WheelEvent) => {
    if (!dialog.open) return false;
    if (event.ctrlKey) return false;
    return !canScroll(event.target, event.deltaY);
  };
  dialog.addEventListener('wheel', (event) => {
    if (shouldPreventWheel(event)) event.preventDefault();
  }, { passive: false, signal });
  let touchY: number | undefined;
  dialog.addEventListener('touchstart', (event) => {
    touchY = event.touches.length === 1 ? event.touches[0].clientY : undefined;
  }, { passive: true, signal });
  dialog.addEventListener('touchmove', (event) => {
    if (!shouldTrackTouchMove(dialog.open, touchY, event.touches.length)) return;
    const nextY = event.touches[0].clientY;
    if (!canScroll(event.target, touchY - nextY)) event.preventDefault();
    touchY = nextY;
  }, { passive: false, signal });
  observeReducedMotion(() => { if (prefersReducedMotion()) entrance?.cancel(); }, signal);
  document.addEventListener('visibilitychange', () => { if (document.hidden) entrance?.cancel(); }, { signal });
  window.addEventListener('pagehide', (event) => {
    close(false, false);
    if (!event.persisted) abort.abort();
  }, { signal });
  syncTrigger();
  root.setAttribute('data-mobile-filter-sheet', '');
  return { open, isOpen: () => dialog.open };
}
