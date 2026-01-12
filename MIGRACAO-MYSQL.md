# Guia de Migração: SQLite para MySQL

## 📋 Arquivos que Precisam ser Alterados

### ✅ Arquivos que SERÃO CRIADOS/MODIFICADOS:

1. **`server/database-mysql.js`** ✅ (NOVO - já criado)
2. **`server/package.json`** - Adicionar dependência `mysql2`
3. **`server/.env`** - Adicionar configurações MySQL
4. **`server/index.js`** - Alterar import do database
5. **`server/routes/ensaio.js`** - Remover PRAGMA (específico SQLite)

---

## 🚀 Passo 1: Instalar Dependência MySQL

### 1.1 Instalar mysql2
```bash
cd server
npm install mysql2
```

---

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

### 2.1 Criar/Atualizar `server/.env`
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

**⚠️ IMPORTANTE:** Substitua `sua-senha-mysql` pela senha do seu MySQL!

---

## 🔄 Passo 3: Alterar Arquivo Principal

### 3.1 Alterar `server/index.js`

**ANTES:**
```javascript
const db = require('./database');
```

**DEPOIS:**
```javascript
const db = require('./database-mysql');
```

---

## 🔧 Passo 4: Ajustar Rotas (Remover PRAGMA)

### 4.1 Alterar `server/routes/ensaio.js`

**Localizar e REMOVER/COMENTAR:**
```javascript
// REMOVER ESTA FUNÇÃO (específica do SQLite)
const checkLocalColumn = (db) => {
  return new Promise((resolve) => {
    db.all("PRAGMA table_info(ensaios)", (err, columns) => {
      // ... código ...
    });
  });
};
```

**E REMOVER a chamada:**
```javascript
checkLocalColumn(db).then((hasLocalColumn) => {
  // ... código ...
});
```

**SUBSTITUIR por:**
```javascript
// MySQL não precisa verificar coluna 'local' - já não existe no schema
// Usar diretamente o INSERT sem a coluna 'local'
```

---

## 📦 Passo 5: Criar Banco de Dados MySQL

### 5.1 Conectar ao MySQL
```bash
mysql -u root -p
```

### 5.2 Executar script de criação
```sql
source database/mysql-schema.sql
```

Ou copie e cole o conteúdo do arquivo `database/mysql-schema.sql` no terminal MySQL.

### 5.3 Criar admin padrão (opcional)
```sql
source database/mysql-insert-admin.sql
```

---

## ✅ Passo 6: Testar

### 6.1 Iniciar servidor
```bash
cd server
npm start
```

### 6.2 Verificar logs
Deve aparecer:
```
✅ Conectado ao banco de dados MySQL
✅ Estrutura do banco verificada
✅ Admin já existe no banco de dados
```

### 6.3 Testar login
- Email: `admin@partiuensaio.com`
- Senha: `admin123`

---

## 📝 Resumo das Alterações

### Arquivos Modificados:

1. ✅ **`server/database-mysql.js`** (NOVO)
   - Versão MySQL do database.js
   - Mantém compatibilidade com código existente

2. ⚠️ **`server/package.json`**
   - Adicionar: `"mysql2": "^3.6.0"`

3. ⚠️ **`server/.env`**
   - Adicionar configurações MySQL

4. ⚠️ **`server/index.js`**
   - Alterar: `require('./database')` → `require('./database-mysql')`

5. ⚠️ **`server/routes/ensaio.js`**
   - Remover função `checkLocalColumn` (PRAGMA)
   - Ajustar INSERT para não usar coluna 'local'

---

## 🔄 Reverter para SQLite (Se necessário)

Se precisar voltar para SQLite:

1. Alterar `server/index.js`:
   ```javascript
   const db = require('./database'); // Voltar para SQLite
   ```

2. Remover `mysql2`:
   ```bash
   npm uninstall mysql2
   ```

3. Remover configurações MySQL do `.env`

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'mysql2'"
```bash
cd server
npm install mysql2
```

### Erro: "Access denied for user"
- Verifique usuário e senha no `.env`
- Verifique se o MySQL está rodando
- Teste conexão: `mysql -u root -p`

### Erro: "Unknown database 'partiu_ensaio'"
```sql
CREATE DATABASE partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro: "Table doesn't exist"
- Execute: `source database/mysql-schema.sql`

---

## 📋 Checklist Final

- [ ] `mysql2` instalado
- [ ] `server/.env` configurado com MySQL
- [ ] Banco `partiu_ensaio` criado
- [ ] Tabelas criadas (executar `mysql-schema.sql`)
- [ ] `server/index.js` alterado para usar `database-mysql`
- [ ] `server/routes/ensaio.js` ajustado (remover PRAGMA)
- [ ] Servidor inicia sem erros
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Ensaios funcionam

---

## 🎯 Próximos Passos

Após migrar para MySQL:
1. Teste todas as funcionalidades
2. Faça backup do banco MySQL
3. Remova `database.sqlite` (se não precisar mais)
4. Atualize documentação
