export const MOTION_STORAGE_KEY = 'amjed-motion';
export const MOTION_CHANGE_EVENT = 'motionchange';
export type MotionPreference = 'system' | 'reduce';

/** Only routes whose motion treatment has been implemented expose the control. */
export function supportsMotionPreference(pathname: string): boolean {
  return pathname === '/' || ['/about', '/projects', '/blog'].includes(pathname.replace(/\/+$/, ''))
    || /^\/(?:blog|projects)\/[^/]+\/?$/.test(pathname);
}

export function readMotionPreference(storage?: Pick<Storage, 'getItem'> | null): MotionPreference {
  try { return storage?.getItem(MOTION_STORAGE_KEY) === 'reduce' ? 'reduce' : 'system'; }
  catch { return 'system'; }
}

export function writeMotionPreference(storage: Storage | null, value: MotionPreference) {
  try {
    if (value === 'system') storage?.removeItem(MOTION_STORAGE_KEY);
    else storage?.setItem(MOTION_STORAGE_KEY, value);
  } catch { /* Preferences also work when storage is blocked. */ }
}

export function prefersReducedMotion(): boolean {
  return document.documentElement.dataset.motion === 'reduce'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Watch both the operating-system preference and the site's optional override. */
export function observeReducedMotion(callback: () => void, signal?: AbortSignal) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback, { signal });
  document.addEventListener(MOTION_CHANGE_EVENT, callback, { signal });
  return () => {
    media.removeEventListener('change', callback);
    document.removeEventListener(MOTION_CHANGE_EVENT, callback);
  };
}
