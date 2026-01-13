const express = require('express');
const cors = require('cors');
const path = require('path');
// Escolha o banco de dados: 'database' (SQLite) ou 'database-mysql' (MySQL)
const db = require('./database-mysql'); // Para MySQL
// const db = require('./database'); // Para SQLite
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

// Servir arquivos estáticos (uploads) com headers CORS e cache
const uploadsPath = path.join(__dirname, 'uploads');
console.log('📁 Diretório de uploads:', uploadsPath);

// Verificar se o diretório existe
if (!require('fs').existsSync(uploadsPath)) {
  require('fs').mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Diretório de uploads criado');
}

app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log('📤 Servindo arquivo:', filePath);
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

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/ensaio', ensaioRoutes);
app.use('/api/user', userRoutes);
app.use('/api/interesse', interesseRoutes);

// Inicializar banco de dados
(async () => {
  try {
    await db.init();
    console.log('✅ Banco de dados inicializado');
    
    // Criar usuário admin padrão se não existir (já é feito no init do MySQL)
    // db.createDefaultAdmin(); // MySQL já faz isso no init
    
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
  } catch (err) {
    console.error('❌ Erro ao inicializar banco de dados:', err);
    process.exit(1);
  }
})();

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  process.exit(1);
});

module.exports = app;
