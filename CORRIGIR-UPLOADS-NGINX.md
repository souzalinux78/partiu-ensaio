# 🔧 Corrigir Configuração Nginx para Uploads

## Problema
As imagens de uploads não estão sendo servidas corretamente, retornando 404.

## Solução

### 1. Verificar se o diretório existe no servidor:
```bash
ls -la /var/www/partiu-ensaio/server/uploads
```

Se não existir, criar:
```bash
mkdir -p /var/www/partiu-ensaio/server/uploads
chmod 755 /var/www/partiu-ensaio/server/uploads
chown www-data:www-data /var/www/partiu-ensaio/server/uploads
```

### 2. Atualizar configuração do Nginx

Adicione ou atualize o bloco `location /uploads` no arquivo de configuração do Nginx:

```nginx
# Uploads de imagens
location /uploads {
    alias /var/www/partiu-ensaio/server/uploads;
    
    # Headers CORS para imagens
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type" always;
    
    # Cache e Content-Type
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
    
    # Permitir acesso
    autoindex off;
}
```

### 3. Testar e recarregar Nginx

```bash
# Testar configuração
sudo nginx -t

# Se OK, recarregar
sudo systemctl reload nginx
```

### 4. Verificar permissões

```bash
# Verificar se o Nginx pode ler os arquivos
sudo -u www-data ls /var/www/partiu-ensaio/server/uploads

# Se não conseguir, ajustar permissões
sudo chmod -R 755 /var/www/partiu-ensaio/server/uploads
sudo chown -R www-data:www-data /var/www/partiu-ensaio/server/uploads
```

### 5. Testar acesso direto

Teste se as imagens estão acessíveis:
```bash
curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg
```

Deve retornar `200 OK` e os headers CORS.

## Alternativa: Proxy para Backend

Se preferir que o Nginx faça proxy para o backend (Node.js) ao invés de servir diretamente:

```nginx
location /uploads {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Headers CORS
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
}
```

## Verificar Logs

Se ainda não funcionar, verifique os logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
