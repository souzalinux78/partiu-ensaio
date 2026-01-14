# 🔄 Atualizar Cores no Servidor - Guia Completo

## ❌ Problema
As cores não atualizaram no servidor mesmo após `npm run build` e `pm2 restart`.

## ✅ Solução Passo a Passo

### 1. Verificar se as mudanças estão no Git

```bash
# No servidor
cd /var/www/partiu-ensaio
git status
git log --oneline -5
```

Se houver arquivos modificados não commitados, faça commit primeiro:
```bash
git add .
git commit -m "feat: Atualizar cores do tema para preto e dourado"
git push origin master
```

### 2. Fazer Pull das Mudanças

```bash
cd /var/www/partiu-ensaio
git pull origin master
```

### 3. Limpar Cache e Rebuild Completo

```bash
# Limpar node_modules e cache do npm
cd client
rm -rf node_modules
rm -rf build
rm -rf .cache
npm cache clean --force

# Reinstalar dependências
npm install

# Rebuild completo
npm run build
```

### 4. Atualizar Service Worker (IMPORTANTE!)

O Service Worker pode estar cacheando os arquivos CSS antigos. Precisamos atualizar a versão:

```bash
# Editar service-worker.js
nano client/public/service-worker.js
```

Procure por `CACHE_NAME` e aumente a versão:
```javascript
const CACHE_NAME = 'partiu-ensaio-v6'; // Aumentar de v5 para v6
```

OU execute este comando para atualizar automaticamente:
```bash
cd /var/www/partiu-ensaio
sed -i "s/CACHE_NAME = 'partiu-ensaio-v[0-9]*'/CACHE_NAME = 'partiu-ensaio-v6'/" client/public/service-worker.js
```

Depois, faça rebuild novamente:
```bash
cd client
npm run build
```

### 5. Reiniciar PM2 com Limpeza de Cache

```bash
cd /var/www/partiu-ensaio

# Parar PM2
pm2 stop partiu-ensaio

# Limpar cache do PM2
pm2 flush

# Reiniciar
pm2 restart partiu-ensaio --update-env

# Verificar logs
pm2 logs partiu-ensaio --lines 50
```

### 6. Limpar Cache do Navegador

**No servidor, você pode forçar limpeza do Service Worker:**

1. Acesse o site no navegador
2. Abra DevTools (F12)
3. Vá em **Application** → **Service Workers**
4. Clique em **Unregister** no Service Worker ativo
5. Vá em **Application** → **Storage** → **Clear site data**
6. Recarregue a página (Ctrl+Shift+R)

### 7. Verificar se os Arquivos Foram Atualizados

```bash
# Verificar se os arquivos CSS foram gerados
ls -lah /var/www/partiu-ensaio/client/build/static/css/

# Verificar data de modificação (deve ser recente)
stat /var/www/partiu-ensaio/client/build/static/css/main.*.css

# Verificar conteúdo do CSS (deve conter #D4AF37)
grep -i "D4AF37" /var/www/partiu-ensaio/client/build/static/css/main.*.css | head -5
```

Se não encontrar `#D4AF37`, o build não incluiu as mudanças.

### 8. Script Completo de Atualização

Crie um script para facilitar:

```bash
#!/bin/bash
# Salvar como: atualizar-cores.sh

cd /var/www/partiu-ensaio

echo "🔄 Fazendo pull das mudanças..."
git pull origin master

echo "📦 Limpando cache e node_modules..."
cd client
rm -rf node_modules build .cache
npm cache clean --force

echo "📥 Reinstalando dependências..."
npm install

echo "🔧 Atualizando versão do Service Worker..."
cd ..
sed -i "s/CACHE_NAME = 'partiu-ensaio-v[0-9]*'/CACHE_NAME = 'partiu-ensaio-v6'/" client/public/service-worker.js

echo "🏗️  Fazendo build..."
cd client
npm run build

echo "🔄 Reiniciando PM2..."
cd ..
pm2 stop partiu-ensaio
pm2 flush
pm2 restart partiu-ensaio --update-env

echo "✅ Atualização concluída!"
echo "📋 Verifique os logs: pm2 logs partiu-ensaio --lines 50"
```

Torne executável e execute:
```bash
chmod +x atualizar-cores.sh
./atualizar-cores.sh
```

## 🔍 Verificações Adicionais

### Verificar se Nginx está servindo os arquivos corretos

```bash
# Verificar se o build está sendo servido
curl -I https://partiuensaio.automatizeonline.com.br/static/css/main.*.css

# Verificar headers de cache
curl -I https://partiuensaio.automatizeonline.com.br/ | grep -i cache
```

### Verificar permissões dos arquivos

```bash
# Garantir que www-data tem acesso
chown -R www-data:www-data /var/www/partiu-ensaio/client/build
chmod -R 755 /var/www/partiu-ensaio/client/build
```

### Verificar logs do PM2

```bash
pm2 logs partiu-ensaio --lines 100 --err
```

## ⚠️ Problemas Comuns

### Problema 1: Service Worker cacheando CSS antigo

**Solução:** Atualizar `CACHE_NAME` no `service-worker.js` e fazer rebuild.

### Problema 2: Nginx cacheando arquivos

**Solução:** Verificar configuração do Nginx e adicionar headers `no-cache` para CSS:

```nginx
location ~* \.css$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

Depois: `sudo systemctl reload nginx`

### Problema 3: Build não incluiu mudanças

**Solução:** 
1. Verificar se os arquivos CSS foram modificados: `git diff client/src/components/Dashboard.css`
2. Limpar completamente: `rm -rf client/build client/node_modules`
3. Reinstalar e rebuild: `npm install && npm run build`

## ✅ Checklist Final

- [ ] Mudanças commitadas e enviadas para o Git
- [ ] `git pull` executado no servidor
- [ ] `node_modules` e `build` removidos
- [ ] `npm install` executado
- [ ] Versão do Service Worker atualizada (v6)
- [ ] `npm run build` executado com sucesso
- [ ] PM2 reiniciado
- [ ] Cache do navegador limpo
- [ ] Service Worker desregistrado no navegador
- [ ] Página recarregada com Ctrl+Shift+R

## 🚀 Comando Rápido (Tudo de Uma Vez)

```bash
cd /var/www/partiu-ensaio && \
git pull origin master && \
cd client && \
rm -rf node_modules build .cache && \
npm cache clean --force && \
npm install && \
cd .. && \
sed -i "s/CACHE_NAME = 'partiu-ensaio-v[0-9]*'/CACHE_NAME = 'partiu-ensaio-v6'/" client/public/service-worker.js && \
cd client && \
npm run build && \
cd .. && \
pm2 stop partiu-ensaio && \
pm2 flush && \
pm2 restart partiu-ensaio --update-env && \
echo "✅ Atualização concluída!"
```
