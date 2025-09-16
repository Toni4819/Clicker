const CACHE_NAME = 'clicker-cache-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/machines.js',
  '/upgrades.js',
  '/dev.js',
  '/rebirthSystem.js',
  '/reset.js',
  '/stats.js',
  '/image/favicon-96x96.png',
  '/image/favicon.svg',
  '/image/apple-touch-icon.png',
  '/image/site.webmanifest'
];

// Installation : mise en cache initiale
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Si trouvé en cache → renvoyer
      if (response) return response;

      // Sinon → tenter le réseau
      return fetch(event.request).catch(() => {
        // Fallback en cas d’échec réseau
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
