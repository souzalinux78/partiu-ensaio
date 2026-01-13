const CACHE_NAME = 'partiu-ensaio-v2';
const RUNTIME_CACHE = 'partiu-ensaio-runtime-v2';

// Arquivos estáticos para cache inicial
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        // Não bloquear instalação se alguns arquivos falharem
        return cache.addAll(STATIC_CACHE_URLS).catch(err => {
          console.warn('[Service Worker] Alguns arquivos não puderam ser cacheados:', err);
        });
      })
  );
  
  // Forçar ativação imediata
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Assumir controle imediato de todas as páginas
  return self.clients.claim();
});

// Estratégia de cache: Network First com fallback para Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições que não são GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições de API (sempre buscar do servidor)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Ignorar requisições de uploads
  if (url.pathname.startsWith('/uploads/')) {
    return;
  }
  
  // Para recursos estáticos (HTML, CSS, JS, imagens)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Tentar buscar da rede primeiro
        return fetch(request)
          .then((networkResponse) => {
            // Se a resposta é válida, fazer cache
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Se a rede falhar, usar cache
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não houver cache, retornar página offline
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Mensagem para atualizar o service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificação quando há nova versão
self.addEventListener('updatefound', () => {
  console.log('[Service Worker] Nova versão encontrada!');
});
