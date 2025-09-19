const CACHE_NAME = 'clicker-cache-v4';

// JS à la racine
const rootJS = [
  'main.js',
  'rebirthSystem.js'
].map(file => `/${file}`);

// JS dans /menus/
const menuJS = [
  'dev.js',
  'machines.js',
  'settings.js',
  'shop.js',
  'upgrades.js'
].map(file => `/menus/${file}`);

// JS dans /modules/
const moduleJS = [
  'animations.js',
  'formatters.js',
  'initCoinDrop.js',
  'stats.js'
].map(file => `/modules/${file}`);

// Fichiers statiques
const staticFiles = [
  '/',
  '/index.html',
  '/style.css',
  '/site.webmanifest'
];

// Icônes Android, Apple, MS, favicon
const androidSizes = [36, 48, 72, 96, 144, 192];
const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
const msSizes = [70, 144, 150, 310];
const faviconSizes = [16, 32, 96];

const iconPaths = [
  'favicon.ico',
  'apple-icon.png',
  'apple-icon-precomposed.png',
  'browserconfig.xml',
  'favicon.svg',
  ...androidSizes.map(size => `android-icon-${size}x${size}.png`),
  ...appleSizes.map(size => `apple-icon-${size}x${size}.png`),
  ...msSizes.map(size => `ms-icon-${size}x${size}.png`),
  ...faviconSizes.map(size => `favicon-${size}x${size}.png`)
].map(file => `/images/${file}`);

// Liste finale à cacher
const urlsToCache = [
  ...staticFiles,
  ...rootJS,
  ...menuJS,
  ...moduleJS,
  ...iconPaths
];

// Installation : cache initial (tolérant aux fichiers manquants)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(
        urlsToCache.map(async url => {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              await cache.put(url, resp.clone());
            } else {
              console.warn(`❌ Skip: ${url} (status ${resp.status})`);
            }
          } catch (err) {
            console.warn(`❌ Skip: ${url} (${err})`);
          }
        })
      );
      self.skipWaiting();
    })
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
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
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
            const respClone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
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
