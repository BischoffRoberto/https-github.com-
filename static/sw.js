const CACHE_NAME = 'miapp-cache-v4';
const OFFLINE_URL = '/offline';
const PRECACHE_ASSETS = [
  '/',
  '/static/style.css',
  '/static/admin.css',
  '/static/script.js?v=5',
  '/static/admin.js?v=4',
  '/static/logo.png',
  '/static/manifest.json',
  OFFLINE_URL
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Intentamos precachear todo, pero no hacemos fallar la instalación si alguno no está disponible.
      return Promise.allSettled(PRECACHE_ASSETS.map(url => cache.add(url))).then(results => {
        const rejected = results.filter(r => r.status === 'rejected');
        if (rejected.length) {
          console.warn('SW precache falló en algunos recursos:', rejected.map(r => r.reason));
        }
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(resp => resp || caches.match(OFFLINE_URL)))
  );
});
