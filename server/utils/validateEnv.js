// Validador de variáveis de ambiente obrigatórias
const logger = require('./logger');

const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

const OPTIONAL_ENV_VARS = {
  'PORT': '5000',
  'NODE_ENV': 'development',
  'APP_TIMEZONE': 'America/Sao_Paulo',
  'VAPID_PUBLIC_KEY': null,
  'VAPID_PRIVATE_KEY': null,
  'VAPID_SUBJECT': 'mailto:admin@partiuensaio.com',
  'LOG_LEVEL': 'info'
};

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Verificar variáveis obrigatórias
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Verificar variáveis opcionais e definir defaults
  Object.keys(OPTIONAL_ENV_VARS).forEach(varName => {
    if (!process.env[varName]) {
      if (OPTIONAL_ENV_VARS[varName] !== null) {
        process.env[varName] = OPTIONAL_ENV_VARS[varName];
        logger.info(`Variável ${varName} não definida, usando padrão: ${OPTIONAL_ENV_VARS[varName]}`);
      } else {
        warnings.push(varName);
      }
    }
  });

  // Verificar JWT_SECRET em produção
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'seu_secret_key_aqui_mude_em_producao' || 
        !process.env.JWT_SECRET || 
        process.env.JWT_SECRET.length < 32) {
      logger.error('⚠️ JWT_SECRET não está configurado corretamente para produção!');
      logger.error('   Configure uma chave secreta forte (mínimo 32 caracteres) no .env');
      missing.push('JWT_SECRET (produção)');
    }
  }

  // Verificar VAPID keys se push está habilitado
  if (process.env.VAPID_PUBLIC_KEY && !process.env.VAPID_PRIVATE_KEY) {
    warnings.push('VAPID_PRIVATE_KEY (push notifications desabilitado)');
  }

  if (missing.length > 0) {
    logger.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missing.forEach(varName => {
      logger.error(`   - ${varName}`);
    });
    logger.error('\nConfigure essas variáveis no arquivo .env antes de iniciar o servidor.');
    return false;
  }

  if (warnings.length > 0) {
    logger.warn('⚠️ Variáveis opcionais não configuradas:');
    warnings.forEach(varName => {
      logger.warn(`   - ${varName} (funcionalidade pode estar desabilitada)`);
    });
  }

  logger.info('✅ Validação de variáveis de ambiente concluída');
  return true;
}

module.exports = { validateEnvironment, REQUIRED_ENV_VARS, OPTIONAL_ENV_VARS };
