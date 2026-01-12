const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const ensaioRoutes = require('./routes/ensaio');
const userRoutes = require('./routes/user');
const interesseRoutes = require('./routes/interesse');

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/ensaio', ensaioRoutes);
app.use('/api/user', userRoutes);
app.use('/api/interesse', interesseRoutes);

// Inicializar banco de dados
db.init().then(() => {
  console.log('✅ Banco de dados inicializado');
  
  // Criar usuário admin padrão se não existir
  db.createDefaultAdmin();
  
  // Iniciar sistema de notificações de ensaios
  const { iniciarVerificacaoPeriodica } = require('./utils/webhookNotificacao');
  iniciarVerificacaoPeriodica();
  
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}/api`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ ERRO: A porta ${PORT} já está em uso!\n`);
      console.error('Para resolver, execute um dos comandos abaixo:\n');
      console.error('Windows PowerShell:');
      console.error('  $pid = (Get-NetTCPConnection -LocalPort 5000).OwningProcess');
      console.error('  Stop-Process -Id $pid -Force\n');
      console.error('Ou use:');
      console.error('  netstat -ano | findstr :5000');
      console.error('  taskkill /PID <número_do_pid> /F\n');
      console.error('Ou altere a porta no arquivo .env:\n');
      console.error('  PORT=5001\n');
    } else {
      console.error('Erro ao iniciar servidor:', err);
    }
    process.exit(1);
  });
}).catch((err) => {
  console.error('❌ Erro ao inicializar banco de dados:', err);
  process.exit(1);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  process.exit(1);
});

module.exports = app;
