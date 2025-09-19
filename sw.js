const CACHE_NAME = 'clicker-cache-v3';

// Génération dynamique des icônes
const androidSizes = [36, 48, 72, 96, 144, 192];
const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
const msSizes = [70, 144, 150, 310];
const faviconSizes = [16, 32, 96];

const iconPaths = [
  '/images/favicon.ico',
  '/images/apple-icon.png',
  '/images/apple-icon-precomposed.png',
  '/images/browserconfig.xml',
  '/images/favicon.svg',
  ...androidSizes.map(size => `/images/android-icon-${size}x${size}.png`),
  ...appleSizes.map(size => `/images/apple-icon-${size}x${size}.png`),
  ...msSizes.map(size => `/images/ms-icon-${size}x${size}.png`),
  ...faviconSizes.map(size => `/images/favicon-${size}x${size}.png`)
];

const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/machines.js',
  '/upgrades.js',
  '/animations.js',
  '/dev.js',
  '/settings.js',
  '/shop.js',
  '/rebirthSystem.js',
  '/stats.js',
  '/formatters.js',
  '/site.webmanifest',
  ...iconPaths
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

  // Navigation HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Autres ressources
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(resp => {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
            return resp;
          });
      })
      .catch(() => {
        if (event.request.destination === 'image') {
          return caches.match('/images/favicon.svg');
        }
      })
  );
});
