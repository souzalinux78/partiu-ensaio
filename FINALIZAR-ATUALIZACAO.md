# Finalizar Atualização no Servidor

## 🔍 Situação Atual

- ✅ Servidor rodando (PM2 ativo)
- ⚠️ Ainda tem mudança local: `client/package-lock.json`
- ⚠️ Servidor usando SQLite (não MySQL ainda)
- ❓ Precisa verificar se `api.js` foi atualizado

## ✅ Passos para Finalizar

### 1. Descartar mudança restante e atualizar

```bash
cd /var/www/partiu-ensaio
git restore client/package-lock.json
git pull origin master
```

### 2. Verificar se arquivo foi atualizado

```bash
cat client/src/utils/api.js | grep -A 5 "getApiUrl"
```

Deve mostrar a função `getApiUrl()`.

### 3. Reinstalar dependências e fazer build

```bash
cd client
npm install
npm run build
cd ..
```

### 4. Reiniciar PM2

```bash
pm2 restart partiu-ensaio
```

### 5. Verificar logs

```bash
pm2 logs partiu-ensaio --lines 10
```

---

## 🚀 Comando Completo (Uma Linha)

```bash
cd /var/www/partiu-ensaio && git restore client/package-lock.json && git pull origin master && cd client && npm install && npm run build && cd .. && pm2 restart partiu-ensaio
```

---

## 🔍 Verificar se Correção Foi Aplicada

### Verificar arquivo api.js

```bash
cat client/src/utils/api.js | grep "getApiUrl"
```

**Deve mostrar:**
```javascript
const getApiUrl = () => {
```

### Verificar build

```bash
ls -la client/build/static/js/
```

Deve ter arquivos JavaScript novos.

### Testar no navegador

1. Acesse: `https://partiuensaio.automatizeonline.com.br/login`
2. Abra DevTools (F12) → Console
3. Tente fazer login
4. **NÃO deve aparecer mais erro de `localhost:5000`**

---

## ⚠️ Nota sobre SQLite vs MySQL

Os logs mostram que está usando SQLite:
```
Conectado ao banco de dados SQLite
```

Isso está OK por enquanto. Para migrar para MySQL depois:
1. Configure `.env` com MySQL
2. Altere `server/index.js` para usar `database-mysql`
3. Reinicie o servidor

Mas primeiro, vamos corrigir o problema do `localhost:5000` no frontend.

---

## 📋 Checklist

- [ ] `git restore client/package-lock.json`
- [ ] `git pull origin master`
- [ ] Verificar `api.js` tem `getApiUrl()`
- [ ] `cd client && npm install && npm run build`
- [ ] `pm2 restart partiu-ensaio`
- [ ] Testar login no navegador
- [ ] Verificar que não aparece mais erro `localhost:5000`
