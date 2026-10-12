import { observeReducedMotion, prefersReducedMotion } from './motion';

// The homepage owns this single sequence. The rendered composition is complete
// without JavaScript; no opacity gate delays text, images or contact controls.
const hero = document.querySelector<HTMLElement>('.hero');
const flow = hero?.querySelector<HTMLElement>('.production-flow');

if (hero && flow) {
  const lifecycle = new AbortController();
  const entrance: Animation[] = [];
  let entranceComplete = true;
  let flowVisible = false;
  let pageActive = true;

  const syncAmbient = () => {
    if (prefersReducedMotion()) {
      delete flow.dataset.ambient;
      return;
    }
    flow.dataset.ambient = entranceComplete && flowVisible && pageActive
      && document.visibilityState === 'visible' ? 'running' : 'paused';
  };

  const cancelEntrance = () => entrance.forEach((animation) => animation.cancel());

  if (!prefersReducedMotion() && document.visibilityState === 'visible'
    && hero.getBoundingClientRect().bottom > 0 && typeof hero.animate === 'function') {
    const sequence = [
      { selector: '.hero-frame-inner', from: 'translateX(-10px)', duration: 600, delay: 0 },
      { selector: '.hero-artwork', from: 'translateX(10px) scale(.985)', duration: 660, delay: 0 },
      { selector: '.hero-copy', from: 'translateY(8px)', duration: 560, delay: 80 },
    ];
    entranceComplete = false;
    for (const part of sequence) {
      const target = hero.querySelector<HTMLElement>(part.selector);
      if (!target) continue;
      const animation = target.animate([
        { transform: part.from }, { transform: 'none' },
      ], {
        duration: part.duration, delay: part.delay,
        easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards',
      });
      animation.id = 'hero-entrance';
      entrance.push(animation);
    }
    // Cancellation is an expected outcome when preferences or visibility change.
    void Promise.allSettled(entrance.map((animation) => animation.finished)).then(() => {
      entrance.length = 0;
      entranceComplete = true;
      if (!lifecycle.signal.aborted) syncAmbient();
    });
  }

  // Unsupported observation keeps the ambient effect paused rather than running
  // unseen. There is no scroll listener or requestAnimationFrame rendering loop.
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([entry]) => {
      flowVisible = entry.isIntersecting;
      syncAmbient();
    }) : null;
  observer?.observe(flow);

  observeReducedMotion(() => {
    if (prefersReducedMotion()) cancelEntrance();
    syncAmbient();
  }, lifecycle.signal);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') cancelEntrance();
    syncAmbient();
  }, { signal: lifecycle.signal });

  window.addEventListener('pagehide', (event) => {
    pageActive = false;
    cancelEntrance();
    syncAmbient();
    if (!event.persisted) {
      observer?.disconnect();
      lifecycle.abort();
    }
  }, { signal: lifecycle.signal });
  // Restoring a browser-history snapshot resumes ambient motion without replaying
  // the entrance or replacing the native navigation/scroll restoration behavior.
  window.addEventListener('pageshow', () => {
    pageActive = true;
    syncAmbient();
  }, { signal: lifecycle.signal });
  syncAmbient();
}
