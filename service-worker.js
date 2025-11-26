
const CACHE_NAME = 'atom-ai-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error('Cache addAll error:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old caches to ensure fresh start
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests (Page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // 1. Try Network First (Always try to get fresh content)
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          // 2. If Network fails (offline), try Cache for index.html
          console.log('Network failed, trying cache for navigation');
          const cachedResponse = await caches.match('./index.html');
          if (cachedResponse) {
            return cachedResponse;
          }
          // 3. Fail gracefully if nothing works (browser default)
          // We do NOT throw here if possible to avoid explicit crash, but if cache is empty, we have to.
          throw error;
        }
      })()
    );
    return;
  }

  // Asset requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});