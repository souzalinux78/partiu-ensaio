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

// Registrar Service Worker apenas em produção
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Quando há uma nova versão disponível
      if (window.confirm('Nova versão disponível! Deseja atualizar agora?')) {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    },
    onSuccess: (registration) => {
      console.log('✅ PWA instalado com sucesso!');
    },
  });
} else {
  // Em desenvolvimento, desabilitar service worker
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
