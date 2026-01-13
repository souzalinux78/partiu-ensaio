const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Configuração do banco MySQL
// Carregar variáveis de ambiente se não estiverem definidas
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'FLoc25GD!',
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
    
    // Verificar e adicionar colunas faltantes (migrações)
    await checkAndAddMissingColumns();
    
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
      tipo ENUM('local', 'regional') NULL COMMENT 'Tipo de encarregado (local ou regional)',
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

const checkAndAddMissingColumns = async () => {
  try {
    // Verificar se a coluna 'tipo' existe na tabela users
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'tipo'
    `, [dbConfig.database]);
    
    if (columns.length === 0) {
      console.log('📝 Adicionando coluna "tipo" na tabela users...');
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN tipo ENUM('local', 'regional') NULL 
        COMMENT 'Tipo de encarregado (local ou regional)' 
        AFTER aprovado
      `);
      console.log('✅ Coluna "tipo" adicionada com sucesso!');
    } else {
      console.log('✅ Coluna "tipo" já existe na tabela users');
    }
  } catch (err) {
    // Se a coluna já existe, ignorar erro
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Coluna "tipo" já existe na tabela users');
    } else {
      console.error('Erro ao verificar/adicionar coluna "tipo":', err.message);
    }
  }
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
const getDb = () => {
  if (!pool) {
    console.error('❌ ERRO: Pool MySQL não inicializado!');
    throw new Error('Banco de dados não inicializado. Chame init() primeiro.');
  }
  
  return {
    get: (query, params = [], callback) => {
      pool.execute(query, params)
        .then(([rows]) => {
          const row = rows[0] || null;
          // Normalizar data DATE do MySQL para formato YYYY-MM-DD
          if (row && row.proxima_data) {
            if (row.proxima_data instanceof Date) {
              const ano = row.proxima_data.getFullYear();
              const mes = String(row.proxima_data.getMonth() + 1).padStart(2, '0');
              const dia = String(row.proxima_data.getDate()).padStart(2, '0');
              row.proxima_data = `${ano}-${mes}-${dia}`;
            } else if (typeof row.proxima_data === 'string') {
              // Se vier como ISO string ou outro formato, converter para YYYY-MM-DD
              if (row.proxima_data.includes('T') || row.proxima_data.includes(' ')) {
                const dataObj = new Date(row.proxima_data);
                if (!isNaN(dataObj.getTime())) {
                  const ano = dataObj.getFullYear();
                  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                  const dia = String(dataObj.getDate()).padStart(2, '0');
                  row.proxima_data = `${ano}-${mes}-${dia}`;
                }
              }
              // Se já estiver no formato YYYY-MM-DD, manter
            }
          }
          // Também normalizar data_ensaio se existir
          if (row && row.data_ensaio) {
            if (row.data_ensaio instanceof Date) {
              const ano = row.data_ensaio.getFullYear();
              const mes = String(row.data_ensaio.getMonth() + 1).padStart(2, '0');
              const dia = String(row.data_ensaio.getDate()).padStart(2, '0');
              row.data_ensaio = `${ano}-${mes}-${dia}`;
            } else if (typeof row.data_ensaio === 'string' && (row.data_ensaio.includes('T') || row.data_ensaio.includes(' '))) {
              const dataObj = new Date(row.data_ensaio);
              if (!isNaN(dataObj.getTime())) {
                const ano = dataObj.getFullYear();
                const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                const dia = String(dataObj.getDate()).padStart(2, '0');
                row.data_ensaio = `${ano}-${mes}-${dia}`;
              }
            }
          }
          callback(null, row);
        })
        .catch((err) => {
          console.error('Erro na query get:', err.message);
          callback(err, null);
        });
    },
    
    all: (query, params = [], callback) => {
      pool.execute(query, params)
        .then(([rows]) => {
          // Normalizar datas DATE do MySQL para formato YYYY-MM-DD
          const rowsNormalizados = rows.map(row => {
            if (row && row.proxima_data) {
              const tipoOriginal = typeof row.proxima_data;
              const valorOriginal = row.proxima_data;
              
              if (row.proxima_data instanceof Date) {
                const ano = row.proxima_data.getFullYear();
                const mes = String(row.proxima_data.getMonth() + 1).padStart(2, '0');
                const dia = String(row.proxima_data.getDate()).padStart(2, '0');
                row.proxima_data = `${ano}-${mes}-${dia}`;
                console.log(`[DB-WRAPPER] Normalizado Date para string: ${valorOriginal} -> ${row.proxima_data}`);
              } else if (typeof row.proxima_data === 'string') {
                // Se vier como ISO string ou outro formato, converter para YYYY-MM-DD
                if (row.proxima_data.includes('T') || row.proxima_data.includes(' ')) {
                  const dataObj = new Date(row.proxima_data);
                  if (!isNaN(dataObj.getTime())) {
                    const ano = dataObj.getFullYear();
                    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                    const dia = String(dataObj.getDate()).padStart(2, '0');
                    row.proxima_data = `${ano}-${mes}-${dia}`;
                    console.log(`[DB-WRAPPER] Normalizado ISO string para YYYY-MM-DD: ${valorOriginal} -> ${row.proxima_data}`);
                  }
                } else {
                  console.log(`[DB-WRAPPER] proxima_data já está no formato correto: ${row.proxima_data}`);
                }
                // Se já estiver no formato YYYY-MM-DD, manter
              } else {
                console.warn(`[DB-WRAPPER] Tipo inesperado de proxima_data: ${tipoOriginal}, valor: ${valorOriginal}`);
              }
            } else if (row && !row.proxima_data) {
              console.log(`[DB-WRAPPER] Ensaio ${row.id} não tem proxima_data`);
            }
            // Também normalizar data_ensaio se existir
            if (row && row.data_ensaio) {
              if (row.data_ensaio instanceof Date) {
                const ano = row.data_ensaio.getFullYear();
                const mes = String(row.data_ensaio.getMonth() + 1).padStart(2, '0');
                const dia = String(row.data_ensaio.getDate()).padStart(2, '0');
                row.data_ensaio = `${ano}-${mes}-${dia}`;
              } else if (typeof row.data_ensaio === 'string' && (row.data_ensaio.includes('T') || row.data_ensaio.includes(' '))) {
                const dataObj = new Date(row.data_ensaio);
                if (!isNaN(dataObj.getTime())) {
                  const ano = dataObj.getFullYear();
                  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                  const dia = String(dataObj.getDate()).padStart(2, '0');
                  row.data_ensaio = `${ano}-${mes}-${dia}`;
                }
              }
            }
            return row;
          });
          callback(null, rowsNormalizados);
        })
        .catch((err) => {
          console.error('Erro na query all:', err.message);
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
            // Verificar assinatura do callback
            // SQLite usa: function(err) ou function(this) onde this.lastID existe
            // Vamos suportar ambos os formatos
            if (callback.length === 1) {
              // Callback com 1 parâmetro - passar contexto como 'this'
              callback.call(context, null);
            } else if (callback.length === 2) {
              // Callback com 2 parâmetros - (err, result)
              callback(null, context);
            } else {
              // Callback sem parâmetros ou formato desconhecido
              callback.call(context);
            }
          }
        })
        .catch((err) => {
          console.error('Erro na query run:', err.message);
          if (callback) {
            if (callback.length === 1) {
              // Passar erro como 'this' não faz sentido, passar como primeiro parâmetro
              callback(err);
            } else if (callback.length === 2) {
              callback(err, null);
            } else {
              callback(err);
            }
          }
        });
    }
  };
};

module.exports = {
  init,
  getDb,
  createDefaultAdmin
};
