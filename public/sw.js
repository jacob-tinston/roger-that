// Service Worker for Roger That PWA
// Cache version - increment this to force cache refresh
const CACHE_VERSION = 'v1';
const CACHE_NAME = `roger-that-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/daily',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/apple-touch-icon.png',
    '/favicon.ico',
    '/site.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((error) => {
                console.warn('Service Worker: Failed to cache some static assets', error);
            });
        })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Skip service worker and manifest requests
    if (url.pathname === '/sw.js' || url.pathname === '/site.webmanifest') {
        return;
    }

    event.respondWith(
        (async () => {
            // Check if it's a static asset (CSS, JS, images, fonts)
            if (
                url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
                url.pathname.startsWith('/build/')
            ) {
                // Cache-first strategy for static assets
                return cacheFirst(request, CACHE_NAME);
            }

            // Network-first strategy for HTML and API/Inertia requests
            return networkFirst(request, CACHE_NAME);
        })()
    );
});

// Cache-first strategy: Check cache first, fallback to network
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // If network fails and no cache, return a basic offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        // Only cache successful responses
        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Network failed, try cache
        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        // If it's a navigation request and we have no cache, return the home page
        if (request.mode === 'navigate') {
            const homePage = await cache.match('/');
            if (homePage) {
                return homePage;
            }
        }

        // Return offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}
