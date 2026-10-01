// =============================================================
// SERVICE WORKER - PWA PRESENSI GURU
// =============================================================
// v5: refresh shell/config lebih andal agar perubahan GitHub tidak
// tertahan cache versi lama.

const CACHE_NAME = 'presensi-guru-pwa-v5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined)
      .finally(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  const isConfig = url.pathname.endsWith('/config.js');
  const isManifest = url.pathname.endsWith('/manifest.webmanifest');

  // HTML/config/manifest selalu mencoba mengambil versi terbaru dulu.
  if (isHtml || isConfig || isManifest) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Asset statis: cache-first.
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
