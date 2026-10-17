import { currentIssueUrls, parseAvailabilityIssue } from './current-feed';
import { prefersReducedMotion, observeReducedMotion } from './motion';
import { clientStrings, pageIntlLocale, pageLocale } from '../i18n/client';

type CachedIssue = { savedAt: number; raw: unknown };
type FeedCache = { availability?: CachedIssue; retryAt?: number };
type FeedResult =
  | { kind: 'data'; value: NonNullable<ReturnType<typeof parseAvailabilityIssue>>; raw: unknown }
  | { kind: 'empty' | 'error' }
  | { kind: 'rate-limited'; retryAt: number };

const cacheKey = 'jed-current-feed-v1';
const refreshInterval = 5 * 60 * 1000;
const mounts = new Map<HTMLElement, () => void>();

async function readIssue(signal: AbortSignal, locale = pageLocale()): Promise<FeedResult> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(abort, 8000);
  try {
    const response = await fetch(currentIssueUrls.availability, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store', signal: controller.signal,
    });
    if (response.status === 404) return { kind: 'empty' };
    if (response.status === 403 || response.status === 429) {
      const now = Date.now();
      const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000;
      const retry = response.headers.get('retry-after');
      const retryAt = retry && !Number.isNaN(Number(retry))
        ? now + Number(retry) * 1000 : Date.parse(retry ?? '');
      const next = reset > now ? reset + 1000 : retryAt > now ? retryAt : now + refreshInterval;
      return { kind: 'rate-limited', retryAt: Math.min(next, now + 24 * 60 * 60 * 1000) };
    }
    if (!response.ok) return { kind: 'error' };
    const raw: unknown = await response.json();
    const value = parseAvailabilityIssue(raw, locale);
    // An invalid response is a refresh failure, not evidence that availability is unpublished.
    return value ? { kind: 'data', value, raw } : { kind: 'error' };
  } catch {
    return { kind: 'error' };
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

function mountCurrent(host: HTMLElement): () => void {
  const signals = host.querySelector<HTMLElement>('[data-current-signals]');
  const card = host.querySelector<HTMLElement>('#current-availability');
  const availability = host.querySelector<HTMLElement>('[data-current-availability]');
  const label = host.querySelector<HTMLElement>('[data-current-availability-label]');
  const detail = host.querySelector<HTMLElement>('[data-current-availability-detail]');
  const status = host.querySelector<HTMLElement>('[data-current-status]');
  const button = host.querySelector<HTMLButtonElement>('[data-current-refresh]');
  if (!signals || !card || !availability || !label || !detail || !status || !button) return () => {};

  const listeners = new AbortController();
  const locale = pageLocale();
  const copy = clientStrings(locale).status;
  const format = new Intl.DateTimeFormat(pageIntlLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fallbackStatus = host.dataset.reviewedStatus ?? `${status.textContent?.trim() ?? copy.fallback}.`;
  host.dataset.reviewedStatus = fallbackStatus;
  let lastKnownStatus = host.dataset.lastKnownStatus ?? fallbackStatus;
  let lastCheck = 0;
  let pending = false;
  let disposed = false;
  let cooldown = 0;
  let feedback: Animation | undefined;
  let cache: FeedCache = {};
  try {
    const stored: FeedCache | null = JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      const now = Date.now();
      const entry = stored.availability;
      if (entry && typeof entry.savedAt === 'number' && entry.savedAt <= now && now - entry.savedAt < 60 * 60 * 1000
        && parseAvailabilityIssue(entry.raw, locale)) cache.availability = entry;
      if (typeof stored.retryAt === 'number' && Number.isFinite(stored.retryAt) && stored.retryAt > now) {
        cache.retryAt = Math.min(stored.retryAt, now + 24 * 60 * 60 * 1000);
      }
    }
  } catch { /* Storage is optional; the rendered fallback remains usable. */ }

  const saveCache = () => {
    try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { /* Storage is optional. */ }
  };
  const showAvailability = (value: NonNullable<ReturnType<typeof parseAvailabilityIssue>>) => {
    availability.dataset.available = String(value.available);
    label.textContent = value.label;
    detail.textContent = value.detail;
  };
  const setState = (state: string, message: string) => {
    status.dataset.state = signals.dataset.state = state;
    status.textContent = message;
    card.setAttribute('aria-busy', String(state === 'loading'));
    const blocked = state === 'loading' || state === 'rate-limited' || state === 'offline';
    button.setAttribute('aria-disabled', String(blocked));
    button.textContent = state === 'loading' ? copy.button.loading : state === 'rate-limited' ? copy.button.rateLimited
      : state === 'offline' ? copy.button.offline : state === 'error' ? copy.button.error : copy.button.idle;
  };
  const showCooldown = () => {
    setState('rate-limited', copy.paused(format.format(new Date(cache.retryAt!)), lastKnownStatus));
    window.clearTimeout(cooldown);
    cooldown = window.setTimeout(() => {
      if (disposed) return;
      if (!navigator.onLine) setState('offline', copy.offline(lastKnownStatus));
      else setState('cached', copy.available(lastKnownStatus));
    }, Math.max(0, cache.retryAt! - Date.now()));
  };

  if (cache.availability) {
    showAvailability(parseAvailabilityIssue(cache.availability.raw, locale)!);
    lastCheck = cache.availability.savedAt;
    lastKnownStatus = copy.saved(format.format(new Date(lastCheck)));
    setState('cached', lastKnownStatus);
  }
  button.hidden = false;

  const refresh = async (manual = false) => {
    if (disposed || pending) return;
    if (!navigator.onLine) {
      setState('offline', copy.offline(lastKnownStatus));
      return;
    }
    if (cache.retryAt && cache.retryAt > Date.now()) { showCooldown(); return; }
    pending = true;
    lastCheck = Date.now();
    setState('loading', copy.checking(lastKnownStatus));
    const result = await readIssue(listeners.signal, locale);
    pending = false;
    if (disposed) return;
    if (!navigator.onLine) {
      setState('offline', copy.offline(lastKnownStatus));
      return;
    }
    if (result.kind === 'data') {
      showAvailability(result.value);
      cache.availability = { savedAt: Date.now(), raw: result.raw };
      delete cache.retryAt;
      lastKnownStatus = copy.lastChecked(format.format(new Date()));
      setState('data', copy.live(format.format(new Date())));
    } else if (result.kind === 'empty') {
      availability.dataset.available = 'false';
      label.textContent = copy.unpublishedLabel;
      detail.textContent = copy.unpublishedDetail;
      delete cache.availability;
      delete cache.retryAt;
      lastKnownStatus = copy.unpublished;
      setState('empty', lastKnownStatus);
    } else if (result.kind === 'rate-limited') {
      cache.retryAt = result.retryAt;
      showCooldown();
    } else {
      setState('error', copy.error(lastKnownStatus));
    }
    host.dataset.lastKnownStatus = lastKnownStatus;
    saveCache();
    // User-requested refresh gets a brief confirmation; background checks stay quiet.
    if (manual && (result.kind === 'data' || result.kind === 'empty') && !prefersReducedMotion() && signals.animate) {
      feedback?.cancel();
      feedback = signals.animate([{ opacity: .65 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    }
  };
  button.addEventListener('click', () => { void refresh(true); }, { signal: listeners.signal });
  const checkWhenDue = () => {
    if (!document.hidden && Date.now() - lastCheck >= refreshInterval) void refresh();
  };
  const interval = window.setInterval(checkWhenDue, 60 * 1000);
  document.addEventListener('visibilitychange', checkWhenDue, { signal: listeners.signal });
  window.addEventListener('online', () => { void refresh(); }, { signal: listeners.signal });
  window.addEventListener('offline', () => {
    setState('offline', copy.offline(lastKnownStatus));
  }, { signal: listeners.signal });
  observeReducedMotion(() => { if (prefersReducedMotion()) feedback?.cancel(); }, listeners.signal);
  if (!navigator.onLine || cache.retryAt || !cache.availability || Date.now() - lastCheck >= refreshInterval) void refresh();

  return () => {
    disposed = true;
    listeners.abort();
    window.clearInterval(interval);
    window.clearTimeout(cooldown);
    feedback?.cancel();
    card.setAttribute('aria-busy', 'false');
  };
}

function initialize() {
  for (const host of document.querySelectorAll<HTMLElement>('[data-home-current]')) {
    if (!mounts.has(host)) mounts.set(host, mountCurrent(host));
  }
}
function destroy() {
  for (const cleanup of mounts.values()) cleanup();
  mounts.clear();
}
initialize();
document.addEventListener('astro:page-load', initialize);
document.addEventListener('astro:before-swap', destroy);
window.addEventListener('pagehide', destroy);
window.addEventListener('pageshow', initialize);
if (import.meta.hot) import.meta.hot.dispose(() => {
  destroy();
  document.removeEventListener('astro:page-load', initialize);
  document.removeEventListener('astro:before-swap', destroy);
  window.removeEventListener('pagehide', destroy);
  window.removeEventListener('pageshow', initialize);
});
