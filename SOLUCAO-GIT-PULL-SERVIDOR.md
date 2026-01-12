# Solução para Git Pull no Servidor

## 🔍 Situação Atual

Você está no branch `master` e tem mudanças locais não commitadas em:
- `client/package-lock.json`
- `ecosystem.config.js`
- `server/package-lock.json`
- `server/package.json`

## ✅ Solução: Descartar Mudanças e Atualizar

### Passo 1: Descartar mudanças locais

```bash
cd /var/www/partiu-ensaio
git restore client/package-lock.json
git restore ecosystem.config.js
git restore server/package-lock.json
git restore server/package.json
```

Ou de uma vez:
```bash
cd /var/www/partiu-ensaio
git restore .
```

### Passo 2: Fazer pull

```bash
git pull origin master
```

### Passo 3: Reinstalar dependências (se necessário)

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### Passo 4: Rebuild e reiniciar

```bash
# Voltar para raiz
cd /var/www/partiu-ensaio

# Build do frontend
cd client
npm run build

# Reiniciar PM2
cd ..
pm2 restart partiu-ensaio
```

---

## 🔄 Comando Completo (Copiar e Colar)

```bash
cd /var/www/partiu-ensaio
git restore .
git pull origin master
cd server && npm install && cd ..
cd client && npm install && npm run build && cd ..
pm2 restart partiu-ensaio
```

---

## ⚠️ Alternativa: Salvar Mudanças Locais (Se Precisar)

Se você quiser manter as mudanças locais temporariamente:

```bash
cd /var/www/partiu-ensaio
git stash
git pull origin master
git stash pop
```

Depois resolva os conflitos manualmente.

---

## 📋 Verificar Após Pull

```bash
# Verificar status
git status

# Verificar se arquivos foram atualizados
ls -la client/src/utils/api.js

# Verificar conteúdo do arquivo corrigido
cat client/src/utils/api.js | grep -A 3 "getApiUrl"
```

Deve mostrar a função `getApiUrl()` que corrige o problema do `localhost:5000`.

---

## ✅ Checklist

- [ ] Descartar mudanças locais (`git restore .`)
- [ ] Fazer pull (`git pull origin master`)
- [ ] Reinstalar dependências (`npm install` em server e client)
- [ ] Rebuild frontend (`npm run build` em client)
- [ ] Reiniciar PM2 (`pm2 restart partiu-ensaio`)
- [ ] Verificar se funcionou (testar login no navegador)
