# Resolver Erro no Git Pull

## 🔍 Diagnóstico

Execute estes comandos no servidor para identificar o problema:

### 1. Verificar status do Git

```bash
cd /var/www/partiu-ensaio
git status
```

### 2. Verificar branch atual

```bash
git branch
```

### 3. Verificar remote configurado

```bash
git remote -v
```

Deve mostrar:
```
origin  https://github.com/souzalinux78/partiu-ensaio.git (fetch)
origin  https://github.com/souzalinux78/partiu-ensaio.git (push)
```

### 4. Verificar qual é o branch principal no GitHub

O GitHub pode usar `main` ao invés de `master`. Verifique:

```bash
git branch -r
```

---

## ✅ Soluções Comuns

### Problema 1: Branch é `main` e não `master`

**Solução:**
```bash
cd /var/www/partiu-ensaio
git pull origin main
```

Ou configure o branch padrão:
```bash
git branch -M main
git pull origin main
```

### Problema 2: Mudanças locais não commitadas

**Solução A - Descartar mudanças locais:**
```bash
cd /var/www/partiu-ensaio
git reset --hard HEAD
git pull origin main
```

**Solução B - Salvar mudanças locais:**
```bash
cd /var/www/partiu-ensaio
git stash
git pull origin main
git stash pop
```

### Problema 3: Remote não configurado

**Solução:**
```bash
cd /var/www/partiu-ensaio
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
git pull origin main
```

### Problema 4: Conflitos de merge

**Solução:**
```bash
cd /var/www/partiu-ensaio
git fetch origin
git reset --hard origin/main
```

### Problema 5: Repositório não inicializado

**Solução:**
```bash
cd /var/www/partiu-ensaio
git init
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
git fetch origin
git checkout -b main origin/main
# ou
git checkout -b master origin/master
```

---

## 🚀 Comandos Rápidos (Copiar e Colar)

### Opção 1: Pull Simples (se já está configurado)

```bash
cd /var/www/partiu-ensaio
git pull origin main
```

### Opção 2: Forçar Atualização (descartar mudanças locais)

```bash
cd /var/www/partiu-ensaio
git fetch origin
git reset --hard origin/main
```

### Opção 3: Configuração Completa (primeira vez)

```bash
cd /var/www/partiu-ensaio
git init
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
git fetch origin
git checkout -b main origin/main
```

---

## 🔧 Verificar Após Pull

### 1. Verificar se arquivos foram atualizados

```bash
cd /var/www/partiu-ensaio
ls -la client/src/utils/api.js
```

### 2. Verificar conteúdo do arquivo corrigido

```bash
cat client/src/utils/api.js | grep -A 5 "getApiUrl"
```

Deve mostrar a função `getApiUrl()`.

---

## 📋 Checklist de Troubleshooting

Execute na ordem:

1. [ ] `cd /var/www/partiu-ensaio`
2. [ ] `git status` - Ver o que está acontecendo
3. [ ] `git branch` - Ver branch atual
4. [ ] `git remote -v` - Verificar remote
5. [ ] `git branch -r` - Ver branches remotos
6. [ ] Tentar `git pull origin main` ou `git pull origin master`
7. [ ] Se der erro, usar `git fetch origin` e `git reset --hard origin/main`

---

## 🆘 Erros Comuns e Soluções

### Erro: "fatal: not a git repository"
```bash
git init
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
git fetch origin
git checkout -b main origin/main
```

### Erro: "fatal: couldn't find remote ref master"
```bash
# O branch é 'main', não 'master'
git pull origin main
```

### Erro: "Your local changes would be overwritten"
```bash
# Descartar mudanças locais
git reset --hard HEAD
git pull origin main
```

### Erro: "Permission denied"
```bash
# Verificar permissões
sudo chown -R $USER:$USER /var/www/partiu-ensaio
git pull origin main
```

---

## 📝 Após Resolver o Git Pull

### 1. Rebuild do Frontend

```bash
cd /var/www/partiu-ensaio/client
npm run build
```

### 2. Reiniciar Servidor

```bash
pm2 restart partiu-ensaio
```

### 3. Verificar Logs

```bash
pm2 logs partiu-ensaio
```

---

## 💡 Dica: Script Automático

Crie um script para facilitar:

```bash
nano /var/www/partiu-ensaio/update.sh
```

Cole:
```bash
#!/bin/bash
cd /var/www/partiu-ensaio
git fetch origin
git reset --hard origin/main
cd client
npm run build
pm2 restart partiu-ensaio
echo "✅ Atualização concluída!"
```

Tornar executável:
```bash
chmod +x /var/www/partiu-ensaio/update.sh
```

Usar:
```bash
/var/www/partiu-ensaio/update.sh
```
