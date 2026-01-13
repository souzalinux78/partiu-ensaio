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
    // Verificar display-mode standalone (mais confiável)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ PWA detectado: display-mode standalone');
      return true;
    }

    // Verificar se está sendo executado como PWA (sem barra de endereços)
    if (window.navigator.standalone === true) {
      console.log('✅ PWA detectado: navigator.standalone = true');
      return true;
    }

    // Verificar se foi adicionado à tela inicial (Android - verificação adicional)
    // Se não há barra de endereços visível e não está em modo navegador
    const isInBrowser = window.location.href.includes('chrome://') || 
                       window.location.href.includes('about:blank') ||
                       document.referrer === '';
    
    // Se não está em navegador e não tem barra de endereços, provavelmente é PWA
    if (!isInBrowser && window.navigator.standalone !== false) {
      // Verificar se há referrer vazio (comum em PWAs)
      if (window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches) {
        console.log('✅ PWA detectado: display-mode fullscreen ou minimal-ui');
        return true;
      }
    }

    // Verificar iOS standalone mode
    const isIOSDevice = detectIOS();
    if (isIOSDevice && ('standalone' in window.navigator) && window.navigator.standalone) {
      console.log('✅ PWA detectado: iOS standalone mode');
      return true;
    }

    return false;
  };

  useEffect(() => {
    let installationCheckInterval = null;
    const deferredPromptRef = { current: null };

    // Verificar periodicamente se o PWA foi instalado
    const checkInstallation = () => {
      const mobile = detectMobile();
      const ios = detectIOS();
      const installed = checkIfInstalled();

      setIsMobile(mobile);
      setIsIOS(ios);
      setIsInstalled(installed);

      return installed;
    };

    // Verificar imediatamente
    const mobile = detectMobile();
    const ios = detectIOS();
    const installed = checkInstallation();

    setIsMobile(mobile);
    setIsIOS(ios);
    setIsInstalled(installed);

    // Se já estiver instalado, não mostrar prompt
    if (installed) {
      console.log('✅ PWA já está instalado - não mostrar prompt');
      return;
    }

    // Verificar periodicamente se foi instalado (a cada 2 segundos)
    installationCheckInterval = setInterval(() => {
      const isNowInstalled = checkInstallation();
      if (isNowInstalled) {
        setIsInstalled(true);
        setShowPrompt(false);
        if (installationCheckInterval) {
          clearInterval(installationCheckInterval);
        }
      }
    }, 2000);

    // Verificar se o usuário já viu o prompt ou dispensou permanentemente
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
    const dismissedPermanently = localStorage.getItem('pwa-install-prompt-dismissed') === 'true';
    
    // Só mostrar se não foi visto e não foi dispensado
    if (hasSeenPrompt || dismissedPermanently) {
      console.log('ℹ️ Prompt já foi visto ou dispensado');
      return;
    }

    // Escutar evento beforeinstallprompt (Android/Chrome/Edge)
    // Este é o evento PRINCIPAL que permite instalação automática
    const handleBeforeInstallPrompt = (e) => {
      console.log('🎯 beforeinstallprompt capturado!');
      e.preventDefault();
      deferredPromptRef.current = e;
      setDeferredPrompt(e);
      
      // Mostrar prompt imediatamente quando o evento for capturado
      const delay = mobile ? 1000 : 2000;
      setTimeout(() => {
        setShowPrompt(true);
      }, delay);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar se o Service Worker está ativo (necessário para beforeinstallprompt)
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Aguardar Service Worker estar pronto
          const registration = await navigator.serviceWorker.ready;
          console.log('✅ Service Worker está ativo:', registration.active?.state);
          console.log('✅ Service Worker scope:', registration.scope);
          
          // Verificar se o manifest está sendo carregado
          try {
            const manifestResponse = await fetch('/manifest.json');
            if (manifestResponse.ok) {
              const manifest = await manifestResponse.json();
              console.log('✅ Manifest.json carregado:', manifest.name);
              console.log('✅ Manifest display:', manifest.display);
              console.log('✅ Manifest start_url:', manifest.start_url);
              
              // Validar ícones do manifest
              if (manifest.icons && manifest.icons.length > 0) {
                console.log('🔍 Validando ícones do manifest...');
                for (const icon of manifest.icons) {
                  try {
                    const iconResponse = await fetch(icon.src);
                    if (iconResponse.ok) {
                      const contentType = iconResponse.headers.get('content-type');
                      if (contentType && contentType.startsWith('image/')) {
                        console.log(`✅ Ícone válido: ${icon.src} (${icon.sizes}, ${contentType})`);
                      } else {
                        console.error(`❌ Ícone inválido (tipo incorreto): ${icon.src} (${contentType})`);
                      }
                    } else {
                      console.error(`❌ Ícone não encontrado: ${icon.src} (${iconResponse.status})`);
                    }
                  } catch (iconErr) {
                    console.error(`❌ Erro ao validar ícone ${icon.src}:`, iconErr);
                  }
                }
              }
            } else {
              console.error('❌ Erro ao carregar manifest.json:', manifestResponse.status);
            }
          } catch (err) {
            console.error('❌ Erro ao carregar manifest.json:', err);
          }
          
          // Se o Service Worker está ativo, aguardar o beforeinstallprompt
          // Se não aparecer em 5 segundos, pode ser que não seja instalável
          setTimeout(() => {
            if (!deferredPromptRef.current && mobile && !ios) {
              console.warn('⚠️ beforeinstallprompt não apareceu após 5 segundos');
              console.warn('⚠️ Possíveis causas:');
              console.warn('   1. Service Worker não está ativo');
              console.warn('   2. Manifest.json não está correto');
              console.warn('   3. PWA já foi instalado anteriormente');
              console.warn('   4. Navegador não suporta beforeinstallprompt');
              console.warn('   5. Site não está em HTTPS');
            }
          }, 5000);
        } catch (error) {
          console.error('❌ Erro ao verificar Service Worker:', error);
          console.error('   Service Worker pode não estar registrado ainda');
        }
      } else {
        console.error('❌ Service Worker não é suportado neste navegador');
      }
    };

    // Verificar Service Worker após um pequeno delay para garantir que está registrado
    setTimeout(() => {
      checkServiceWorker();
    }, 1000);

    // Para iOS, não há beforeinstallprompt, então mostrar instruções manuais
    // Mas só se não houver deferredPrompt disponível
    if (ios && mobile) {
      // Aguardar um pouco para ver se o beforeinstallprompt aparece
      setTimeout(() => {
        if (!deferredPromptRef.current) {
          // Se após 3 segundos não houver deferredPrompt, mostrar instruções para iOS
          const delay = 3000;
          setTimeout(() => {
            if (!deferredPromptRef.current) {
              setShowPrompt(true);
            }
          }, delay);
        }
      }, 1000);
    }

    // Escutar evento appinstalled
    const handleAppInstalled = () => {
      console.log('✅ PWA instalado com sucesso! Evento appinstalled disparado.');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      localStorage.setItem('pwa-install-prompt-dismissed', 'true');
      
      // Recarregar a página após instalação para garantir modo standalone
      setTimeout(() => {
        console.log('🔄 Recarregando página para ativar modo standalone...');
        window.location.reload();
      }, 1000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (installationCheckInterval) {
        clearInterval(installationCheckInterval);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    // Se não houver deferredPrompt, não mostrar alert - apenas fechar
    // O beforeinstallprompt deve estar disponível para instalação automática
    if (!deferredPrompt) {
      console.warn('⚠️ deferredPrompt não disponível. Verifique se o Service Worker está registrado e o manifest.json está correto.');
      
      // Para iOS, mostrar instruções manuais
      if (isIOS) {
        alert('📱 Para instalar no iPhone/iPad:\n\n1. Toque no botão de compartilhar (quadrado com seta para cima)\n2. Role para baixo e selecione "Adicionar à Tela de Início"\n3. Toque em "Adicionar" no canto superior direito\n\n✨ O app aparecerá na sua tela inicial!');
      } else {
        // Para Android, tentar verificar se há opção de instalação no menu
        alert('📱 Para instalar:\n\n1. Toque no menu (três pontos) no canto superior direito\n2. Procure por "Instalar aplicativo" ou "Adicionar à tela inicial"\n3. Se não aparecer, o PWA pode não estar pronto para instalação\n\nVerifique se o Service Worker está ativo.');
      }
      
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
      return;
    }

    try {
      console.log('🚀 Iniciando instalação do PWA...');
      
      // Mostrar prompt de instalação nativo do navegador
      await deferredPrompt.prompt();

      // Aguardar resposta do usuário
      const { outcome } = await deferredPrompt.userChoice;

      console.log('📋 Resultado da instalação:', outcome);

      if (outcome === 'accepted') {
        console.log('✅ Usuário aceitou instalar o PWA');
        setIsInstalled(true);
        setShowPrompt(false);
        // O evento 'appinstalled' será disparado automaticamente
      } else {
        console.log('❌ Usuário recusou instalar o PWA');
        setShowPrompt(false);
        localStorage.setItem('pwa-install-prompt-seen', 'true');
      }
    } catch (error) {
      console.error('❌ Erro ao mostrar prompt de instalação:', error);
      setShowPrompt(false);
      localStorage.setItem('pwa-install-prompt-seen', 'true');
    }

    // Limpar deferredPrompt após uso
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Marcar como visto permanentemente quando o usuário fecha
    localStorage.setItem('pwa-install-prompt-seen', 'true');
    localStorage.setItem('pwa-install-prompt-dismissed', 'true');
    // Não mostrar novamente até que o usuário limpe o localStorage
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
