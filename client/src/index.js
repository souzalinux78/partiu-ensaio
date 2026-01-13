import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker
// IMPORTANTE: O Service Worker DEVE estar registrado para o PWA funcionar corretamente
// O beforeinstallprompt só é disparado se o Service Worker estiver ativo
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '[::1]' ||
                   window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/);

// Sempre registrar o Service Worker, exceto em localhost explícito
if (!isLocalhost) {
  console.log('🔧 Registrando Service Worker para PWA...');
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Quando há uma nova versão disponível
      console.log('🔄 Nova versão do PWA disponível!');
      if (window.confirm('Nova versão disponível! Deseja atualizar agora?')) {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    onSuccess: (registration) => {
      console.log('✅ Service Worker registrado com sucesso!');
      console.log('✅ PWA pronto para instalação!');
    },
  });
} else {
  console.log('⚠️ Localhost detectado - Service Worker desabilitado para desenvolvimento');
  // Em desenvolvimento local, desabilitar service worker para evitar cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
    
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
  }
}
