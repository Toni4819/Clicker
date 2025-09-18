const CACHE_NAME = 'clicker-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/machines.js',
  '/upgrades.js',
  '/animations.js',
  '/dev.js',
  '/shop.js',
  '/rebirthSystem.js',
  '/reset.js',
  '/stats.js',
  '/formatters.js',
  '/image/favicon-96x96.png',
  '/image/favicon.svg',
  '/image/apple-touch-icon.png',
  '/site.webmanifest'
];

// Installation : cache initial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navigation HTML (mode navigate)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          // Mettre à jour le cache
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Autres ressources (CSS, JS, images…)
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(resp => {
            // En option : mise à jour dynamique
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
            return resp;
          });
      })
      .catch(() => {
        // Fallback image
        if (event.request.destination === 'image') {
          return caches.match('/image/favicon.svg');
        }
      })
  );
});
