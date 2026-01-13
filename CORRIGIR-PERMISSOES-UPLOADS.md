# 🔧 Corrigir Permissões dos Uploads

## Problema Identificado

O arquivo existe mas o Nginx retorna 404 porque:
- O arquivo pertence a `root:root`
- O Nginx roda como `www-data`
- O `www-data` não tem permissão para ler arquivos do `root`

## Solução Rápida

Execute no servidor:

```bash
# Corrigir permissões do diretório
sudo chmod 755 /var/www/partiu-ensaio/server/uploads
sudo chown www-data:www-data /var/www/partiu-ensaio/server/uploads

# Corrigir permissões de todos os arquivos
sudo chmod 644 /var/www/partiu-ensaio/server/uploads/*
sudo chown www-data:www-data /var/www/partiu-ensaio/server/uploads/*

# Verificar se funcionou
sudo -u www-data test -r /var/www/partiu-ensaio/server/uploads/ensaio-1768317258755-695073803.jpg && echo "✅ OK" || echo "❌ Erro"

# Recarregar Nginx
sudo systemctl reload nginx
```

## Ou use o script automático:

```bash
sudo bash corrigir-permissoes-uploads.sh
```

## Verificar se funcionou:

```bash
curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg
```

Deve retornar `HTTP/2 200` ao invés de `404`.

## Para novos uploads (automático)

Para garantir que novos uploads tenham as permissões corretas, você pode:

1. **Criar um script que roda após cada upload** (no backend Node.js)
2. **Ou usar umacron job** que corrige permissões periodicamente:

```bash
# Adicionar ao crontab (sudo crontab -e)
*/5 * * * * chmod 644 /var/www/partiu-ensaio/server/uploads/* && chown www-data:www-data /var/www/partiu-ensaio/server/uploads/*
```

## Verificar permissões corretas:

```bash
ls -la /var/www/partiu-ensaio/server/uploads/
```

Deve mostrar:
```
drwxr-xr-x www-data www-data  . (diretório)
-rw-r--r-- www-data www-data  ensaio-*.jpg (arquivos)
```

## Troubleshooting

### Se ainda der 404 após corrigir permissões:

1. **Verificar se o Nginx está usando a configuração correta:**
   ```bash
   sudo nginx -T | grep -A 10 "location /uploads"
   ```

2. **Verificar se o caminho está correto:**
   ```bash
   # O alias deve apontar para:
   alias /var/www/partiu-ensaio/server/uploads;
   ```

3. **Verificar logs do Nginx:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Testar acesso direto:**
   ```bash
   sudo -u www-data cat /var/www/partiu-ensaio/server/uploads/ensaio-1768317258755-695073803.jpg > /dev/null
   ```
