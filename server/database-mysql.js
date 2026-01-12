const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Configuração do banco MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'partiu_ensaio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

let pool;

const init = async () => {
  try {
    // Criar pool de conexões
    pool = mysql.createPool(dbConfig);
    
    // Testar conexão
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados MySQL');
    connection.release();
    
    // Verificar/criar tabelas
    await createTables();
    
    // Criar admin padrão
    await createDefaultAdmin();
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
    throw err;
  }
};

const createTables = async () => {
  try {
    // Ler schema SQL
    const schemaPath = path.join(__dirname, '../database/mysql-schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Separar queries (remover comentários e linhas vazias)
      const queries = schema
        .split(';')
        .map(q => q.trim())
        .filter(q => q && !q.startsWith('--') && !q.startsWith('/*'));
      
      // Executar apenas CREATE TABLE
      for (const query of queries) {
        if (query.toUpperCase().includes('CREATE TABLE')) {
          try {
            await pool.execute(query + ';');
            console.log('✅ Tabela verificada/criada');
          } catch (err) {
            // Se a tabela já existe, ignorar erro
            if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
              console.error('Erro ao criar tabela:', err.message);
            }
          }
        }
      }
    } else {
      // Criar tabelas manualmente se o arquivo não existir
      await createTablesManually();
    }
    
    console.log('✅ Estrutura do banco verificada');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
    throw err;
  }
};

const createTablesManually = async () => {
  // Tabela users
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('admin', 'encarregado', 'musico') NOT NULL DEFAULT 'encarregado',
      aprovado TINYINT(1) DEFAULT 1,
      instrumento VARCHAR(100) NULL,
      categoria_instrumento VARCHAR(50) NULL,
      celular VARCHAR(20) NULL,
      cidade VARCHAR(100) NULL,
      estado VARCHAR(2) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_aprovado (aprovado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Tabela ensaios
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ensaios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      nome_encarregado VARCHAR(255) NOT NULL,
      tipo ENUM('local', 'regional') NOT NULL,
      celular VARCHAR(20) NOT NULL,
      dia_semana VARCHAR(50) NULL,
      semana_mes INT NULL,
      proxima_data DATE NULL,
      horario TIME NOT NULL,
      nome_igreja VARCHAR(255) NOT NULL,
      endereco TEXT NOT NULL,
      cidade VARCHAR(100) NULL,
      estado VARCHAR(2) NULL,
      instrumento VARCHAR(100) NULL,
      categoria_instrumento VARCHAR(50) NULL,
      foto_local VARCHAR(500) NULL,
      status ENUM('pendente', 'aprovado', 'rejeitado', 'cancelado') NOT NULL DEFAULT 'pendente',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_proxima_data (proxima_data),
      INDEX idx_cidade (cidade),
      INDEX idx_estado (estado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Tabela interesses_ensaios
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS interesses_ensaios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ensaio_id INT NOT NULL,
      musico_id INT NOT NULL,
      data_ensaio DATE NOT NULL,
      webhook_enviado TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ensaio_id) REFERENCES ensaios(id) ON DELETE CASCADE,
      FOREIGN KEY (musico_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uk_ensaio_musico_data (ensaio_id, musico_id, data_ensaio),
      INDEX idx_ensaio_id (ensaio_id),
      INDEX idx_musico_id (musico_id),
      INDEX idx_data_ensaio (data_ensaio)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const createDefaultAdmin = async () => {
  const adminEmail = 'admin@partiuensaio.com';
  const adminPassword = 'admin123';
  
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [adminEmail]);
    
    if (rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.execute(
        'INSERT INTO users (email, password, name, role, aprovado) VALUES (?, ?, ?, ?, ?)',
        [adminEmail, hash, 'Administrador', 'admin', 1]
      );
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('   Email: admin@partiuensaio.com');
      console.log('   Senha: admin123');
    } else {
      const user = rows[0];
      console.log('✅ Admin já existe no banco de dados');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Aprovado:', user.aprovado);
      
      // Garantir que o admin está aprovado
      if (user.aprovado !== 1) {
        await pool.execute(
          'UPDATE users SET aprovado = 1 WHERE email = ? AND role = ?',
          [adminEmail, 'admin']
        );
        console.log('✅ Admin atualizado para aprovado = 1');
      }
    }
  } catch (err) {
    console.error('Erro ao criar/verificar admin:', err);
  }
};

// Wrapper para compatibilidade com código SQLite
// Converte callbacks para promises e mantém a mesma interface
const dbWrapper = {
  get: (query, params = [], callback) => {
    pool.execute(query, params)
      .then(([rows]) => {
        callback(null, rows[0] || null);
      })
      .catch((err) => {
        callback(err, null);
      });
  },
  
  all: (query, params = [], callback) => {
    pool.execute(query, params)
      .then(([rows]) => {
        callback(null, rows);
      })
      .catch((err) => {
        callback(err, null);
      });
  },
  
  run: (query, params = [], callback) => {
    pool.execute(query, params)
      .then(([result]) => {
        // Criar objeto compatível com SQLite
        const context = {
          lastID: result.insertId,
          changes: result.affectedRows
        };
        
        if (callback) {
          // Se callback tem 1 parâmetro, é função de erro
          // Se tem 2, é (err, result)
          if (callback.length === 1) {
            callback(context);
          } else {
            callback(null, context);
          }
        }
      })
      .catch((err) => {
        if (callback) {
          if (callback.length === 1) {
            callback(err);
          } else {
            callback(err, null);
          }
        }
      });
  }
};

const getDb = () => dbWrapper;

module.exports = {
  init,
  getDb,
  createDefaultAdmin
};
