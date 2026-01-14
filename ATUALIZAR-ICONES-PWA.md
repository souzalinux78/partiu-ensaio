# 🎨 Atualizar Ícones PWA com o Logo

## 📋 Objetivo

Atualizar os ícones do PWA para usar o logo fornecido (com claves de sol e fá) em vez dos ícones simples com "PE".

## ✅ Solução

O script `generate-icons.js` foi atualizado para usar o logo como base. Ele:

1. **Procura o logo** em `client/public/logo.png`
2. **Se encontrar:** Gera os ícones a partir do logo
3. **Se não encontrar:** Usa fallback simples com as cores atualizadas (preto e dourado)

## 🚀 Como Usar

### PASSO 1: Colocar o Logo na Pasta Correta

Coloque o arquivo do logo em:
```
client/public/logo.png
```

**Importante:**
- Formato: PNG (recomendado) ou JPG
- Tamanho: Mínimo 512x512 pixels (quanto maior, melhor)
- Fundo: Transparente ou branco (funciona melhor)

### PASSO 2: Gerar os Ícones

**No seu computador (local):**

```bash
# Na raiz do projeto
npm run generate-icons
```

**OU manualmente:**

```bash
cd scripts
node generate-icons.js
```

### PASSO 3: Verificar os Ícones Gerados

```bash
# Verificar se os arquivos foram criados
ls -lh client/public/icon-*.png
ls -lh client/public/favicon.ico

# Verificar tamanhos
file client/public/icon-192x192.png
file client/public/icon-512x512.png
```

### PASSO 4: Build e Deploy

**Local:**
```bash
cd client
npm run build
```

**No servidor:**
```bash
cd /var/www/partiu-ensaio
git pull origin master
cd client
npm run build
pm2 restart partiu-ensaio
```

### PASSO 5: Atualizar o PWA Instalado

**IMPORTANTE:** Após atualizar os ícones, o usuário precisa:

1. **Desinstalar o PWA antigo** (se já estiver instalado)
2. **Limpar cache do navegador**
3. **Reinstalar o PWA** para ver os novos ícones

**Ou forçar atualização:**
- Desregistrar Service Worker
- Limpar cache
- Recarregar página
- Reinstalar PWA

## 🔍 Verificações

### Verificar se o Logo Existe

```bash
ls -lh client/public/logo.png
```

### Verificar se os Ícones Foram Gerados

```bash
# Verificar tamanhos dos arquivos
ls -lh client/public/icon-*.png client/public/favicon.ico

# Verificar se são imagens válidas
file client/public/icon-192x192.png
file client/public/icon-512x512.png
```

### Verificar Manifest.json

```bash
cat client/public/manifest.json | grep -A 5 "icons"
```

Deve mostrar:
```json
"icons": [
  {
    "src": "/icon-192x192.png",
    "sizes": "192x192",
    ...
  },
  {
    "src": "/icon-512x512.png",
    "sizes": "512x512",
    ...
  }
]
```

## ⚠️ Problemas Comuns

### Problema 1: Logo não encontrado

**Solução:**
```bash
# Verificar se o arquivo existe
ls -la client/public/logo.png

# Se não existir, coloque o logo na pasta
# O arquivo deve se chamar exatamente: logo.png
```

### Problema 2: Ícones não atualizam no PWA instalado

**Solução:**
1. Desinstalar o PWA
2. Limpar cache do navegador
3. Atualizar Service Worker (versão v6)
4. Reinstalar o PWA

### Problema 3: Ícones ficam distorcidos

**Solução:**
- Use um logo quadrado (1:1)
- Tamanho mínimo: 512x512 pixels
- Formato PNG com fundo transparente

## 📋 Checklist

- [ ] Logo colocado em `client/public/logo.png`
- [ ] `npm run generate-icons` executado
- [ ] Ícones gerados verificados (`icon-192x192.png`, `icon-512x512.png`, `favicon.ico`)
- [ ] `npm run build` executado
- [ ] Mudanças commitadas e enviadas para Git
- [ ] No servidor: `git pull` e `npm run build`
- [ ] PM2 reiniciado
- [ ] PWA reinstalado no dispositivo

## 🎯 Comando Completo

```bash
# 1. Colocar logo em client/public/logo.png

# 2. Gerar ícones
npm run generate-icons

# 3. Build
cd client && npm run build

# 4. Commit
cd ..
git add client/public/icon-*.png client/public/favicon.ico
git commit -m "feat: Atualizar ícones PWA com logo"
git push origin master

# 5. No servidor
cd /var/www/partiu-ensaio
git pull origin master
cd client
npm run build
cd ..
pm2 restart partiu-ensaio
```
