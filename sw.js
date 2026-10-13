/* EinsatzFit – Service Worker. Cache-first für Offline-Nutzung.
   Bei Datei-Änderungen CACHE-Version erhöhen → alte Caches werden ersetzt. */
const CACHE = 'einsatzfit-v6';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './training.js',
  './previews.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  // Activate only after the user accepts the update.
});

// Erlaubt der App, ein wartendes Update sofort zu aktivieren.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('einsatzfit-') && k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then(cache => cache.match(req)).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.open(CACHE).then(cache => cache.match('./index.html'));
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});
