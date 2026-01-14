# 🔧 Resolver: Imagens Retornando 404

## ❌ Problema

As imagens estão retornando 404 tanto no computador quanto em dispositivos móveis:
```
Failed to load resource: the server responded with a status of 404
/uploads/ensaio-1768317258755-695073803.jpg
```

## ✅ Correção Aplicada

O `getBaseUrl()` foi corrigido para **SEMPRE usar URL absoluta em produção**, mesmo para desktop. Isso evita problemas com:
- Service Worker cache
- URLs relativas que podem não funcionar
- Problemas de CORS
- Cache do navegador

## 🔍 Verificações no Servidor

### 1. Verificar se as Imagens Existem

```bash
# Verificar se os arquivos existem
ls -lh /var/www/partiu-ensaio/server/uploads/

# Verificar uma imagem específica
ls -lh /var/www/partiu-ensaio/server/uploads/ensaio-1768317258755-695073803.jpg
```

### 2. Verificar Permissões

```bash
# Verificar permissões do diretório
ls -ld /var/www/partiu-ensaio/server/uploads/

# Deve mostrar algo como: drwxr-xr-x www-data www-data

# Se não estiver correto, ajustar:
sudo chown -R www-data:www-data /var/www/partiu-ensaio/server/uploads
sudo chmod -R 755 /var/www/partiu-ensaio/server/uploads
```

### 3. Verificar Configuração do Nginx

```bash
# Verificar configuração do Nginx
sudo nginx -T | grep -A 20 "location /uploads"

# Deve mostrar algo como:
# location ^~ /uploads/ {
#     alias /var/www/partiu-ensaio/server/uploads/;
#     ...
# }
```

### 4. Testar Acesso Direto

```bash
# Testar se o Nginx está servindo corretamente
curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg

# Deve retornar:
# HTTP/2 200
# content-type: image/jpeg
```

**Se retornar 404:**
- O problema está na configuração do Nginx
- Verifique o arquivo de configuração do Nginx

**Se retornar 200:**
- O problema está no frontend/Service Worker
- Continue para as próximas verificações

## 🔧 Soluções

### Solução 1: Atualizar Frontend (Já Aplicada)

O `getBaseUrl()` foi corrigido. Agora precisa:

1. **Fazer commit e push:**
```bash
git add client/src/utils/api.js
git commit -m "fix: Sempre usar URL absoluta em produção para imagens"
git push origin master
```

2. **No servidor:**
```bash
cd /var/www/partiu-ensaio
git pull origin master
cd client
npm run build
cd ..
pm2 restart partiu-ensaio
```

### Solução 2: Verificar Configuração do Nginx

Se o `curl` retornar 404, verifique a configuração do Nginx:

```bash
# Editar configuração
sudo nano /etc/nginx/sites-available/partiu-ensaio

# OU se estiver em outro local:
sudo nano /etc/nginx/nginx.conf
```

**A configuração deve ter:**

```nginx
# Uploads de imagens - DEVE estar ANTES de location / e location regex
location ^~ /uploads/ {
    alias /var/www/partiu-ensaio/server/uploads/;
    
    # Headers CORS para imagens (essencial para PWA)
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;
    
    # Cache moderado (1 dia) para permitir atualizações
    add_header Cache-Control "public, max-age=86400" always;
    expires 1d;
    
    # Content-Type correto para imagens
    types {
        image/jpeg jpg jpeg;
        image/png png;
        image/gif gif;
        image/webp webp;
    }
    default_type image/jpeg;
    
    # Não listar diretório
    autoindex off;
}
```

**Depois de editar:**
```bash
# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx
```

### Solução 3: Limpar Cache do Service Worker

O Service Worker pode estar cacheando as URLs antigas:

1. **Atualizar versão do Service Worker:**
```bash
cd /var/www/partiu-ensaio
sed -i "s/CACHE_NAME = 'partiu-ensaio-v[0-9]*'/CACHE_NAME = 'partiu-ensaio-v7'/" client/public/service-worker.js
cd client
npm run build
cd ..
pm2 restart partiu-ensaio
```

2. **No navegador:**
- DevTools (F12) → Application → Service Workers → Unregister
- Application → Storage → Clear site data
- Recarregar página (Ctrl+Shift+R)

### Solução 4: Verificar se o Backend Está Servindo

```bash
# Testar se o backend está servindo as imagens
curl -I http://localhost:5000/uploads/ensaio-1768317258755-695073803.jpg

# Se retornar 200, o backend está OK
# Se retornar 404, verificar:
# 1. Se o arquivo existe
# 2. Se o Express está configurado corretamente
```

## 📋 Checklist de Diagnóstico

Execute no servidor:

```bash
# 1. Verificar se arquivo existe
ls -lh /var/www/partiu-ensaio/server/uploads/ensaio-1768317258755-695073803.jpg

# 2. Verificar permissões
ls -ld /var/www/partiu-ensaio/server/uploads/

# 3. Testar Nginx
curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg

# 4. Testar backend
curl -I http://localhost:5000/uploads/ensaio-1768317258755-695073803.jpg

# 5. Verificar configuração Nginx
sudo nginx -T | grep -A 15 "location /uploads"
```

## 🚀 Comando Completo de Atualização

```bash
cd /var/www/partiu-ensaio && \
git pull origin master && \
cd client && \
npm run build && \
cd .. && \
sed -i "s/CACHE_NAME = 'partiu-ensaio-v[0-9]*'/CACHE_NAME = 'partiu-ensaio-v7'/" client/public/service-worker.js && \
cd client && \
npm run build && \
cd .. && \
pm2 restart partiu-ensaio && \
echo "✅ Atualizado! Agora limpe o cache do navegador."
```

## ⚠️ Importante

Após atualizar:

1. **Limpe o cache do navegador**
2. **Desregistre o Service Worker**
3. **Recarregue a página**
4. **Teste novamente**

Se ainda não funcionar, verifique os logs do Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```
