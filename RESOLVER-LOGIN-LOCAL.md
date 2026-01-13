# Resolver Problema de Login Local

## 🔍 Problema Identificado

O frontend está rodando em `localhost:3001` e tentando acessar `localhost:5000`, mas o backend não está respondendo (`ERR_FAILED`).

## ✅ Soluções

### Opção 1: Rodar Backend Localmente (Desenvolvimento)

Se você está desenvolvendo localmente, precisa rodar o backend também:

```powershell
# Terminal 1 - Backend
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio\server
npm install
npm run dev
# ou
npm start
```

O backend deve iniciar na porta 5000.

### Opção 2: Usar Backend do Servidor (Produção)

Se o backend está no servidor, configure o frontend para apontar para ele:

Crie `client/.env.local`:
```env
REACT_APP_API_URL=https://partiuensaio.automatizeonline.com.br/api
```

Depois reinicie o frontend:
```powershell
cd client
npm start
```

### Opção 3: Verificar se Backend Está Rodando

No servidor, verifique:

```bash
pm2 status
pm2 logs partiu-ensaio --lines 20
```

Se não estiver rodando:
```bash
cd /var/www/partiu-ensaio/server
pm2 start ecosystem.config.js
# ou
pm2 restart partiu-ensaio
```

## 🚀 Teste Rápido

### Testar Backend Local

```powershell
# Verificar se porta 5000 está em uso
netstat -ano | findstr :5000
```

### Testar Backend do Servidor

```bash
curl https://partiuensaio.automatizeonline.com.br/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@partiuensaio.com","password":"admin123"}'
```

## 📋 Checklist

- [ ] Backend está rodando? (local ou servidor)
- [ ] Porta 5000 está ativa?
- [ ] Frontend está configurado para a URL correta?
- [ ] Admin existe no banco de dados?
- [ ] Senha do admin está correta?

## 🔧 Comandos para Testar

### No Servidor (Linux):

```bash
# Verificar PM2
pm2 status

# Verificar logs
pm2 logs partiu-ensaio --lines 30

# Testar API diretamente
curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@partiuensaio.com","password":"admin123"}'

# Verificar admin no banco
cd /var/www/partiu-ensaio/server
sqlite3 database.sqlite "SELECT id, email, role, aprovado FROM users WHERE email='admin@partiuensaio.com';"
```

### No Windows (Local):

```powershell
# Verificar se backend está rodando
netstat -ano | findstr :5000

# Iniciar backend
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio\server
npm start
```
