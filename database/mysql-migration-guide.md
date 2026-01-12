# Guia de Migração: SQLite para MySQL

## 📋 Pré-requisitos

1. **MySQL instalado** (versão 5.7+ ou 8.0+)
2. **Acesso root ou usuário com privilégios** para criar banco de dados
3. **Backup do banco SQLite atual** (recomendado)

---

## 🚀 Passo 1: Instalar MySQL

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### Windows
Baixe o instalador em: [dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)

### macOS
```bash
brew install mysql
brew services start mysql
```

---

## 📦 Passo 2: Criar Banco de Dados

### 2.1 Conectar ao MySQL
```bash
mysql -u root -p
```

### 2.2 Executar script de criação
```sql
source database/mysql-schema.sql
```

Ou copie e cole o conteúdo do arquivo `mysql-schema.sql` no terminal MySQL.

---

## 🔄 Passo 3: Migrar Dados do SQLite

### 3.1 Instalar ferramenta de migração (Node.js)
```bash
npm install -g sqlite3-to-mysql
```

### 3.2 Exportar dados do SQLite
```bash
# Criar arquivo de configuração
cat > migration-config.json << EOF
{
  "sqlite": {
    "file": "server/database.sqlite"
  },
  "mysql": {
    "host": "localhost",
    "user": "root",
    "password": "sua-senha",
    "database": "partiu_ensaio"
  }
}
EOF

# Executar migração
sqlite3-to-mysql migration-config.json
```

### 3.3 Migração Manual (Alternativa)

Se a ferramenta automática não funcionar, você pode exportar manualmente:

#### Exportar do SQLite
```bash
sqlite3 server/database.sqlite .dump > dump.sql
```

#### Converter e importar no MySQL
1. Edite o arquivo `dump.sql` para ajustar sintaxe SQLite → MySQL
2. Importe no MySQL:
```bash
mysql -u root -p partiu_ensaio < dump.sql
```

---

## ⚙️ Passo 4: Configurar Aplicação para MySQL

### 4.1 Instalar dependência MySQL
```bash
cd server
npm install mysql2
```

### 4.2 Criar arquivo de configuração MySQL
Crie `server/database-mysql.js`:

```javascript
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuração do banco
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'partiu_ensaio',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

let pool;

const init = async () => {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Testar conexão
    const connection = await pool.getConnection();
    console.log('✅ Conectado ao banco de dados MySQL');
    connection.release();
    
    // Criar tabelas se não existirem
    await createTables();
    await createDefaultAdmin();
    
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err);
    throw err;
  }
};

const createTables = async () => {
  const fs = require('fs');
  const path = require('path');
  const schemaPath = path.join(__dirname, '../database/mysql-schema.sql');
  
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // Executar apenas as queries de CREATE TABLE
    const queries = schema.split(';').filter(q => q.trim().startsWith('CREATE TABLE'));
    
    for (const query of queries) {
      if (query.trim()) {
        await pool.execute(query.trim() + ';');
      }
    }
    
    console.log('✅ Tabelas verificadas/criadas');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err);
    throw err;
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
      console.log('✅ Usuário admin criado');
    } else {
      console.log('✅ Admin já existe');
    }
  } catch (err) {
    console.error('Erro ao criar admin:', err);
  }
};

const getDb = () => pool;

// Wrapper para compatibilidade com código SQLite
const dbWrapper = {
  get: async (query, params = []) => {
    const [rows] = await pool.execute(query, params);
    return rows[0] || null;
  },
  
  all: async (query, params = []) => {
    const [rows] = await pool.execute(query, params);
    return rows;
  },
  
  run: async (query, params = []) => {
    const [result] = await pool.execute(query, params);
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  }
};

module.exports = {
  init,
  getDb: () => dbWrapper,
  createDefaultAdmin
};
```

### 4.3 Atualizar variáveis de ambiente
Crie/atualize `server/.env`:

```env
# MySQL Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua-senha-mysql
DB_NAME=partiu_ensaio

# Server Configuration
PORT=5000
JWT_SECRET=sua-chave-secreta-jwt
NODE_ENV=production
```

### 4.4 Atualizar `server/database.js`
Substitua o conteúdo para usar MySQL ou crie um arquivo separado e atualize as importações.

---

## 🔍 Passo 5: Verificar Migração

### 5.1 Verificar tabelas
```sql
USE partiu_ensaio;
SHOW TABLES;
```

Deve mostrar:
- users
- ensaios
- interesses_ensaios

### 5.2 Verificar dados
```sql
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_ensaios FROM ensaios;
SELECT COUNT(*) as total_interesses FROM interesses_ensaios;
```

### 5.3 Testar login admin
- Email: `admin@partiuensaio.com`
- Senha: `admin123`

---

## 🔧 Ajustes Necessários no Código

### Diferenças SQLite → MySQL

1. **AUTOINCREMENT → AUTO_INCREMENT**
   - ✅ Já corrigido no schema

2. **INTEGER → INT**
   - ✅ Já corrigido no schema

3. **TEXT → VARCHAR/TEXT**
   - ✅ Já corrigido no schema

4. **Datetime → TIMESTAMP**
   - ✅ Já corrigido no schema

5. **Queries com placeholders**
   - SQLite: `?`
   - MySQL: `?` (mesmo formato, mas precisa usar `mysql2`)

6. **FOREIGN KEY constraints**
   - MySQL é mais rigoroso, mas o schema já está correto

---

## 📝 Checklist de Migração

- [ ] MySQL instalado e rodando
- [ ] Banco de dados `partiu_ensaio` criado
- [ ] Tabelas criadas (executar `mysql-schema.sql`)
- [ ] Dados migrados do SQLite
- [ ] `mysql2` instalado no projeto
- [ ] Arquivo `.env` configurado
- [ ] Código atualizado para usar MySQL
- [ ] Testes realizados (login, cadastro, etc.)
- [ ] Backup do SQLite antigo mantido

---

## 🆘 Troubleshooting

### Erro: "Access denied"
```sql
-- Criar usuário e dar permissões
CREATE USER 'partiu_ensaio'@'localhost' IDENTIFIED BY 'senha-segura';
GRANT ALL PRIVILEGES ON partiu_ensaio.* TO 'partiu_ensaio'@'localhost';
FLUSH PRIVILEGES;
```

### Erro: "Table doesn't exist"
- Execute novamente o `mysql-schema.sql`
- Verifique se está usando o banco correto: `USE partiu_ensaio;`

### Erro de charset
```sql
ALTER DATABASE partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Dados não aparecem
- Verifique se a migração foi bem-sucedida
- Confirme que está conectando no banco correto
- Verifique logs de erro do Node.js

---

## 🔄 Reverter para SQLite

Se precisar voltar para SQLite:
1. Mantenha backup do `database.sqlite`
2. Restaure o arquivo `server/database.js` original
3. Remova `mysql2` das dependências

---

## 📚 Recursos

- [Documentação MySQL](https://dev.mysql.com/doc/)
- [mysql2 npm](https://www.npmjs.com/package/mysql2)
- [Diferenças SQLite vs MySQL](https://www.sqlite.org/different.html)
