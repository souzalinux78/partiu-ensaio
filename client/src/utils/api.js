import axios from 'axios';

// Função para obter URL base da API
const getApiUrl = () => {
  // FORÇAR localhost:5000 se não estiver em produção explícita
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('partiuensaio.automatizeonline.com.br') || 
                       hostname.includes('partiuensaio.com');
  
  // Se NÃO for produção, SEMPRE usar localhost:5000
  if (!isProduction) {
    const apiUrl = 'http://localhost:5000/api';
    console.log('🔧 FORÇANDO API URL para:', apiUrl);
    console.log('   Hostname:', hostname);
    console.log('   Port:', window.location.port);
    return apiUrl;
  }
  
  // Em produção, usar URL relativa
  return '/api';
};

// Função para obter URL base para imagens/arquivos estáticos
export const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('partiuensaio.automatizeonline.com.br') || 
                       hostname.includes('partiuensaio.com');
  
  // Se estiver em localhost ou desenvolvimento, SEMPRE usar localhost:5000 (backend)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || !isProduction) {
    const baseUrl = 'http://localhost:5000';
    console.log('🖼️ getBaseUrl (dev):', baseUrl);
    return baseUrl;
  }
  
  // Em produção, SEMPRE usar URL absoluta para evitar problemas com:
  // - Service Worker cache
  // - URLs relativas que podem não funcionar corretamente
  // - Problemas de CORS
  // - Cache do navegador
  const protocol = window.location.protocol;
  const currentHostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const baseUrl = `${protocol}//${currentHostname}${port}`;
  
  // Detectar contexto para log
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(
    navigator.userAgent || navigator.vendor || window.opera
  ) || window.innerWidth <= 768;
  
  const context = isStandalone ? 'PWA' : (isMobile ? 'mobile' : 'desktop');
  console.log(`🖼️ getBaseUrl (${context}):`, baseUrl);
  
  return baseUrl;
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token e FORÇAR localhost em desenvolvimento
api.interceptors.request.use(
  (config) => {
    // FORÇAR localhost:5000 se não for produção
    const hostname = window.location.hostname;
    const isProduction = hostname.includes('partiuensaio.automatizeonline.com.br') || 
                         hostname.includes('partiuensaio.com');
    
    if (!isProduction) {
      config.baseURL = 'http://localhost:5000/api';
    }
    
    // Adicionar token JWT do localStorage
    // Adicionar token JWT do localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log apenas em desenvolvimento para debug
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('[API] Token JWT adicionado ao header Authorization para:', config.url || config.baseURL);
      }
    } else {
      // Log apenas em desenvolvimento para debug
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.warn('[API] Nenhum token encontrado no localStorage para:', config.url || config.baseURL);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta para tratar erros globalmente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratar erros de rede
    if (!error.response) {
      console.error('[API] Erro de rede:', error.message);
      error.userMessage = 'Erro de conexão. Verifique sua internet.';
      return Promise.reject(error);
    }

    // Tratar erros HTTP
    const status = error.response.status;
    const data = error.response.data;

    // 401 - Não autorizado (token inválido/expirado)
    if (status === 401) {
      // Limpar token inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirecionar para login apenas se não estiver na página de login
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
      
      error.userMessage = 'Sessão expirada. Faça login novamente.';
      return Promise.reject(error);
    }

    // 403 - Acesso negado
    if (status === 403) {
      // Limpar dados e redirecionar para login se necessário
      const currentPath = window.location.pathname;
      if (currentPath.includes('/admin') || currentPath.includes('/dashboard')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      error.userMessage = data?.error || 'Acesso negado. Você não tem permissão para esta ação.';
      return Promise.reject(error);
    }

    // 404 - Não encontrado
    if (status === 404) {
      error.userMessage = data?.error || 'Recurso não encontrado.';
      return Promise.reject(error);
    }

    // 500 - Erro do servidor
    if (status >= 500) {
      error.userMessage = 'Erro no servidor. Tente novamente mais tarde.';
      console.error('[API] Erro do servidor:', data);
      return Promise.reject(error);
    }

    // Outros erros
    error.userMessage = data?.error || 'Erro ao processar requisição.';
    return Promise.reject(error);
  }
);

export default api;
