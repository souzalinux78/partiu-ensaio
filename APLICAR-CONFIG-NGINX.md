# 🔧 Aplicar Configuração Corrigida do Nginx

## 📋 Configuração Completa e Corrigida

O arquivo `nginx-partiu-ensaio-completo.conf` contém a configuração completa e corrigida.

## ⚠️ Principais Correções:

1. ✅ **Configurações PWA movidas para HTTPS** (porta 443)
2. ✅ **Configurações PWA antes de `location /`** (prioridade correta)
3. ✅ **Cache corrigido** para `location /` (no-cache para index.html)
4. ✅ **Sintaxe corrigida** (todos os blocos fechados)
5. ✅ **Content-Type correto** para manifest.json
6. ✅ **Headers CORS** adicionados para PWA

## 🚀 Como Aplicar:

### 1. Fazer backup da configuração atual:
```bash
sudo cp /etc/nginx/sites-available/partiu-ensaio /etc/nginx/sites-available/partiu-ensaio.backup.$(date +%Y%m%d-%H%M%S)
```

### 2. Copiar a nova configuração:
```bash
# No servidor, copie o conteúdo do arquivo nginx-partiu-ensaio-completo.conf
sudo nano /etc/nginx/sites-available/partiu-ensaio
```

### 3. Substituir TODO o conteúdo pelo arquivo corrigido

Ou use este comando (se você copiou o arquivo para o servidor):
```bash
sudo cp nginx-partiu-ensaio-completo.conf /etc/nginx/sites-available/partiu-ensaio
```

### 4. Testar a configuração:
```bash
sudo nginx -t
```

**Deve retornar:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Recarregar Nginx:
```bash
sudo systemctl reload nginx
```

### 6. Verificar se está funcionando:
```bash
# Verificar manifest.json
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json

# Deve retornar:
# HTTP/2 200
# Content-Type: application/manifest+json; charset=utf-8
# Cache-Control: no-cache, no-store, must-revalidate

# Verificar service-worker.js
curl -I https://partiuensaio.automatizeonline.com.br/service-worker.js

# Deve retornar:
# HTTP/2 200
# Content-Type: application/javascript; charset=utf-8
# Cache-Control: no-cache, no-store, must-revalidate
```

## 🔍 Verificar no Navegador:

1. Abra o DevTools (F12)
2. Vá em **Application → Manifest**
   - Deve carregar sem erros
   - Deve mostrar todas as informações do PWA
3. Vá em **Application → Service Workers**
   - Deve mostrar o Service Worker registrado e ativo
   - Status: "activated and is running"
4. Verifique o Console
   - Não deve ter erros relacionados a manifest ou service worker
   - Deve aparecer: "✅ Service Worker registrado com sucesso!"

## 🔄 Após Aplicar:

1. **Limpe o cache do navegador completamente**
2. **Desinstale o PWA** se já estiver instalado
3. **Acesse o site novamente**
4. **Aguarde o banner de instalação aparecer**
5. **Tente instalar o PWA**
6. **Verifique se abre como app standalone** (sem barra de navegação)

## ⚠️ Se algo der errado:

```bash
# Restaurar backup
sudo cp /etc/nginx/sites-available/partiu-ensaio.backup.* /etc/nginx/sites-available/partiu-ensaio
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 Notas Importantes:

- As configurações de PWA (`manifest.json` e `service-worker.js`) estão no bloco HTTPS (porta 443)
- Elas estão ANTES de `location /` para ter prioridade
- O `location /` tem `no-cache` para sempre servir a versão mais recente do index.html
- Arquivos estáticos (JS, CSS, imagens) têm cache longo para melhor performance
- Headers CORS foram adicionados para garantir compatibilidade
