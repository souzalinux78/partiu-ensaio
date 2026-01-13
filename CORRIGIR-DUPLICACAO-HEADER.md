# 🔧 Corrigir Duplicação de Content-Type

## ❌ Problema Identificado:

O `manifest.json` está retornando **DOIS** headers `Content-Type`:
1. `content-type: application/json` (padrão do Nginx)
2. `content-type: application/manifest+json; charset=utf-8` (do nosso add_header)

Isso pode causar problemas no navegador.

## ✅ Solução:

Usar `default_type` + `add_header ... always` para garantir que apenas um Content-Type seja retornado.

## 🚀 Aplicar Correção:

### 1. Editar o arquivo:
```bash
sudo nano /etc/nginx/sites-available/partiu-ensaio
```

### 2. Substituir as seções de PWA por:

```nginx
# Configuração para manifest.json (PWA)
location = /manifest.json {
    root /var/www/partiu-ensaio/client/build;
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
    default_type application/javascript;
    add_header Content-Type "application/javascript; charset=utf-8" always;
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    add_header Access-Control-Allow-Origin "*" always;
}
```

### 3. Também corrigir o aviso de server_name duplicado:

Remover o bloco duplicado de www na porta 80. O primeiro bloco já cobre ambos os domínios.

### 4. Testar:
```bash
sudo nginx -t
```

**Não deve ter avisos!**

### 5. Recarregar:
```bash
sudo systemctl reload nginx
```

### 6. Verificar:
```bash
curl -I https://partiuensaio.automatizeonline.com.br/manifest.json
```

**Deve retornar APENAS:**
```
Content-Type: application/manifest+json; charset=utf-8
```

**NÃO deve ter dois Content-Type!**

## 📝 Mudanças Principais:

1. ✅ Adicionado `default_type` para definir o tipo antes dos headers
2. ✅ Adicionado `always` nos `add_header` para garantir que sejam sempre aplicados
3. ✅ Removida duplicação do server_name na porta 80

## ⚠️ Nota sobre o Aviso:

O aviso `conflicting server name "www.partiuensaio.automatizeonline.com.br" on 0.0.0.0:80` ocorre porque há dois blocos `server` na porta 80 com o mesmo `server_name`. 

A solução é ter apenas UM bloco na porta 80 que cubra ambos os domínios (com e sem www), e redirecionar ambos para HTTPS sem www.
