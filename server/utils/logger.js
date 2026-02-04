// Sistema de logs padronizado para produção
const IS_PROD = process.env.NODE_ENV === 'production';

const logger = {
  info: (message, ...args) => {
    if (!IS_PROD || process.env.LOG_LEVEL === 'debug') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message, error = null, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
    if (error) {
      console.error('Stack:', error.stack);
      if (error.response) {
        console.error('Response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  },
  
  debug: (message, ...args) => {
    if (!IS_PROD || process.env.LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};

module.exports = logger;
