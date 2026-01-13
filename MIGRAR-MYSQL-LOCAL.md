# Migrar para MySQL Local

## ✅ Configuração Aplicada

1. ✅ Arquivo `.env` criado com configurações MySQL
2. ✅ `server/index.js` alterado para usar `database-mysql.js`

## 🚀 Próximos Passos

### 1. Criar Banco de Dados MySQL

Abra o MySQL e execute:

```sql
CREATE DATABASE partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Executar Schema

```bash
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
mysql -u root -pFLoc25GD! partiu_ensaio < database/mysql-schema.sql
```

Ou no MySQL:

```sql
USE partiu_ensaio;
SOURCE database/mysql-schema.sql;
```

### 3. Criar Admin

```bash
mysql -u root -pFLoc25GD! partiu_ensaio < database/mysql-insert-admin.sql
```

### 4. Reiniciar Backend

Pare o backend atual (Ctrl+C) e inicie novamente:

```powershell
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio\server
npm start
```

Deve aparecer:
```
✅ Conectado ao banco de dados MySQL
✅ Banco de dados inicializado
✅ Servidor rodando na porta 5000
```

## 📋 Verificar se Funcionou

### Testar Conexão

```sql
mysql -u root -pFLoc25GD! -e "USE partiu_ensaio; SELECT * FROM users WHERE email='admin@partiuensaio.com';"
```

### Testar Login

- Email: `admin@partiuensaio.com`
- Senha: `admin123`

## 🔄 Migrar Dados do SQLite (Opcional)

Se você tem dados no SQLite que quer migrar:

1. Exportar dados do SQLite
2. Importar no MySQL
3. Ajustar formatos de data se necessário

Mas por enquanto, o banco MySQL está vazio e o admin será criado automaticamente.
