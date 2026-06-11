// Minimal service worker for PWA install support
const CACHE_NAME = 'pure-turf-ai-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Network-first for API calls
  if (e.request.url.includes('/.netlify/functions/') || e.request.url.includes('api.anthropic.com')) {
    return;
  }
  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
