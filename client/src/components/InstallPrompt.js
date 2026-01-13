import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se está em iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

    if (isIOS && isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Escutar evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt após 3 segundos
      setTimeout(() => {
        // Verificar se o usuário já viu o prompt antes (usando localStorage)
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        if (!hasSeenPrompt) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escutar evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Se não houver deferredPrompt, mostrar instruções para iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Para instalar no iOS:\n\n1. Toque no botão de compartilhar (quadrado com seta)\n2. Selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar"');
      } else {
        alert('Para instalar este app:\n\n1. Clique no ícone de menu (três pontos) no navegador\n2. Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"');
      }
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      return;
    }

    // Mostrar prompt de instalação
    deferredPrompt.prompt();

    // Aguardar resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ Usuário aceitou instalar o PWA');
    } else {
      console.log('❌ Usuário recusou instalar o PWA');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  // Não mostrar se já estiver instalado
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <div className="install-prompt-icon">📱</div>
        <h3>Instalar App</h3>
        <p>Instale o Partiu Ensaio no seu celular para acesso rápido e uso offline!</p>
        <div className="install-prompt-buttons">
          <button onClick={handleInstallClick} className="install-btn-primary">
            Instalar Agora
          </button>
          <button onClick={handleDismiss} className="install-btn-secondary">
            Agora Não
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
