import { observeReducedMotion, prefersReducedMotion } from './motion';

export function initListingMotion(root: HTMLElement | null, timing = { intro: 350, controls: 350 }) {
  if (!root || prefersReducedMotion() || document.visibilityState !== 'visible') return;
  const entrance: Animation[] = [];
  const lifecycle = new AbortController();
  for (const [selector, duration] of [['.header-intro', timing.intro], ['.header-controls', timing.controls]] as const) {
    const target = root.querySelector<HTMLElement>(selector);
    if (!target || typeof target.animate !== 'function') continue;
    const animation = target.animate([
      { transform: 'translateY(6px)' }, { transform: 'none' },
    ], { duration, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    animation.id = 'listing-entrance';
    entrance.push(animation);
  }
  const cancel = () => {
    for (const animation of entrance) animation.cancel();
  };
  observeReducedMotion(() => { if (prefersReducedMotion()) cancel(); }, lifecycle.signal);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); }, { signal: lifecycle.signal });
  window.addEventListener('pagehide', () => { cancel(); lifecycle.abort(); }, { once: true });
}
