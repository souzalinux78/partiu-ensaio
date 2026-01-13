const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'FLoc25GD!',
  database: 'partiu_ensaio'
};

async function criarAdmin() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(config);
    
    // Verificar se admin existe
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@partiuensaio.com']);
    
    if (users.length > 0) {
      console.log('✅ Admin já existe. Atualizando senha...');
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(
        'UPDATE users SET password = ?, aprovado = 1, role = ? WHERE email = ?',
        [hash, 'admin', 'admin@partiuensaio.com']
      );
      console.log('✅ Senha do admin atualizada!');
    } else {
      console.log('👤 Criando admin...');
      const hash = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (email, password, name, role, aprovado) VALUES (?, ?, ?, ?, ?)',
        ['admin@partiuensaio.com', hash, 'Administrador', 'admin', 1]
      );
      console.log('✅ Admin criado!');
    }
    
    console.log('\n📋 Credenciais:');
    console.log('   Email: admin@partiuensaio.com');
    console.log('   Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

criarAdmin();
