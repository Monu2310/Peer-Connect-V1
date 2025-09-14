// Advanced Service Worker with enterprise-level optimizations
const CACHE_VERSION = 'v3.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing with enterprise optimizations...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('✅ Critical resources cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated with enterprise optimizations');
      return self.clients.claim();
    })
  );
});

// Fetch event - intelligent request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET' || 
      (url.origin !== self.location.origin && !url.pathname.startsWith('/api'))) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Intelligent request handling
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  if (isStaticAsset(pathname)) {
    return handleStaticAsset(request);
  } else if (isApiRequest(pathname)) {
    return handleApiRequest(request);
  } else if (isImageRequest(pathname)) {
    return handleImageRequest(request);
  } else {
    return handleDynamicRequest(request);
  }
}

// Static asset handling (cache-first)
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

// API request handling (network-first with caching)
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok && request.method === 'GET') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Image request handling (cache-first)
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Dynamic content handling (stale-while-revalidate)
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Background update
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Helper functions
function isStaticAsset(pathname) {
  return /\.(js|css|woff|woff2|ttf|eot|ico|svg)$/.test(pathname) ||
         pathname.startsWith('/static/');
}

function isApiRequest(pathname) {
  return pathname.startsWith('/api/');
}

function isImageRequest(pathname) {
  return /\.(png|jpg|jpeg|gif|webp|avif)$/.test(pathname);
}

// Background sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'background-data-sync':
      event.waitUntil(performBackgroundSync());
      break;
  }
});

async function performBackgroundSync() {
  try {
    const cache = await caches.open(API_CACHE);
    const criticalEndpoints = [
      '/api/users/notifications',
      '/api/messages/unread-count'
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.warn('Background sync failed for:', endpoint);
      }
    }
    
    console.log('✅ Background data sync completed');
  } catch (error) {
    console.error('❌ Background data sync failed:', error);
    throw error;
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

console.log('🚀 Advanced Service Worker loaded with enterprise optimizations');