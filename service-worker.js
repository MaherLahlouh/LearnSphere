
const CACHE_NAME = 'learnwithtaa-v1';
const RUNTIME_CACHE = 'learnwithtaa-runtime-v1';

const STATIC_ASSETS = [
    '/',
    '/dashboard.html',
    '/login.html',
    '/sign_up.html',
    '/units.html',
    '/lesson.html',
    '/teacher_dashboard.html',
    '/code_editor_python.html',
    '/landing_page.html',
    '/firebase-config.js',
    '/toast-notifications.js',
    '/toast-notifications.css',
    '/loading-animations.css',
    '/keyboard-shortcuts.js',
    '/dark-mode.js',
    '/dark-mode.css',
    '/analytics.js',
    '/accessibility.js',
    '/print-styles.css',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).catch(err => {
            console.log('Cache install error:', err);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    if (event.request.url.includes('firebase') || 
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();

                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                if (event.request.destination === 'document') {
                    return caches.match('/offline.html');
                }
            });
        })
    );
});


