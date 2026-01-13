import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se está em iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iosCheck);
    
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

    if (iosCheck && isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Verificar se está em mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Escutar evento beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt imediatamente se for mobile, ou após 2 segundos se for desktop
      const delay = isMobile ? 1500 : 3000;
      setTimeout(() => {
        // Verificar se o usuário já viu o prompt antes (usando localStorage)
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        const dismissedToday = localStorage.getItem('pwa-install-prompt-dismissed');
        const today = new Date().toDateString();
        
        // Mostrar se não viu antes OU se foi dispensado há mais de 1 dia
        if (!hasSeenPrompt || (dismissedToday !== today)) {
          setShowPrompt(true);
        }
      }, delay);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar prompt mesmo sem beforeinstallprompt
    if (iosCheck && !isInStandaloneMode) {
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        const dismissedToday = localStorage.getItem('pwa-install-prompt-dismissed');
        const today = new Date().toDateString();
        
        if (!hasSeenPrompt || (dismissedToday !== today)) {
          setShowPrompt(true);
        }
      }, isMobile ? 2000 : 4000);
    }

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
    const today = new Date().toDateString();
    localStorage.setItem('pwa-install-prompt-dismissed', today);
    // Não marcar como "visto permanentemente", permite mostrar novamente amanhã
  };

  // Não mostrar se já estiver instalado
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button 
          className="install-prompt-close" 
          onClick={handleDismiss}
          aria-label="Fechar"
        >
          ×
        </button>
        <div className="install-prompt-content">
          <div className="install-prompt-icon">📱</div>
          <div className="install-prompt-text">
            <h3>Instale o App!</h3>
            <p>
              {isIOS 
                ? 'Adicione à tela inicial para acesso rápido e uso offline'
                : 'Instale o Partiu Ensaio para acesso rápido e uso offline!'
              }
            </p>
          </div>
        </div>
        <div className="install-prompt-buttons">
          <button onClick={handleInstallClick} className="install-btn-primary">
            {isIOS ? 'Como Instalar' : 'Instalar Agora'}
          </button>
          <button onClick={handleDismiss} className="install-btn-secondary">
            Depois
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
