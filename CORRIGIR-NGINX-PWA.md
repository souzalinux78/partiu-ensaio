# 🔧 Corrigir Configuração Nginx para PWA

## ❌ Problema Identificado:

O `manifest.json` está sendo servido com `content-type: application/json` quando deveria ser `application/manifest+json`.

Isso pode impedir que o navegador reconheça o PWA corretamente.

## ✅ Solução:

### 1. Editar configuração do Nginx:

```bash
# Editar arquivo de configuração do Nginx
sudo nano /etc/nginx/sites-available/partiu-ensaio
# ou
sudo nano /etc/nginx/conf.d/partiu-ensaio.conf
```

### 2. Adicionar configurações específicas para PWA:

Adicione estas configurações dentro do bloco `server`:

```nginx
server {
    listen 80;
    server_name partiuensaio.automatizeonline.com.br;
    
    # ... outras configurações existentes ...

    # Configuração para manifest.json
    location = /manifest.json {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/manifest+json; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Configuração para service-worker.js
    location = /service-worker.js {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/javascript; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Configuração para ícones PWA
    location ~* \.(png|jpg|jpeg|gif|ico|svg|webp)$ {
        root /var/www/partiu-ensaio/client/build;
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }

    # Servir arquivos estáticos do React
    location / {
        root /var/www/partiu-ensaio/client/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### 3. Testar configuração:

```bash
# Verificar se a configuração está correta
sudo nginx -t
```

### 4. Recarregar Nginx:

```bash
# Recarregar configuração
sudo systemctl reload nginx
# ou
sudo service nginx reload
```

### 5. Verificar se está funcionando:

```bash
# Verificar content-type do manifest.json
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json

# Deve retornar:
# Content-Type: application/manifest+json; charset=utf-8

# Verificar service-worker.js
curl -I https://partiuensaio.automatizeonline.com.br/service-worker.js

# Deve retornar:
# Content-Type: application/javascript; charset=utf-8
```

## 🔍 Configuração Completa de Exemplo:

Se você não tiver certeza de onde adicionar, aqui está um exemplo completo:

```nginx
server {
    listen 80;
    server_name partiuensaio.automatizeonline.com.br;

    # Redirecionar HTTP para HTTPS (se tiver SSL)
    # return 301 https://$server_name$request_uri;

    # Ou se já estiver em HTTPS:
    # listen 443 ssl http2;
    # ssl_certificate /etc/letsencrypt/live/partiuensaio.automatizeonline.com.br/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/partiuensaio.automatizeonline.com.br/privkey.pem;

    # Configuração para manifest.json (PWA)
    location = /manifest.json {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/manifest+json; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin "*";
    }

    # Configuração para service-worker.js (PWA)
    location = /service-worker.js {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/javascript; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Access-Control-Allow-Origin "*";
    }

    # Configuração para service-worker.js.map (source map)
    location = /service-worker.js.map {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/json; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Configuração para ícones PWA
    location ~* ^/(icon-|favicon\.ico|apple-touch-icon) {
        root /var/www/partiu-ensaio/client/build;
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }

    # Servir arquivos estáticos do React
    location / {
        root /var/www/partiu-ensaio/client/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Proxy para API do backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Servir uploads
    location /uploads {
        alias /var/www/partiu-ensaio/server/uploads;
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }
}
```

## ⚠️ Importante:

1. **Ajuste o caminho** se sua estrutura de diretórios for diferente
2. **Se usar SSL**, descomente as linhas de SSL
3. **Teste sempre** com `nginx -t` antes de recarregar
4. **Limpe o cache** do navegador após alterar configuração

## 🧪 Testar no Navegador:

Após corrigir, abra o DevTools (F12) e verifique:

1. **Application → Manifest:**
   - Deve mostrar o manifest carregado
   - Não deve ter erros

2. **Application → Service Workers:**
   - Deve mostrar o Service Worker registrado e ativo
   - Status deve ser "activated and is running"

3. **Console:**
   - Não deve ter erros relacionados a manifest ou service worker
   - Deve aparecer: "✅ Service Worker registrado com sucesso!"

4. **Network:**
   - `manifest.json` deve ter `Content-Type: application/manifest+json`
   - `service-worker.js` deve ter `Content-Type: application/javascript`

## 🔄 Após Corrigir:

1. Limpe o cache do navegador completamente
2. Desinstale o PWA se já estiver instalado
3. Acesse o site novamente
4. Verifique se o banner de instalação aparece
5. Tente instalar o PWA
6. Verifique se abre como app standalone
