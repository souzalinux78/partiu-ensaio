/**
 * Sistema de Notificações Push para PWA
 * Permite enviar notificações sobre novos ensaios, aprovações, etc.
 */

// Verificar se o navegador suporta notificações
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Solicitar permissão para notificações
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notificações não são suportadas neste navegador');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Permissão de notificações foi negada pelo usuário');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificações:', error);
    return false;
  }
};

// Mostrar notificação local
export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported()) {
    console.warn('Notificações não são suportadas');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permissão de notificações não concedida');
    return;
  }

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'partiu-ensaio',
    requireInteraction: false,
    ...options
  };

  // Usar Service Worker se disponível
  if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, defaultOptions);
    });
  } else {
    // Fallback para notificação direta
    new Notification(title, defaultOptions);
  }
};

// Notificações específicas do sistema
export const NotificationTypes = {
  ENSAIO_APROVADO: 'ensaio_aprovado',
  ENSAIO_PENDENTE: 'ensaio_pendente',
  NOVO_ENSAIO: 'novo_ensaio',
  INTERESSE_REGISTRADO: 'interesse_registrado',
  LEMBRETE_ENSAIO: 'lembrete_ensaio'
};

// Criar notificação de ensaio aprovado
export const notifyEnsaioAprovado = (ensaio) => {
  showNotification('🎉 Ensaio Aprovado!', {
    body: `Seu ensaio em ${ensaio.nome_igreja || 'local'} foi aprovado e está visível para todos!`,
    data: {
      type: NotificationTypes.ENSAIO_APROVADO,
      ensaioId: ensaio.id,
      url: '/dashboard'
    },
    actions: [
      { action: 'view', title: 'Ver Ensaio' },
      { action: 'dismiss', title: 'Fechar' }
    ]
  });
};

// Criar notificação de novo ensaio disponível
export const notifyNovoEnsaio = (ensaio) => {
  const dataFormatada = ensaio.proxima_data 
    ? new Date(ensaio.proxima_data).toLocaleDateString('pt-BR')
    : 'em breve';
  
  showNotification('🎵 Novo Ensaio Disponível!', {
    body: `Ensaio em ${ensaio.nome_igreja || 'local'} agendado para ${dataFormatada}`,
    data: {
      type: NotificationTypes.NOVO_ENSAIO,
      ensaioId: ensaio.id,
      url: '/'
    },
    actions: [
      { action: 'view', title: 'Ver Detalhes' },
      { action: 'dismiss', title: 'Fechar' }
    ]
  });
};

// Criar notificação de lembrete de ensaio
export const notifyLembreteEnsaio = (ensaio, horasAntes = 24) => {
  const dataFormatada = ensaio.proxima_data 
    ? new Date(ensaio.proxima_data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'em breve';
  
  showNotification('⏰ Lembrete de Ensaio', {
    body: `Ensaio em ${ensaio.nome_igreja || 'local'} ${horasAntes === 24 ? 'amanhã' : `em ${horasAntes}h`}: ${dataFormatada}`,
    data: {
      type: NotificationTypes.LEMBRETE_ENSAIO,
      ensaioId: ensaio.id,
      url: '/'
    },
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver Detalhes' },
      { action: 'dismiss', title: 'Fechar' }
    ]
  });
};

// Criar notificação de interesse registrado
export const notifyInteresseRegistrado = (ensaio) => {
  showNotification('✅ Interesse Registrado!', {
    body: `Você demonstrou interesse no ensaio de ${ensaio.nome_igreja || 'local'}. Você receberá notificações sobre este ensaio!`,
    data: {
      type: NotificationTypes.INTERESSE_REGISTRADO,
      ensaioId: ensaio.id,
      url: '/dashboard'
    }
  });
};

// Configurar listener para cliques em notificações
export const setupNotificationClickListener = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notification-click') {
        const notificationData = event.data.notificationData;
        
        if (notificationData && notificationData.url) {
          window.location.href = notificationData.url;
        }
      }
    });
  }

  // Nota: O listener 'notificationclick' deve ser registrado no Service Worker,
  // não no contexto do navegador. O Service Worker já está configurado em
  // client/public/service-worker.js para lidar com cliques em notificações.
};

// Inicializar sistema de notificações
export const initNotifications = async () => {
  if (!isNotificationSupported()) {
    console.log('Notificações não são suportadas');
    return false;
  }

  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    setupNotificationClickListener();
    console.log('✅ Sistema de notificações inicializado');
    return true;
  }

  return false;
};

export default {
  isNotificationSupported,
  requestNotificationPermission,
  showNotification,
  notifyEnsaioAprovado,
  notifyNovoEnsaio,
  notifyLembreteEnsaio,
  notifyInteresseRegistrado,
  setupNotificationClickListener,
  initNotifications,
  NotificationTypes
};
