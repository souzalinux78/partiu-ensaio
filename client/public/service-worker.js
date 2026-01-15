const CACHE_NAME = 'partiu-ensaio-v8';
const RUNTIME_CACHE = 'partiu-ensaio-runtime-v8';

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
  
  // Ignorar completamente requisições de uploads (deixar passar direto para a rede)
  // Isso evita problemas de cache e garante que as imagens sempre sejam buscadas do servidor
  // IMPORTANTE: Isso deve funcionar mesmo com query strings (?t=timestamp)
  if (url.pathname.startsWith('/uploads/')) {
    console.log('[Service Worker] Ignorando requisição de upload:', url.pathname);
    return; // Deixar passar direto para a rede, sem interceptar
  }
  
  // Ignorar requisições de ícones PWA (deixar passar direto para a rede)
  // Isso garante que os ícones sempre sejam buscados do servidor e não do cache
  if (url.pathname.startsWith('/icon-') || 
      url.pathname === '/favicon.ico' || 
      url.pathname.startsWith('/apple-touch-icon')) {
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

// Handler para notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);
  
  let notificationData = {
    title: 'Partiu Ensaio',
    body: 'Você tem uma nova notificação!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'partiu-ensaio',
    data: {}
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handler para cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Verificar se já existe uma janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não houver janela aberta, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handler para ações de notificação
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'view') {
    const notificationData = event.notification.data || {};
    const urlToOpen = notificationData.url || '/';
    
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
  
  event.notification.close();
});
