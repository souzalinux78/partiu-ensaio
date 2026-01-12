# Banco de Dados - Partiu Ensaio

Este diretório contém os scripts SQL e documentação do banco de dados.

## 📁 Arquivos

### MySQL
- **`mysql-schema.sql`** - Script completo de criação do banco MySQL
- **`mysql-insert-admin.sql`** - Script para criar/atualizar usuário admin
- **`mysql-migration-guide.md`** - Guia completo de migração SQLite → MySQL

### SQLite (Atual)
- O banco SQLite atual está em: `server/database.sqlite`
- A estrutura é criada automaticamente pelo `server/database.js`

## 🗄️ Estrutura do Banco

### Tabelas

1. **users** - Usuários do sistema
   - Admin, Encarregados, Músicos
   - Sistema de aprovação

2. **ensaios** - Ensaios cadastrados
   - Informações completas do ensaio
   - Status (pendente, aprovado, rejeitado, cancelado)
   - Datas recorrentes

3. **interesses_ensaios** - Interesses de músicos
   - Relacionamento músico ↔ ensaio
   - Controle de webhooks enviados

## 🚀 Uso Rápido

### MySQL
```bash
# Criar banco e tabelas
mysql -u root -p < database/mysql-schema.sql

# Criar admin padrão
mysql -u root -p < database/mysql-insert-admin.sql
```

### SQLite
O banco SQLite é criado automaticamente ao iniciar o servidor.

## 📖 Documentação Completa

Consulte `mysql-migration-guide.md` para:
- Instalação do MySQL
- Migração de dados
- Configuração da aplicação
- Troubleshooting
