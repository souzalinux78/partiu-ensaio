const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'FLoc25GD!',
  multipleStatements: true
};

async function configurarMySQL() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao MySQL');
    
    // Criar banco de dados
    console.log('📦 Criando banco de dados partiu_ensaio...');
    await connection.query('CREATE DATABASE IF NOT EXISTS partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ Banco de dados criado');
    
    // Usar o banco
    await connection.query('USE partiu_ensaio');
    
    // Ler e executar schema
    console.log('📄 Executando schema...');
    const schemaPath = path.join(__dirname, '../database/mysql-schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remover CREATE DATABASE e USE (já executamos)
    schema = schema.replace(/CREATE DATABASE.*?;/gi, '');
    schema = schema.replace(/USE.*?;/gi, '');
    
    // Executar schema completo
    await connection.query(schema);
    console.log('✅ Schema executado');
    
    // Verificar se admin existe
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@partiuensaio.com']);
    
    if (users.length === 0) {
      console.log('👤 Criando usuário admin...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (email, password, name, role, aprovado) VALUES (?, ?, ?, ?, ?)',
        ['admin@partiuensaio.com', hash, 'Administrador', 'admin', 1]
      );
      console.log('✅ Admin criado');
      console.log('   Email: admin@partiuensaio.com');
      console.log('   Senha: admin123');
    } else {
      console.log('✅ Admin já existe');
    }
    
    console.log('\n✅ Configuração MySQL concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Certifique-se de que o arquivo .env está configurado');
    console.log('   2. Reinicie o servidor: npm start');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

configurarMySQL();
