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
  // Se estiver em localhost, usar localhost:5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // Em produção, usar URL relativa (mesmo domínio)
  return '';
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
