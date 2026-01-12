const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        reject(err);
        return;
      }
      console.log('Conectado ao banco de dados SQLite');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'encarregado',
        aprovado INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          reject(err);
          return;
        }
        // Migração: adicionar colunas se não existirem
        db.all("PRAGMA table_info(users)", (err, columns) => {
          if (err) {
            console.error('Erro ao verificar colunas users:', err);
            return;
          }
          const existingColumns = columns.map(col => col.name.toLowerCase());
          const columnsToAdd = [];
          
          if (!existingColumns.includes('aprovado')) {
            columnsToAdd.push({ name: 'aprovado', def: 'INTEGER DEFAULT 1' });
          }
          if (!existingColumns.includes('instrumento')) {
            columnsToAdd.push({ name: 'instrumento', def: 'TEXT' });
          }
          if (!existingColumns.includes('categoria_instrumento')) {
            columnsToAdd.push({ name: 'categoria_instrumento', def: 'TEXT' });
          }
          if (!existingColumns.includes('celular')) {
            columnsToAdd.push({ name: 'celular', def: 'TEXT' });
          }
          if (!existingColumns.includes('cidade')) {
            columnsToAdd.push({ name: 'cidade', def: 'TEXT' });
          }
          if (!existingColumns.includes('estado')) {
            columnsToAdd.push({ name: 'estado', def: 'TEXT' });
          }
          
          // Adicionar colunas uma por uma
          columnsToAdd.forEach((col) => {
            db.run(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`, (err) => {
              if (err) {
                if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                  console.log(`Coluna ${col.name} já existe na tabela users`);
                } else {
                  console.error(`Erro ao adicionar coluna ${col.name} na tabela users:`, err.message);
                }
              } else {
                console.log(`Coluna ${col.name} adicionada com sucesso na tabela users`);
              }
            });
          });
        });
      });

      // Tabela de ensaios
      db.run(`CREATE TABLE IF NOT EXISTS ensaios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        nome_encarregado TEXT NOT NULL,
        tipo TEXT NOT NULL,
        celular TEXT NOT NULL,
        dia_semana TEXT,
        semana_mes INTEGER,
        proxima_data TEXT,
        horario TEXT NOT NULL,
        nome_igreja TEXT NOT NULL,
        endereco TEXT NOT NULL,
        cidade TEXT,
        estado TEXT,
        instrumento TEXT,
        categoria_instrumento TEXT,
        foto_local TEXT,
        status TEXT NOT NULL DEFAULT 'pendente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          reject(err);
          return;
        }
        // Migração: adicionar novas colunas se a tabela já existir
        // SQLite não suporta IF NOT EXISTS em ALTER TABLE, então verificamos antes
        db.all("PRAGMA table_info(ensaios)", (err, columns) => {
          if (err) {
            console.error('Erro ao verificar colunas:', err);
            resolve();
            return;
          }
          
          const existingColumns = columns.map(col => col.name.toLowerCase());
          const columnsToAdd = [];
          
          // Verificar quais colunas precisam ser adicionadas
          if (!existingColumns.includes('nome_encarregado')) {
            columnsToAdd.push({ name: 'nome_encarregado', def: 'TEXT' });
          }
          if (!existingColumns.includes('tipo')) {
            columnsToAdd.push({ name: 'tipo', def: 'TEXT' });
          }
          if (!existingColumns.includes('celular')) {
            columnsToAdd.push({ name: 'celular', def: 'TEXT' });
          }
          if (!existingColumns.includes('dia_semana')) {
            columnsToAdd.push({ name: 'dia_semana', def: 'TEXT' });
          }
          if (!existingColumns.includes('semana_mes')) {
            columnsToAdd.push({ name: 'semana_mes', def: 'INTEGER' });
          }
          if (!existingColumns.includes('proxima_data')) {
            columnsToAdd.push({ name: 'proxima_data', def: 'TEXT' });
          }
          if (!existingColumns.includes('nome_igreja')) {
            columnsToAdd.push({ name: 'nome_igreja', def: 'TEXT' });
          }
          if (!existingColumns.includes('endereco')) {
            columnsToAdd.push({ name: 'endereco', def: 'TEXT' });
          }
          if (!existingColumns.includes('instrumento')) {
            columnsToAdd.push({ name: 'instrumento', def: 'TEXT' });
          }
          if (!existingColumns.includes('categoria_instrumento')) {
            columnsToAdd.push({ name: 'categoria_instrumento', def: 'TEXT' });
          }
          if (!existingColumns.includes('cidade')) {
            columnsToAdd.push({ name: 'cidade', def: 'TEXT' });
          }
          if (!existingColumns.includes('estado')) {
            columnsToAdd.push({ name: 'estado', def: 'TEXT' });
          }
          
          // Adicionar colunas uma por uma de forma síncrona
          if (columnsToAdd.length === 0) {
            console.log('Todas as colunas já existem no banco de dados');
            // Criar tabela de interesses mesmo quando não há colunas para adicionar
            createInteressesTable().then(() => {
              resolve();
            }).catch((err) => {
              console.error('Erro ao criar tabela de interesses:', err);
              resolve(); // Continuar mesmo se falhar
            });
            return;
          }
          
          let completed = 0;
          columnsToAdd.forEach((col) => {
            db.run(`ALTER TABLE ensaios ADD COLUMN ${col.name} ${col.def}`, (err) => {
              if (err) {
                // Se a coluna já existe, ignorar o erro
                if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                  console.log(`Coluna ${col.name} já existe`);
                } else {
                  console.error(`Erro ao adicionar coluna ${col.name}:`, err.message);
                }
              } else {
                console.log(`Coluna ${col.name} adicionada com sucesso`);
              }
              
              completed++;
              if (completed === columnsToAdd.length) {
                // Criar tabela de interesses de músicos em ensaios
                createInteressesTable().then(() => {
                  resolve();
                }).catch((err) => {
                  console.error('Erro ao criar tabela de interesses:', err);
                  resolve(); // Continuar mesmo se falhar
                });
              }
            });
          });
        });
      });
    });
  });
};

