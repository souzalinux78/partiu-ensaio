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

// Registrar o service worker para PWA
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Quando há uma nova versão disponível
    if (window.confirm('Nova versão disponível! Deseja atualizar?')) {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log('PWA instalado com sucesso!');
  }
});
