// Kill switch: emitted instead of the real service worker when the site is
// built with SW_KILL_SWITCH=1. Clears this site's caches, unregisters itself
// and reloads open tabs so they go back to plain network requests.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('amjed-')).map((key) => caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});
