# 🔧 Aplicar Configuração Nginx Corrigida para Uploads

## 📋 O que foi corrigido:

1. ✅ **Headers CORS** adicionados para `/uploads` (essencial para PWA)
2. ✅ **Content-Type** correto para imagens (jpg, png, gif, webp)
3. ✅ **Cache moderado** (1 dia) ao invés de 1 ano (permite atualizações)
4. ✅ **Ordem correta** - `/uploads` antes de `location /` para ter prioridade
5. ✅ **Logs de debug** adicionados (opcional, pode remover depois)
6. ✅ **Timeout aumentado** para `/api` (uploads grandes)

## 🚀 Como aplicar:

### 1. Fazer backup da configuração atual:
```bash
sudo cp /etc/nginx/sites-available/partiu-ensaio /etc/nginx/sites-available/partiu-ensaio.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Verificar/criar diretório de uploads:
```bash
sudo mkdir -p /var/www/partiu-ensaio/server/uploads
sudo chmod 755 /var/www/partiu-ensaio/server/uploads
sudo chown www-data:www-data /var/www/partiu-ensaio/server/uploads
```

### 3. Copiar nova configuração:
```bash
# Se usar sites-available/sites-enabled
sudo cp nginx-partiu-ensaio-CORRIGIDO-COMPLETO.conf /etc/nginx/sites-available/partiu-ensaio

# OU se usar conf.d
sudo cp nginx-partiu-ensaio-CORRIGIDO-COMPLETO.conf /etc/nginx/conf.d/partiu-ensaio.conf
```

### 4. Testar configuração:
```bash
sudo nginx -t
```

### 5. Se OK, recarregar Nginx:
```bash
sudo systemctl reload nginx
```

### 6. Verificar se funcionou:
```bash
# Testar uma imagem específica (substitua pelo nome real)
curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg

# Deve retornar:
# HTTP/2 200
# Access-Control-Allow-Origin: *
# Content-Type: image/jpeg
```

## 🔍 Verificar logs (se necessário):

```bash
# Ver logs de acesso de uploads
sudo tail -f /var/log/nginx/uploads-access.log

# Ver logs de erro de uploads
sudo tail -f /var/log/nginx/uploads-error.log

# Ver logs gerais do Nginx
sudo tail -f /var/log/nginx/error.log
```

## ✅ Verificações finais:

1. **Verificar se o arquivo existe:**
   ```bash
   ls -la /var/www/partiu-ensaio/server/uploads/ensaio-*.jpg | head -5
   ```

2. **Verificar permissões:**
   ```bash
   sudo -u www-data ls /var/www/partiu-ensaio/server/uploads
   ```

3. **Testar no navegador:**
   - Abra: `https://partiuensaio.automatizeonline.com.br/uploads/nome-arquivo.jpg`
   - Deve mostrar a imagem (não 404)

4. **Limpar cache do navegador:**
   - Ctrl+Shift+R (Chrome/Firefox)
   - Ou limpar dados do site

## 🐛 Troubleshooting:

### Se ainda der 404:

1. **Verificar se o arquivo realmente existe:**
   ```bash
   find /var/www/partiu-ensaio/server/uploads -name "ensaio-1768317258755-695073803.jpg"
   ```

2. **Verificar se o Nginx está lendo o arquivo:**
   ```bash
   sudo -u www-data cat /var/www/partiu-ensaio/server/uploads/ensaio-1768317258755-695073803.jpg > /dev/null
   ```

3. **Verificar se o caminho no banco está correto:**
   - Deve ser: `/uploads/nome-arquivo.jpg`
   - NÃO deve ser: `uploads/nome-arquivo.jpg` (sem barra inicial)

### Se der erro de permissão:

```bash
sudo chmod -R 755 /var/www/partiu-ensaio/server/uploads
sudo chown -R www-data:www-data /var/www/partiu-ensaio/server/uploads
```

### Se der erro de CORS no PWA:

- Os headers CORS já estão configurados
- Verifique se não há outro proxy/firewall bloqueando
- Teste diretamente no navegador (não via PWA) primeiro

## 📝 Notas:

- Os logs de debug (`access_log` e `error_log` em `/uploads`) são opcionais
- Você pode removê-los depois que confirmar que está funcionando
- O cache de 1 dia permite que novas imagens apareçam rapidamente
- Se quiser cache mais longo, altere `max-age=86400` para um valor maior
