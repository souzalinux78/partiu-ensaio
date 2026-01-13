const CACHE_NAME = 'partiu-ensaio-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar completamente requisições que não são GET
  if (event.request.method !== 'GET') {
    return; // Deixa o navegador lidar normalmente
  }
  
  // Ignorar completamente requisições de API
  if (event.request.url.includes('/api/')) {
    return; // Deixa o navegador lidar normalmente
  }
  
  // Só interceptar requisições GET de recursos estáticos
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Só fazer cache de GET com status 200 e que não sejam API
        if (response.status === 200 && !event.request.url.includes('/api/')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
