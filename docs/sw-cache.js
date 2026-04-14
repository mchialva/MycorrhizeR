const CACHE_NAME = 'mycorrhizer-v1';

// File critici da pre-cachare subito
const PRECACHE_URLS = [
  '/MycorrhizeR/',
  '/MycorrhizeR/index.html',
  '/MycorrhizeR/manifest.json',
  '/MycorrhizeR/web-app-manifest-192x192.png',
  '/MycorrhizeR/web-app-manifest-512x512.png',
];

// Installa e pre-cacha i file essenziali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Attivazione: elimina cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercetta le richieste
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategia "Cache First" per file statici pesanti (wasm, js, css, png)
  const isStatic = /\.(wasm|js|css|png|ico|svg|json|data)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          // Serve dalla cache, aggiorna in background
          fetch(event.request).then(response => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {});
          return cached;
        }
        // Non in cache: scarica e salva
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Per tutto il resto: Network First (HTML, richieste dinamiche)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
