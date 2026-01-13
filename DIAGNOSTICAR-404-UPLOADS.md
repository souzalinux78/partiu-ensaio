# 🔍 Diagnosticar 404 em Uploads

## Problema
- ✅ Arquivo existe
- ✅ Permissões corretas (www-data consegue ler)
- ❌ Nginx retorna 404

Isso indica problema de **configuração do Nginx**, não de permissões.

## Diagnóstico

Execute no servidor:

```bash
# 1. Verificar se a configuração foi aplicada
sudo nginx -T | grep -A 15 "location /uploads"

# 2. Verificar ordem dos location blocks
sudo nginx -T | grep -E "^\s+location" | head -10

# 3. Verificar caminho do alias
sudo nginx -T | grep -A 5 "location /uploads" | grep alias
```

## Possíveis Causas

### 1. Configuração não foi aplicada
**Solução:**
```bash
# Verificar qual arquivo de config está sendo usado
sudo nginx -T | head -5

# Copiar a configuração correta
sudo cp nginx-partiu-ensaio-CORRIGIDO-COMPLETO.conf /etc/nginx/sites-available/partiu-ensaio

# OU se usar conf.d
sudo cp nginx-partiu-ensaio-CORRIGIDO-COMPLETO.conf /etc/nginx/conf.d/partiu-ensaio.conf

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Ordem incorreta dos location blocks
O `location /uploads` **DEVE estar ANTES** de `location /` para ter prioridade.

**Verificar:**
```bash
sudo nginx -T | grep -B 2 -A 2 "location /uploads"
```

Se `location /` aparecer antes, está errado!

### 3. Caminho do alias incorreto
**Verificar:**
```bash
# Ver qual alias está configurado
ALIAS=$(sudo nginx -T | grep -A 5 "location /uploads" | grep alias | awk '{print $2}' | tr -d ';')
echo "Alias configurado: $ALIAS"

# Verificar se o caminho está correto
ls -la "$ALIAS"
```

### 4. Conflito com try_files em location /
Se `location /` tem `try_files` e está capturando `/uploads`, precisa ajustar.

## Solução Completa

### Passo 1: Verificar configuração atual
```bash
sudo nginx -T > /tmp/nginx-config.txt
grep -A 20 "location /uploads" /tmp/nginx-config.txt
```

### Passo 2: Se não encontrar ou estiver errado, aplicar configuração correta

**Opção A - Se usar sites-available:**
```bash
sudo cp nginx-partiu-ensaio-CORRIGIDO-COMPLETO.conf /etc/nginx/sites-available/partiu-ensaio
sudo ln -sf /etc/nginx/sites-available/partiu-ensaio /etc/nginx/sites-enabled/partiu-ensaio
```

**Opção B - Se usar conf.d:**
```bash
sudo cp nginx-partiu-ensaio-CORRIGIDO-COMPLETO.conf /etc/nginx/conf.d/partiu-ensaio.conf
```

### Passo 3: Garantir que /uploads está ANTES de location /
A ordem no arquivo de configuração deve ser:
```nginx
# 1. Primeiro: configurações específicas (PWA, uploads)
location = /manifest.json { ... }
location = /service-worker.js { ... }
location /uploads { ... }  # ← DEVE estar aqui

# 2. Depois: location / (genérico)
location / { ... }
```

### Passo 4: Testar e recarregar
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 5: Testar novamente
```bash
curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg
```

## Verificação Final

Se ainda não funcionar, verifique os logs:

```bash
# Ver erros do Nginx
sudo tail -20 /var/log/nginx/error.log

# Ver requisições
sudo tail -20 /var/log/nginx/access.log | grep uploads
```

## Solução Alternativa: Proxy para Backend

Se mesmo assim não funcionar, use proxy para o Node.js:

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

Isso faz o Nginx fazer proxy para o Node.js, que já está servindo os uploads corretamente.
