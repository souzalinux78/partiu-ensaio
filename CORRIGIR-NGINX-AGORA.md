# 🔧 Correção Imediata do Nginx

## ❌ Problemas Encontrados na Configuração Atual:

1. **Erro de sintaxe:** As configurações de PWA estão dentro do bloco `location /` no servidor HTTP (porta 80)
2. **Localização errada:** As configurações de PWA devem estar no servidor HTTPS (porta 443), não no HTTP
3. **Falta fechamento:** O primeiro bloco `server` não está fechado corretamente
4. **Cache incorreto:** O `location /` no HTTPS está com cache muito longo, deve ser `no-cache` para o index.html

## ✅ Solução:

### 1. Fazer backup da configuração atual:
```bash
sudo cp /etc/nginx/sites-available/partiu-ensaio /etc/nginx/sites-available/partiu-ensaio.backup
```

### 2. Editar o arquivo:
```bash
sudo nano /etc/nginx/sites-available/partiu-ensaio
```

### 3. Substituir TODO o conteúdo por:

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name partiuensaio.automatizeonline.com.br www.partiuensaio.automatizeonline.com.br;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    server_name partiuensaio.automatizeonline.com.br;

    ssl_certificate /etc/letsencrypt/live/partiuensaio.automatizeonline.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/partiuensaio.automatizeonline.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    # ⚠️ IMPORTANTE: Configurações PWA DEVEM estar ANTES de location /
    # Configuração para manifest.json (PWA)
    location = /manifest.json {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/manifest+json; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Configuração para service-worker.js (PWA)
    location = /service-worker.js {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/javascript; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Configuração para service-worker.js.map (source map)
    location = /service-worker.js.map {
        root /var/www/partiu-ensaio/client/build;
        add_header Content-Type "application/json; charset=utf-8";
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Configuração para ícones PWA (com cache longo)
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

    # API - Proxy para Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads de imagens
    location /uploads {
        alias /var/www/partiu-ensaio/server/uploads;
        add_header Cache-Control "public, max-age=31536000";
    }
}

# Redirecionamento de www para sem www (opcional)
server {
    listen 80;
    server_name www.partiuensaio.automatizeonline.com.br;

    location / {
        return 301 https://partiuensaio.automatizeonline.com.br$request_uri;
    }
}
```

### 4. Testar a configuração:
```bash
sudo nginx -t
```

**Deve retornar:** `syntax is ok` e `test is successful`

### 5. Recarregar Nginx:
```bash
sudo systemctl reload nginx
```

### 6. Verificar se está funcionando:
```bash
# Verificar manifest.json
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json

# Deve retornar:
# Content-Type: application/manifest+json; charset=utf-8

# Verificar service-worker.js
curl -I https://partiuensaio.automatizeonline.com.br/service-worker.js

# Deve retornar:
# Content-Type: application/javascript; charset=utf-8
```

## ⚠️ Pontos Importantes:

1. **Ordem das configurações:** As configurações de PWA (`manifest.json` e `service-worker.js`) DEVEM estar ANTES de `location /` no bloco HTTPS
2. **HTTPS obrigatório:** PWA só funciona em HTTPS, por isso as configurações devem estar no bloco `listen 443`
3. **Cache:** `manifest.json` e `service-worker.js` devem ter `no-cache` para sempre pegar a versão mais recente
4. **Content-Type:** O `manifest.json` DEVE ter `application/manifest+json`, não `application/json`

## 🔄 Após Corrigir:

1. Limpe o cache do navegador completamente
2. Desinstale o PWA se já estiver instalado
3. Acesse o site novamente
4. Verifique no DevTools (F12):
   - **Application → Manifest:** Deve carregar sem erros
   - **Application → Service Workers:** Deve estar ativo
5. Tente instalar o PWA novamente
