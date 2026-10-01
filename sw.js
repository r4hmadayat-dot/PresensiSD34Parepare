const CACHE_NAME = 'kehadiran-guru-shell-v3';
const ASSETS = [
  './', './index.html', './config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isConfig = url.pathname.endsWith('/config.js');
  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');

  if (isConfig || isHtml) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
});
