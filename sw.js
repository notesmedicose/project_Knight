/**
 * Knight 3D Chess — Service Worker
 * Provides offline caching for core game assets.
 */
const CACHE_NAME = 'knight3d-chess-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/privacy.html',
  '/src/main.js',
  '/src/style.css',
  '/src/ui/UIManager.js',
  '/src/ui/TomUI.js',
  '/src/logic/ChessEngine.js',
  '/src/logic/BotAI.js',
  '/src/logic/TalkingTom.js',
  '/src/gfx/SceneManager.js',
  '/src/gfx/ChessBoard3D.js',
  '/src/gfx/PieceGenerator.js',
  '/src/gfx/ProceduralTextureGenerator.js',
  '/src/audio/SoundManager.js',
  '/src/ads/AdManager.js'
];

// Install: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET and external requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (event.request.headers.get('Accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
