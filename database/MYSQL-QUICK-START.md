# MySQL - Guia Rápido

## 🚀 Início Rápido

### 1. Instalar MySQL
```bash
# Ubuntu/Debian
sudo apt install mysql-server

# macOS
brew install mysql

# Windows: Baixe do site oficial
```

### 2. Criar Banco de Dados
```bash
mysql -u root -p < database/mysql-schema.sql
```

### 3. Criar Admin Padrão
```bash
mysql -u root -p < database/mysql-insert-admin.sql
```

### 4. Verificar
```bash
mysql -u root -p partiu_ensaio -e "SELECT * FROM users WHERE email='admin@partiuensaio.com';"
```

## 📋 Credenciais Padrão

- **Email**: admin@partiuensaio.com
- **Senha**: admin123

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login!

## 📁 Estrutura das Tabelas

### users
- Usuários do sistema (admin, encarregado, musico)
- Campos: id, email, password, name, role, aprovado, instrumento, etc.

### ensaios
- Ensaios cadastrados
- Campos: id, user_id, nome_igreja, endereco, cidade, estado, horario, etc.

### interesses_ensaios
- Interesses de músicos em ensaios
- Campos: id, ensaio_id, musico_id, data_ensaio, webhook_enviado

## 🔧 Configuração da Aplicação

Adicione no `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua-senha
DB_NAME=partiu_ensaio
```

## 📚 Documentação Completa

Veja `mysql-migration-guide.md` para migração completa do SQLite.
