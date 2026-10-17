// Source: integrations/service-worker/sw.js. The build fills in the
// `self.__SW_*__` placeholders and writes the result to dist/sw.js.
const VERSION = self.__SW_VERSION__;
const PRECACHE_ENTRIES = self.__SW_PRECACHE__;

const CACHE_PREFIX = 'amjed-';
const PRECACHE = `${CACHE_PREFIX}precache-${VERSION}`;
// Not versioned: images are cached as they're viewed and kept across deploys.
const IMAGE_CACHE = `${CACHE_PREFIX}images`;
const IMAGE_CACHE_LIMIT = 60;
// Offline fallback per locale; keep in sync with LOCALE_PRECACHED in index.mjs.
const offlineKey = (pathname) => (/^\/fr(\/|$)/.test(pathname) ? '/fr/offline' : '/offline');
const NAVIGATION_TIMEOUT_MS = 3000;
const TIMED_OUT = Symbol('timed-out');
const MATCH_OPTIONS = { ignoreVary: true };

// `/about/` and `/about/index.html` share the `/about` cache entry.
const pageKey = (pathname) =>
  pathname === '/' ? '/' : pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');

// Navigation requests cannot be answered with a redirected response, so
// strip the redirect flag before caching anything that followed one.
async function cacheable(response) {
  if (!response.redirected) return response;
  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// Flags HTML served from cache so the page can tell the visitor it may be out
// of date (see OfflineNotice.astro). Length/encoding headers no longer apply.
async function markCachedCopy(response) {
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  const html = (await response.text()).replace('<html', '<html data-cached-copy');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await Promise.all(PRECACHE_ENTRIES.map(async ({ url, key }) => {
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error(`Precache failed for ${url}: ${response.status}`);
      await cache.put(key, await cacheable(response));
    }));
    // No skipWaiting here: an update waits until the page asks for it on
    // navigation (see Base.astro), so open tabs keep their precache meanwhile.
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== PRECACHE && key !== IMAGE_CACHE)
        .map((key) => caches.delete(key)),
    );
    await self.registration.navigationPreload?.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event, url));
    return;
  }

  // Precached files are exact for this build (the version hashes their
  // contents), so serve them straight from cache and fall back to network.
  event.respondWith((async () => {
    const precached = await caches.match(request, { ...MATCH_OPTIONS, cacheName: PRECACHE });
    if (precached) return precached;
    if (request.destination === 'image') return handleImage(event);
    return fetch(request);
  })());
});

// Stale-while-revalidate: show the saved copy at once and refresh it in the
// background, so unhashed files like /hero-portrait.webp still pick up changes.
async function handleImage(event) {
  const { request } = event;
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request, MATCH_OPTIONS);
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimImageCache(cache);
    }
    return response;
  });
  if (!cached) return network;
  event.waitUntil(network.catch(() => {}));
  return cached;
}

// Cache keys come back in insertion order, so the oldest go first.
async function trimImageCache(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, -IMAGE_CACHE_LIMIT).map((key) => cache.delete(key)));
}

// Network-first: fresh HTML when online, cached copy when the network fails
// or stalls, and the offline page for routes that were never cached.
async function handleNavigation(event, url) {
  const key = pageKey(url.pathname);

  const network = (async () => {
    const response = (await event.preloadResponse) ?? (await fetch(event.request));
    if (response.ok) {
      const cache = await caches.open(PRECACHE);
      await cache.put(key, await cacheable(response.clone()));
    }
    return response;
  })().catch(() => null);
  event.waitUntil(network);

  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), NAVIGATION_TIMEOUT_MS);
  });
  const first = await Promise.race([network, timeout]);
  clearTimeout(timer);
  if (first && first !== TIMED_OUT) return first;

  const cached = await caches.match(key, MATCH_OPTIONS);
  if (cached) return markCachedCopy(cached);

  // Slow network and nothing cached: keep waiting rather than give up early.
  const late = first === TIMED_OUT ? await network : null;
  return late
    ?? (await caches.match(offlineKey(url.pathname), MATCH_OPTIONS))
    ?? (await caches.match('/offline', MATCH_OPTIONS))
    ?? Response.error();
}
