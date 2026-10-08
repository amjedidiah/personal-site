/** Portrait entrance, diagram traces, and subtle pan — no expertise captions. */
const mounts = new Map<HTMLElement, () => void>();

function mountHero(host: HTMLElement): () => void {
  const portrait = host.querySelector<HTMLElement>('[data-portrait-stage]');
  const hero = host.closest<HTMLElement>('.hero');
  if (!portrait || !hero) return () => {};

  const listeners = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const animations = new Map<Element, Animation>();
  const poster = host.querySelector<HTMLImageElement>('.portrait-poster');
  const showPosterState = () => {
    host.dataset.posterState = poster?.naturalWidth ? 'ready' : 'error';
  };
  poster?.addEventListener('load', showPosterState, { signal: listeners.signal });
  poster?.addEventListener('error', showPosterState, { signal: listeners.signal });
  if (poster?.complete) showPosterState();
  let panFrame = 0;
  let entered = false;
  const mode = host.dataset.mode ?? '0';

  function animate(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
    animations.get(element)?.cancel();
    if (motion.matches || !element.animate) return;
    const animation = element.animate(frames, options);
    animations.set(element, animation);
    animation.onfinish = () => {
      if (animations.get(element) === animation) animations.delete(element);
    };
  }

  function drawConnections(entrance = false) {
    for (const path of host.querySelectorAll(`[data-system-diagram="${mode}"] [data-system-trace]`)) {
      animate(path, [
        { strokeDasharray: '1', strokeDashoffset: '1' },
        { strokeDasharray: '1', strokeDashoffset: '0' },
      ], { duration: entrance ? 650 : 400, delay: entrance ? 350 : 0, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' });
    }
  }

  function resetPan() {
    cancelAnimationFrame(panFrame);
    panFrame = 0;
    portrait.style.removeProperty('--portrait-pan-x');
    portrait.style.removeProperty('--portrait-pan-y');
  }

  const entrance = new IntersectionObserver((entries) => {
    if (entered || !entries.some((entry) => entry.isIntersecting)) return;
    entered = true;
    entrance.disconnect();
    animate(portrait, [
      { opacity: .75, clipPath: 'inset(0 0 12% 0)' },
      { opacity: 1, clipPath: 'inset(0)' },
    ], { duration: 700, easing: 'cubic-bezier(.16, 1, .3, 1)' });
    drawConnections(true);
  }, { threshold: .15 });
  entrance.observe(portrait);

  hero.addEventListener('pointermove', (event) => {
    if (motion.matches || !finePointer.matches || event.pointerType === 'touch' || document.hidden) return;
    cancelAnimationFrame(panFrame);
    panFrame = requestAnimationFrame(() => {
      panFrame = 0;
      const bounds = hero.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
      portrait.style.setProperty('--portrait-pan-x', `${x * 4}px`);
      portrait.style.setProperty('--portrait-pan-y', `${y * 3}px`);
    });
  }, { passive: true, signal: listeners.signal });
  hero.addEventListener('pointerleave', resetPan, { signal: listeners.signal });
  finePointer.addEventListener('change', resetPan, { signal: listeners.signal });
  motion.addEventListener('change', () => {
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    resetPan();
  }, { signal: listeners.signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
    resetPan();
  }, { signal: listeners.signal });

  return () => {
    listeners.abort();
    entrance.disconnect();
    resetPan();
    for (const animation of animations.values()) animation.cancel();
    animations.clear();
  };
}

function initializeHeroes() {
  for (const host of document.querySelectorAll<HTMLElement>('[data-hero-scene]')) {
    if (!mounts.has(host)) mounts.set(host, mountHero(host));
  }
}
function destroyHeroes() {
  for (const cleanup of mounts.values()) cleanup();
  mounts.clear();
}

initializeHeroes();
document.addEventListener('astro:page-load', initializeHeroes);
document.addEventListener('astro:before-swap', destroyHeroes);
window.addEventListener('pagehide', destroyHeroes);
window.addEventListener('pageshow', initializeHeroes);
if (import.meta.hot) import.meta.hot.dispose(() => {
  destroyHeroes();
  document.removeEventListener('astro:page-load', initializeHeroes);
  document.removeEventListener('astro:before-swap', destroyHeroes);
  window.removeEventListener('pagehide', destroyHeroes);
  window.removeEventListener('pageshow', initializeHeroes);
});
