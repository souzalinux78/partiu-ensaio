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
      console.log('🔧 FORÇANDO baseURL para:', config.baseURL);
      console.log('   URL completa será:', config.baseURL + config.url);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
