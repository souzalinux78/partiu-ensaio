// Carregar .env da pasta server (PM2 pode iniciar com cwd diferente)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validar variáveis de ambiente antes de continuar
const { validateEnvironment } = require('./utils/validateEnv');
const logger = require('./utils/logger');

if (!validateEnvironment()) {
  logger.error('❌ Falha na validação de variáveis de ambiente. Encerrando...');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
// Escolha o banco de dados: 'database' (SQLite) ou 'database-mysql' (MySQL)
const db = require('./database-mysql'); // Para MySQL
// const db = require('./database'); // Para SQLite
const authRoutes = require('./routes/auth');
const ensaioRoutes = require('./routes/ensaio');
const userRoutes = require('./routes/user');
const interesseRoutes = require('./routes/interesse');
const pushRoutes = require('./routes/push');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads) com headers CORS e cache
const uploadsPath = path.join(__dirname, 'uploads');
logger.info('📁 Diretório de uploads:', uploadsPath);

// Verificar se o diretório existe
if (!require('fs').existsSync(uploadsPath)) {
  require('fs').mkdirSync(uploadsPath, { recursive: true });
  logger.info('✅ Diretório de uploads criado');
}

// Servir arquivos estáticos (uploads) com headers CORS e cache
// O express.static já retorna 404 automaticamente se o arquivo não existir
// O frontend trata isso com placeholder via ImageWithFallback
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Adicionar headers CORS para imagens
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Cache de 1 dia para imagens (pode ser atualizado se necessário)
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Garantir Content-Type correto
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
  }
}));

// Rota de teste para verificar se uploads está funcionando
app.get('/test-uploads', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(uploadsPath);
  res.json({
    uploadsPath,
    filesCount: files.length,
    files: files.slice(0, 10) // Primeiros 10 arquivos
  });
});

// Rota para gerador de ícones (desenvolvimento)
app.get('/gerar-icones', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/gerar-icones-e-cores.html'));
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/ensaio', ensaioRoutes);
app.use('/api/ensaios', require('./routes/ensaios')); // Rotas plural para n8n
app.use('/api/user', userRoutes);
app.use('/api/interesse', interesseRoutes);
app.use('/api/presencas', require('./routes/presencas')); // Rotas de presença via WhatsApp
app.use('/api/dashboard', require('./routes/dashboard')); // Rotas de dashboard web
app.use('/api/push', pushRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint (sem autenticação)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado na rota:', req.path, err);
  
  // Não expor detalhes do erro em produção
  const isProd = process.env.NODE_ENV === 'production';
  const errorMessage = isProd 
    ? 'Erro interno do servidor' 
    : err.message || 'Erro interno do servidor';
  
  res.status(err.status || 500).json({
    error: errorMessage,
    ...(isProd ? {} : { stack: err.stack })
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicializar banco de dados
(async () => {
  try {
    await db.init();
    logger.info('✅ Banco de dados inicializado');
    
    // Criar usuário admin padrão se não existir (já é feito no init do MySQL)
    // db.createDefaultAdmin(); // MySQL já faz isso no init
    
    // Iniciar sistema de notificações de ensaios
    const { iniciarVerificacaoPeriodica } = require('./utils/webhookNotificacao');
    iniciarVerificacaoPeriodica();

    // Iniciar scheduler de Push (lembretes 10/11/12)
    const { iniciarPushScheduler } = require('./utils/pushScheduler');
    iniciarPushScheduler();
    
    app.listen(PORT, () => {
      logger.info(`✅ Servidor rodando na porta ${PORT}`);
      logger.info(`📡 API disponível em http://localhost:${PORT}/api`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`\n❌ ERRO: A porta ${PORT} já está em uso!\n`);
        logger.error('Para resolver, execute um dos comandos abaixo:\n');
        logger.error('Windows PowerShell:');
        logger.error('  $pid = (Get-NetTCPConnection -LocalPort 5000).OwningProcess');
        logger.error('  Stop-Process -Id $pid -Force\n');
        logger.error('Ou use:');
        logger.error('  netstat -ano | findstr :5000');
        logger.error('  taskkill /PID <número_do_pid> /F\n');
        logger.error('Ou altere a porta no arquivo .env:\n');
        logger.error('  PORT=5001\n');
      } else {
        logger.error('Erro ao iniciar servidor:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    logger.error('❌ Erro ao inicializar banco de dados:', err);
    process.exit(1);
  }
})();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', reason);
  logger.error('Promise:', promise);
  // Em produção, não encerrar o processo imediatamente
  if (process.env.NODE_ENV === 'production') {
    logger.error('Continuando execução em produção...');
  }
});

process.on('uncaughtException', (err) => {
  logger.error('Exceção não capturada:', err);
  logger.error('Stack:', err.stack);
  // Encerrar processo apenas em produção para evitar estado inconsistente
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app;
