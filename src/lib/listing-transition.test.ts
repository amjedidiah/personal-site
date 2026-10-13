import { expect, test } from 'bun:test';

test('interrupted filters commit in order and stale snapshot callbacks cannot overwrite them', async () => {
  const previous = ['window', 'document'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const callbacks: Array<() => void> = [];
  let finish!: () => void;
  let snapshots = 0;
  const finished = new Promise<void>((resolve) => { finish = resolve; });
  const dataset = { motion: 'system' };
  const results = {
    style: {
      viewTransitionName: '',
      removeProperty(name: string) { if (name === 'view-transition-name') this.viewTransitionName = ''; },
    },
  };
  let sheetOpen = false;
  const root = {
    querySelector: (selector: string) => selector === '[data-listing-results]' ? results : sheetOpen ? {} : null,
    hasAttribute: () => false,
  } as unknown as HTMLElement;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    documentElement: { dataset, classList: { add() {}, remove() {} } },
    addEventListener() {}, removeEventListener() {},
    startViewTransition(callback: () => void) {
      snapshots++;
      callbacks.push(callback);
      return { ready: Promise.resolve(), finished, skipTransition() {} };
    },
  } });

  try {
    const { transitionListing } = await import('./listing-transition');
    const filters = { type: 'all', platform: 'all' };
    transitionListing(root, () => { filters.type = 'client'; });
    transitionListing(root, () => { filters.platform = 'mobile'; });
    expect(filters).toEqual({ type: 'client', platform: 'mobile' });
    transitionListing(root, () => { filters.type = 'founder'; });
    expect(filters).toEqual({ type: 'founder', platform: 'mobile' });
    expect(snapshots).toBe(1);

    for (const callback of callbacks) callback();
    finish();
    await finished;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(filters).toEqual({ type: 'founder', platform: 'mobile' });
    expect(results.style.viewTransitionName).toBe('');

    // A modal hides the archive: commit choices and counts immediately, with
    // no document snapshot that could paint the background over the dialog.
    sheetOpen = true;
    transitionListing(root, () => { filters.type = 'oss'; });
    expect(filters.type).toBe('oss');
    expect(snapshots).toBe(1);
    sheetOpen = false;
    dataset.motion = 'reduce';
    transitionListing(root, () => { filters.platform = 'web'; });
    expect(filters.platform).toBe('web');
    expect(snapshots).toBe(1);
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
