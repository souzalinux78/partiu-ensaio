import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// DESABILITAR service worker COMPLETAMENTE - sempre desregistrar
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().then(() => {
        console.log('✅ Service worker desregistrado');
      });
    });
  });
  
  // Limpar todos os caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('✅ Cache deletado:', cacheName);
      });
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
