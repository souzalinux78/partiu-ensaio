# Rodar Sistema Localmente no Windows

## 🚀 Iniciar Backend e Frontend

### Opção 1: Rodar Separadamente (Recomendado)

#### Terminal 1 - Backend:
```powershell
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio\server
npm install
npm start
```

O backend deve iniciar em `http://localhost:5000`

#### Terminal 2 - Frontend:
```powershell
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio\client
npm install
npm start
```

O frontend deve iniciar em `http://localhost:3000`

### Opção 2: Rodar Tudo de Uma Vez

Na raiz do projeto:

```powershell
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
npm run dev
```

Isso inicia backend e frontend simultaneamente.

## ✅ Verificar se Está Funcionando

### 1. Backend rodando?
Acesse: `http://localhost:5000/api`

Deve retornar algo ou erro 404 (normal, significa que está rodando).

### 2. Frontend rodando?
Acesse: `http://localhost:3000`

Deve abrir a página de login.

### 3. Testar Login

- Email: `admin@partiuensaio.com`
- Senha: `admin123`

## 🔧 Problemas Comuns

### Erro: "Port 5000 already in use"

```powershell
# Encontrar processo usando porta 5000
netstat -ano | findstr :5000

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Erro: "Cannot find module"

```powershell
# Instalar dependências
cd server
npm install

cd ../client
npm install
```

### Backend não inicia

Verifique se o arquivo `server/database.sqlite` existe. Se não existir, será criado automaticamente na primeira execução.

## 📋 Checklist

- [ ] Backend rodando em `localhost:5000`
- [ ] Frontend rodando em `localhost:3000`
- [ ] Banco de dados SQLite criado (`server/database.sqlite`)
- [ ] Admin criado automaticamente
- [ ] Login funcionando

## 🎯 Credenciais Padrão

Após a primeira execução do backend, o admin é criado automaticamente:

- **Email:** `admin@partiuensaio.com`
- **Senha:** `admin123`
