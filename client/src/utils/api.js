import axios from 'axios';

// Função para obter URL base da API
const getApiUrl = () => {
  // Se estiver em produção e tiver variável de ambiente, usar ela
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Se estiver em localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  // Em produção, usar URL relativa (mesmo domínio)
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

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
  (config) => {
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
