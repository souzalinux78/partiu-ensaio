# 📋 Lista de Arquivos para Migração MySQL

## ✅ Arquivos JÁ ALTERADOS

1. ✅ **`server/database-mysql.js`** (NOVO)
   - Versão MySQL do database.js
   - Mantém compatibilidade com código existente

2. ✅ **`server/index.js`**
   - Alterado para usar `database-mysql`
   - Comentário para voltar ao SQLite se necessário

3. ✅ **`server/package.json`**
   - Adicionado: `"mysql2": "^3.6.5"`

4. ✅ **`server/routes/ensaio.js`**
   - Função `checkLocalColumn` simplificada (retorna false para MySQL)

5. ✅ **`server/routes/auth.js`**
   - Removido PRAGMA table_info
   - INSERT direto com todas as colunas (MySQL já tem todas)

6. ✅ **`server/.env.example`** (NOVO)
   - Template de configuração MySQL

---

## ⚠️ AÇÕES NECESSÁRIAS NO SERVIDOR

### 1. Instalar Dependência MySQL

```bash
cd server
npm install mysql2
```

### 2. Criar Arquivo `.env`

Copie `server/.env.example` para `server/.env` e configure:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua-senha-mysql
DB_NAME=partiu_ensaio
PORT=5000
JWT_SECRET=sua-chave-secreta
```

### 3. Criar Banco de Dados MySQL

```sql
CREATE DATABASE partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Executar Schema

```bash
mysql -u root -p partiu_ensaio < database/mysql-schema.sql
```

### 5. Criar Admin (Opcional)

```bash
mysql -u root -p partiu_ensaio < database/mysql-insert-admin.sql
```

---

## 🔄 Voltar para SQLite (Se Necessário)

Se precisar voltar para SQLite:

1. **Alterar `server/index.js`:**
   ```javascript
   // const db = require('./database-mysql'); // MySQL
   const db = require('./database'); // SQLite
   ```

2. **Remover mysql2:**
   ```bash
   npm uninstall mysql2
   ```

---

## 📝 Resumo das Mudanças

### Arquivos Modificados:
- ✅ `server/index.js` - Import do database
- ✅ `server/package.json` - Dependência mysql2
- ✅ `server/routes/ensaio.js` - Removido PRAGMA
- ✅ `server/routes/auth.js` - Removido PRAGMA, INSERT direto

### Arquivos Criados:
- ✅ `server/database-mysql.js` - Driver MySQL
- ✅ `server/.env.example` - Template de configuração

### Arquivos NÃO Modificados (Funcionam com MySQL):
- ✅ `server/routes/user.js` - Usa getDb() (compatível)
- ✅ `server/routes/interesse.js` - Usa getDb() (compatível)
- ✅ `server/utils/webhookNotificacao.js` - Usa getDb() (compatível)
- ✅ `server/middleware/auth.js` - Não usa banco diretamente

---

## ✅ Checklist de Migração

- [ ] `mysql2` instalado (`npm install mysql2`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Banco `partiu_ensaio` criado no MySQL
- [ ] Schema executado (`mysql-schema.sql`)
- [ ] Admin criado (opcional, `mysql-insert-admin.sql`)
- [ ] Servidor inicia sem erros
- [ ] Login funciona
- [ ] Cadastro funciona
- [ ] Ensaios funcionam

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'mysql2'"
```bash
cd server
npm install mysql2
```

### Erro: "Access denied for user"
- Verifique usuário e senha no `.env`
- Teste: `mysql -u root -p`

### Erro: "Unknown database 'partiu_ensaio'"
```sql
CREATE DATABASE partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro: "Table doesn't exist"
```bash
mysql -u root -p partiu_ensaio < database/mysql-schema.sql
```

---

## 📚 Documentação Relacionada

- `MIGRACAO-MYSQL.md` - Guia completo de migração
- `database/mysql-schema.sql` - Schema do banco
- `database/mysql-insert-admin.sql` - Script do admin
- `database/mysql-migration-guide.md` - Guia detalhado
