// ══════════════════════════════════════════════
//  FlowTimer — Service Worker
//  Versión de caché: actualizar al hacer deploy
// ══════════════════════════════════════════════

const CACHE_NAME = 'flowtimer-v1';

// Archivos a cachear para funcionamiento offline
const ASSETS = [
  './FlowTimer-HIIT.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@300;400;600;700&display=swap'
];

// ── Instalación: pre-cachear assets esenciales ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear assets locales (los de Google Fonts pueden fallar offline, ignorar)
      return cache.addAll([
        './FlowTimer-HIIT.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    }).then(() => self.skipWaiting())
  );
});

// ── Activación: limpiar cachés antiguas ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia Cache-First con fallback a red ──
self.addEventListener('fetch', event => {
  // Solo manejar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // No está en caché → ir a la red y guardar copia
      return fetch(event.request)
        .then(response => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Sin red y sin caché → respuesta de fallback para el HTML principal
          if (event.request.destination === 'document') {
            return caches.match('./FlowTimer-HIIT.html');
          }
        });
    })
  );
});
