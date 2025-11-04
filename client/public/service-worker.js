const CACHE_NAME = 'peerconnect-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache strategy with timeout
self.addEventListener('fetch', event => {
  // Don't cache POST, PUT, DELETE, PATCH requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network first strategy with timeout
  event.respondWith(
    Promise.race([
      fetch(event.request).then(response => {
        // Clone the response as it can only be used once
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      }),
      new Promise(resolve => {
        // Fallback to cache after 3 seconds
        setTimeout(() => {
          caches.match(event.request).then(cachedResponse => {
            resolve(cachedResponse || new Response('Offline - no cached response available', { status: 503 }));
          });
        }, 3000);
      })
    ]).catch(() => {
      // Return cached response or offline message
      return caches.match(event.request).then(cachedResponse => {
        return cachedResponse || new Response('Offline - no cached response available', { status: 503 });
      });
    })
  );
});
