# 🚀 Como Rodar Localmente e Verificar Admin

## Opção 1: Usar npm (Mais Simples e Recomendado)

### Na raiz do projeto:
```powershell
npm run dev
```

Isso vai:
- ✅ Iniciar o backend na porta 5000
- ✅ Iniciar o frontend na porta 3000
- ✅ Criar/verificar o admin automaticamente

**Nota:** Se não tiver as dependências instaladas, execute primeiro:
```powershell
npm run install-all
```

## Opção 1b: Usar o Script .bat (Windows)

### Se o arquivo existir:
```powershell
# Na raiz do projeto, execute:
.\iniciar-tudo.bat
```

Ou simplesmente:
```powershell
iniciar-tudo.bat
```

## Opção 2: Rodar Manualmente

### 1. Instalar Dependências (se ainda não instalou)

```powershell
# Na raiz do projeto
npm run install-all
```

Ou manualmente:
```powershell
npm install
cd server
npm install
cd ../client
npm install
cd ..
```

### 2. Iniciar Backend

**Terminal 1:**
```powershell
cd server
npm start
```

O backend deve iniciar em `http://localhost:5000`

**Importante:** O admin é criado automaticamente quando o backend inicia pela primeira vez!

### 3. Iniciar Frontend

**Terminal 2:**
```powershell
cd client
npm start
```

O frontend deve abrir automaticamente em `http://localhost:3000`

### 4. Ou rodar tudo de uma vez (raiz do projeto):

```powershell
npm run dev
```

## ✅ Verificar se o Admin Existe

### Método 1: Verificar no Console do Backend

Quando o backend inicia, você verá no console:

```
=== VERIFICANDO/CRIANDO ADMIN ===
Email: admin@partiuensaio.com
✅ Admin já existe no banco de dados
   ID: 1
   Email: admin@partiuensaio.com
   Role: admin
   Aprovado: 1
```

OU se não existir:

```
✅ Usuário admin criado com sucesso!
   Email: admin@partiuensaio.com
   Senha: admin123
```

### Método 2: Tentar Fazer Login

1. Acesse: `http://localhost:3000`
2. Clique em "Login"
3. Use as credenciais:
   - **Email:** `admin@partiuensaio.com`
   - **Senha:** `admin123`

Se funcionar, o admin existe! 🎉

### Método 3: Criar/Recriar Admin Manualmente

#### Se estiver usando SQLite:

O admin é criado automaticamente. Mas se precisar recriar, pare o servidor e delete o arquivo:
```powershell
# Parar o servidor (Ctrl+C)
# Deletar o banco
del server\database.sqlite
# Reiniciar o servidor
cd server
npm start
```

#### Se estiver usando MySQL:

Execute o script:
```powershell
cd server
node criar-admin-mysql.js
```

Ou execute o SQL diretamente:
```sql
USE partiu_ensaio;

-- Verificar se existe
SELECT * FROM users WHERE email = 'admin@partiuensaio.com';

-- Se não existir, criar (senha: admin123)
-- O hash já está no arquivo database/mysql-insert-admin.sql
```

## 🔍 Verificar se Está Funcionando

### Backend:
- Acesse: `http://localhost:5000/api`
- Deve retornar algo ou erro 404 (normal, significa que está rodando)

### Frontend:
- Acesse: `http://localhost:3000`
- Deve abrir a página inicial

### Calendário:
- Acesse: `http://localhost:3000/agenda`
- Deve mostrar o calendário de ensaios

## 📋 Credenciais Padrão do Admin

- **Email:** `admin@partiuensaio.com`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Altere essas credenciais em produção!

## 🐛 Problemas Comuns

### Porta 5000 já em uso:
```powershell
# Encontrar processo
netstat -ano | findstr :5000

# Matar processo (substitua PID pelo número)
taskkill /PID <PID> /F
```

### Porta 3000 já em uso:
O React vai perguntar se quer usar outra porta. Digite `Y` e use a porta sugerida.

### Admin não consegue fazer login:
1. Verifique se o backend está rodando
2. Verifique no console do backend se o admin foi criado
3. Tente recriar o admin usando `node criar-admin-mysql.js` (se MySQL) ou delete o banco SQLite e reinicie

### Erro "Cannot find module":
```powershell
# Reinstalar dependências
npm run install-all
```

## 📝 Checklist Rápido

- [ ] Backend rodando em `localhost:5000`
- [ ] Frontend rodando em `localhost:3000`
- [ ] Console do backend mostra mensagem sobre admin
- [ ] Consigo fazer login com `admin@partiuensaio.com` / `admin123`
- [ ] Consigo acessar `/agenda` e ver o calendário
