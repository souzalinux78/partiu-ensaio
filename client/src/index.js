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
// Em produção, sempre registrar
// Em desenvolvimento, verificar se está em localhost (não registrar para evitar problemas)
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '[::1]' ||
                   window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/);

if (!isLocalhost) {
  // Registrar em produção ou quando não estiver em localhost
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Quando há uma nova versão disponível
      console.log('Nova versão do PWA disponível!');
      if (window.confirm('Nova versão disponível! Deseja atualizar agora?')) {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    onSuccess: (registration) => {
      console.log('✅ PWA registrado com sucesso!');
    },
  });
} else {
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
