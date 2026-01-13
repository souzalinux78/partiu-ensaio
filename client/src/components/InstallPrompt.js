import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Função para detectar se é mobile
  const detectMobile = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
    const isMobileDevice = mobileRegex.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileDevice || (isSmallScreen && hasTouchScreen);
  };

  // Função para detectar iOS
  const detectIOS = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  };

  // Função para verificar se já está instalado
  const checkIfInstalled = () => {
    // Verificar display-mode standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Verificar iOS standalone mode
    const isIOSDevice = detectIOS();
    if (isIOSDevice && ('standalone' in window.navigator) && window.navigator.standalone) {
      return true;
    }

    // Verificar se foi adicionado à tela inicial (Android)
    if (window.navigator.standalone === false) {
      return false;
    }

    return false;
  };

  useEffect(() => {
    const mobile = detectMobile();
    const ios = detectIOS();
    const installed = checkIfInstalled();

    setIsMobile(mobile);
    setIsIOS(ios);
    setIsInstalled(installed);

    // Se já estiver instalado, não mostrar prompt
    if (installed) {
      return;
    }

    // Verificar se o usuário já viu o prompt hoje
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    const dismissedToday = localStorage.getItem('pwa-install-prompt-dismissed');
    const today = new Date().toDateString();
    const shouldShow = !hasSeenPrompt || (dismissedToday !== today);

    // Escutar evento beforeinstallprompt (Android/Chrome/Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt imediatamente em mobile, ou após delay em desktop
      if (shouldShow) {
        const delay = mobile ? 500 : 2000; // 0.5s em mobile, 2s em desktop
        setTimeout(() => {
          setShowPrompt(true);
        }, delay);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS e outros dispositivos mobile, mostrar prompt mesmo sem beforeinstallprompt
    if (mobile && shouldShow) {
      // Mostrar imediatamente em mobile na primeira visita
      const delay = ios ? 1000 : 800; // iOS precisa de um pouco mais de tempo
      setTimeout(() => {
        setShowPrompt(true);
      }, delay);
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
      // Se não houver deferredPrompt, mostrar instruções específicas por dispositivo
      if (isIOS) {
        alert('📱 Para instalar no iPhone/iPad:\n\n1. Toque no botão de compartilhar (quadrado com seta para cima)\n2. Role para baixo e selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar" no canto superior direito\n\n✨ O app aparecerá na sua tela inicial!');
      } else if (isMobile) {
        // Android ou outros mobile
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isSamsung = /Samsung/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        
        if (isChrome || isSamsung) {
          alert('📱 Para instalar no Android:\n\n1. Toque no menu (três pontos) no canto superior direito\n2. Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"\n3. Confirme a instalação\n\n✨ O app aparecerá na sua tela inicial!');
        } else if (isFirefox) {
          alert('📱 Para instalar no Firefox:\n\n1. Toque no menu (três linhas) no canto superior direito\n2. Selecione "Página" → "Adicionar à Tela Inicial"\n3. Confirme a instalação\n\n✨ O app aparecerá na sua tela inicial!');
        } else {
          alert('📱 Para instalar:\n\n1. Abra o menu do navegador\n2. Procure por "Instalar aplicativo" ou "Adicionar à tela inicial"\n3. Siga as instruções na tela\n\n✨ O app aparecerá na sua tela inicial!');
        }
      } else {
        alert('💻 Para instalar no computador:\n\n1. Clique no ícone de instalação na barra de endereços (se disponível)\n2. Ou clique no menu (três pontos) → "Instalar aplicativo"\n\n✨ O app abrirá em uma janela própria!');
      }
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      return;
    }

    try {
      // Mostrar prompt de instalação nativo
      deferredPrompt.prompt();

      // Aguardar resposta do usuário
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalar o PWA');
        setIsInstalled(true);
      } else {
        console.log('❌ Usuário recusou instalar o PWA');
      }
    } catch (error) {
      console.error('Erro ao mostrar prompt de instalação:', error);
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
            <h3>📱 Instale o App!</h3>
            <p>
              {isIOS 
                ? 'Adicione à tela inicial para acesso rápido, notificações e uso offline!'
                : isMobile
                ? 'Instale o Partiu Ensaio para acesso rápido, notificações e uso offline!'
                : 'Instale o Partiu Ensaio para acesso rápido e melhor experiência!'
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
