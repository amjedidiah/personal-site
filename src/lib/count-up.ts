import { observeReducedMotion, prefersReducedMotion } from './motion';

const values = Array.from(document.querySelectorAll<HTMLElement>('[data-count-up]'));

if (values.length && typeof IntersectionObserver === 'function' && !prefersReducedMotion()) {
  const lifecycle = new AbortController();
  const completed = new Set<HTMLElement>();
  const active = new Map<HTMLElement, { target: number; suffix: string; start: number }>();
  const finalText = new Map(values.map((value) => [value, value.textContent ?? '']));
  const formatter = new Intl.NumberFormat('en-GB');
  let frame = 0;

  const finish = (value: HTMLElement) => {
    value.textContent = finalText.get(value) ?? '';
    active.delete(value);
    completed.add(value);
    observer.unobserve(value);
  };
  const finishAll = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    for (const value of values) finish(value);
    observer.disconnect();
  };
  const advanceCounter = (value: HTMLElement, counter: { target: number; suffix: string; start: number }, now: number) => {
    const progress = Math.min(1, (now - counter.start) / 800);
    if (progress >= 1) {
      finish(value);
      return;
    }
    const eased = 1 - (1 - progress) ** 3;
    const display = `${formatter.format(Math.floor(counter.target * eased))}${counter.suffix}`;
    if (value.textContent !== display) value.textContent = display;
  };
  const tick = (now: number) => {
    frame = 0;
    for (const [value, counter] of active) advanceCounter(value, counter, now);
    if (active.size) frame = window.requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const value = entry.target as HTMLElement;
      if (completed.has(value)) continue;
      if (prefersReducedMotion() || document.hidden) {
        finish(value);
      } else if (entry.isIntersecting && !active.has(value)) {
        const target = Number(value.dataset.countUp);
        if (!Number.isSafeInteger(target) || target <= 0) {
          finish(value);
          continue;
        }
        const suffix = value.dataset.countSuffix ?? '';
        value.textContent = `0${suffix}`;
        active.set(value, { target, suffix, start: performance.now() });
      } else if (!entry.isIntersecting && active.has(value)) {
        finish(value);
      }
    }
    // All visible counters share one bounded rendering loop.
    if (active.size && !frame) frame = window.requestAnimationFrame(tick);
    else if (!active.size) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: .2 });
  for (const value of values) observer.observe(value);

  observeReducedMotion(() => {
    if (prefersReducedMotion()) finishAll();
  }, lifecycle.signal);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      active.forEach((_, value) => finish(value));
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { signal: lifecycle.signal });
  window.addEventListener('pagehide', (event) => {
    finishAll();
    if (!event.persisted) lifecycle.abort();
  }, { signal: lifecycle.signal });
}
