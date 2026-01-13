# 🔧 Solução Final para Duplicação de Content-Type

## ❌ Problema:

O Nginx está detectando automaticamente o tipo MIME baseado na extensão `.json` e adicionando `Content-Type: application/json` antes do nosso header customizado.

## ✅ Solução:

Usar `types { }` vazio dentro do `location` para **desabilitar a detecção automática** de tipos MIME, forçando o uso apenas do `default_type` e `add_header`.

## 🚀 Aplicar:

### 1. Editar o arquivo:
```bash
sudo nano /etc/nginx/sites-available/partiu-ensaio
```

### 2. Nas seções de PWA, adicionar `types { }` vazio:

```nginx
# Configuração para manifest.json (PWA)
location = /manifest.json {
    root /var/www/partiu-ensaio/client/build;
    types { }  # ⚠️ DESABILITA detecção automática de tipo MIME
    default_type application/manifest+json;
    add_header Content-Type "application/manifest+json; charset=utf-8" always;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header Access-Control-Allow-Origin "*" always;
}

# Configuração para service-worker.js (PWA)
location = /service-worker.js {
    root /var/www/partiu-ensaio/client/build;
    types { }  # ⚠️ DESABILITA detecção automática de tipo MIME
    default_type application/javascript;
    add_header Content-Type "application/javascript; charset=utf-8" always;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header Access-Control-Allow-Origin "*" always;
}
```

### 3. Testar:
```bash
sudo nginx -t
```

### 4. Recarregar:
```bash
sudo systemctl reload nginx
```

### 5. Verificar:
```bash
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json
```

**Agora deve retornar APENAS:**
```
Content-Type: application/manifest+json; charset=utf-8
```

**SEM o `content-type: application/json` duplicado!**

## 📝 Explicação:

- `types { }` vazio desabilita a detecção automática de tipos MIME do Nginx para esse location específico
- `default_type` define o tipo padrão quando não há detecção automática
- `add_header ... always` garante que o header seja sempre adicionado, mesmo em respostas de erro

## ⚠️ Importante:

O `types { }` vazio só afeta esse location específico. Os outros locations continuam com detecção automática normal de tipos MIME.
