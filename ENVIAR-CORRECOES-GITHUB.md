# Enviar Correções para o GitHub

## 🔍 Problema

O arquivo `client/src/utils/api.js` no servidor ainda está na versão antiga porque as correções não foram enviadas para o GitHub.

## ✅ Solução: Fazer Commit e Push

### No seu computador Windows:

#### 1. Verificar mudanças

Abra o PowerShell ou Git Bash e execute:

```powershell
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
git status
```

#### 2. Adicionar arquivos modificados

```powershell
git add client/src/utils/api.js
git add client/src/components/DashboardAdmin.js
git add client/src/components/EnsaiosPublicos.js
git add client/src/components/DashboardMusico.js
git add client/src/components/DashboardEncarregado.js
```

Ou adicionar tudo:

```powershell
git add .
```

#### 3. Fazer commit

```powershell
git commit -m "Corrige URLs hardcoded localhost:5000 para funcionar em produção"
```

#### 4. Enviar para GitHub

```powershell
git push origin master
```

---

## 🚀 Comandos Rápidos (Copiar e Colar)

```powershell
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
git add .
git commit -m "Corrige URLs hardcoded localhost:5000 para produção"
git push origin master
```

---

## 📋 Após Enviar para GitHub

### No servidor Linux, execute:

```bash
cd /var/www/partiu-ensaio
git pull origin master
cd client
npm run build
cd ..
pm2 restart partiu-ensaio
```

---

## ✅ Verificar se Funcionou

### 1. No servidor, verificar arquivo:

```bash
cat client/src/utils/api.js | grep -A 3 "getApiUrl"
```

Deve mostrar a função `getApiUrl()`.

### 2. Testar no navegador:

1. Acesse: `https://partiuensaio.automatizeonline.com.br/login`
2. Abra DevTools (F12) → Console
3. Tente fazer login
4. **NÃO deve aparecer mais erro de `localhost:5000`**

---

## 🔍 Arquivos que Foram Modificados

- ✅ `client/src/utils/api.js` - Função `getApiUrl()` e `getBaseUrl()`
- ✅ `client/src/components/DashboardAdmin.js` - Usa `getBaseUrl()`
- ✅ `client/src/components/EnsaiosPublicos.js` - Usa `getBaseUrl()`
- ✅ `client/src/components/DashboardMusico.js` - Usa `getBaseUrl()`
- ✅ `client/src/components/DashboardEncarregado.js` - Usa `getBaseUrl()`

Todos esses arquivos precisam ser commitados e enviados para o GitHub.