// Criar tabela de interesses de músicos em ensaios
const createInteressesTable = () => {
  return new Promise((resolve, reject) => {
    db.run(`CREATE TABLE IF NOT EXISTS interesses_ensaios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ensaio_id INTEGER NOT NULL,
      musico_id INTEGER NOT NULL,
      data_ensaio TEXT NOT NULL,
      webhook_enviado INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ensaio_id) REFERENCES ensaios(id),
      FOREIGN KEY (musico_id) REFERENCES users(id),
      UNIQUE(ensaio_id, musico_id, data_ensaio)
    )`, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Tabela de interesses criada/verificada com sucesso');
      resolve();
    });
  });
};

const createDefaultAdmin = () => {
  const adminEmail = 'admin@partiuensaio.com';
  const adminPassword = 'admin123';
  
  console.log('=== VERIFICANDO/CRIANDO ADMIN ===');
  console.log('Email:', adminEmail);
  
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
    if (err) {
      console.error('❌ Erro ao verificar admin:', err);
      return;
    }
    
    if (!row) {
      console.log('Admin não existe, criando...');
      bcrypt.hash(adminPassword, 10, (err, hash) => {
        if (err) {
          console.error('❌ Erro ao criar hash:', err);
          return;
        }
        
        db.run(
          'INSERT INTO users (email, password, name, role, aprovado) VALUES (?, ?, ?, ?, ?)',
          [adminEmail, hash, 'Administrador', 'admin', 1],
          (err) => {
            if (err) {
              console.error('❌ Erro ao criar admin:', err);
            } else {
              console.log('✅ Usuário admin criado com sucesso!');
              console.log('   Email: admin@partiuensaio.com');
              console.log('   Senha: admin123');
            }
          }
        );
      });
    } else {
      console.log('✅ Admin já existe no banco de dados');
      console.log('   ID:', row.id);
      console.log('   Email:', row.email);
      console.log('   Role:', row.role);
      console.log('   Aprovado:', row.aprovado);
      
      // Garantir que o admin está aprovado
      if (row.aprovado !== 1) {
        console.log('⚠️ Admin não está aprovado, atualizando...');
        db.run('UPDATE users SET aprovado = 1 WHERE email = ? AND role = ?', [adminEmail, 'admin'], (err) => {
          if (err) {
            console.error('❌ Erro ao atualizar admin:', err);
          } else {
            console.log('✅ Admin atualizado para aprovado = 1');
          }
        });
      }
    }
  });
};

const getDb = () => db;

module.exports = {
  init,
  getDb,
  createDefaultAdmin
};
