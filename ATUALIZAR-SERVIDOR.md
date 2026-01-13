# 🚀 Guia de Atualização do Servidor em Nuvem

Este guia mostra como atualizar o servidor com as últimas correções do sistema.

## 📋 Pré-requisitos

- Acesso SSH ao servidor
- Permissões de root ou sudo
- Git configurado no servidor
- PM2 instalado e rodando

## 🔄 Passo a Passo para Atualizar

### 1. Conectar ao Servidor

```bash
ssh root@seu-servidor.com
# ou
ssh usuario@seu-servidor.com
```

### 2. Navegar até o Diretório do Projeto

```bash
cd /var/www/partiu-ensaio
```

### 3. Verificar Status Atual

```bash
# Ver status do Git
git status

# Ver processos PM2
pm2 list

# Ver logs atuais
pm2 logs partiu-ensaio --lines 20
```

### 4. Fazer Backup (Recomendado)

```bash
# Criar backup do banco de dados (se usar MySQL)
mysqldump -u root -p partiu_ensaio > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou fazer backup dos arquivos importantes
cp -r server/uploads server/uploads_backup_$(date +%Y%m%d_%H%M%S)
```

### 5. Atualizar Código do GitHub

```bash
# Descartar mudanças locais não commitadas (se houver)
git restore .

# Buscar atualizações do GitHub
git fetch origin

# Ver diferenças
git diff HEAD origin/master

# Fazer pull das atualizações
git pull origin master
```

**Se der erro de conflito:**

```bash
# Forçar atualização (CUIDADO: isso sobrescreve mudanças locais)
git fetch origin
git reset --hard origin/master
```

### 6. Instalar Dependências (se necessário)

```bash
# Backend
cd server
npm install
cd ..

# Frontend
cd client
npm install
cd ..
```

### 7. Recompilar Frontend

```bash
cd client
npm run build
cd ..
```

### 8. Verificar Variáveis de Ambiente

```bash
# Verificar se o .env está configurado corretamente
cat server/.env

# Se não existir, criar baseado no exemplo
# cp server/.env.example server/.env
# nano server/.env
```

### 9. Reiniciar Aplicação PM2

```bash
# Parar aplicação
pm2 stop partiu-ensaio

# Reiniciar com novas variáveis de ambiente
pm2 restart partiu-ensaio --update-env

# Ou se não estiver rodando
pm2 start ecosystem.config.js
```

### 10. Verificar Logs

```bash
# Ver logs em tempo real
pm2 logs partiu-ensaio --lines 50

# Ver status
pm2 status

# Ver informações detalhadas
pm2 show partiu-ensaio
```

### 11. Verificar se Está Funcionando

```bash
# Testar se a API está respondendo
curl http://localhost:5000/api/ensaio/public

# Verificar se o frontend está servindo
curl http://localhost:3000
```

### 12. Verificar Nginx (se usar)

```bash
# Testar configuração do Nginx
nginx -t

# Recarregar Nginx
systemctl reload nginx
# ou
service nginx reload
```

## 🔍 Verificação Pós-Atualização

### Checklist:

- [ ] Código atualizado do GitHub
- [ ] Dependências instaladas
- [ ] Frontend recompilado
- [ ] PM2 reiniciado
- [ ] Logs sem erros críticos
- [ ] API respondendo corretamente
- [ ] Frontend acessível
- [ ] Banco de dados funcionando

### Testar Funcionalidades:

1. **Login de Admin:**
   - Acessar `/login`
   - Fazer login com `admin@partiuensaio.com` / `admin123`

2. **Dashboard Admin:**
   - Verificar se as estatísticas aparecem
   - Verificar se os ensaios aparecem com "Próxima data"

3. **Dashboard Encarregado:**
   - Fazer login como encarregado
   - Verificar se os ensaios aparecem com "Próxima data"

4. **Página Pública:**
   - Acessar a página inicial
   - Verificar se os ensaios aparecem corretamente

## 🐛 Resolução de Problemas

### Erro: "Port already in use"

```bash
# Verificar qual processo está usando a porta
lsof -i :5000
# ou
netstat -tulpn | grep :5000

# Matar processo se necessário
kill -9 <PID>
```

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
cd server
rm -rf node_modules package-lock.json
npm install
cd ../client
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Database connection failed"

```bash
# Verificar se MySQL está rodando
systemctl status mysql
# ou
service mysql status

# Verificar credenciais no .env
cat server/.env | grep DB_
```

### Frontend não atualiza

```bash
# Limpar cache do build
cd client
rm -rf build
npm run build
cd ..

# Reiniciar PM2
pm2 restart partiu-ensaio
```

### Logs mostram erros

```bash
# Ver logs detalhados
pm2 logs partiu-ensaio --err --lines 100

# Verificar logs do sistema
journalctl -u nginx -n 50
```

## 📝 Comandos Úteis

```bash
# Ver uso de recursos
pm2 monit

# Salvar configuração do PM2
pm2 save

# Ver histórico de reinicializações
pm2 logs partiu-ensaio --lines 200 | grep "restart"

# Verificar espaço em disco
df -h

# Verificar memória
free -h
```

## 🔄 Script de Atualização Automática

Você pode criar um script para automatizar o processo:

```bash
#!/bin/bash
# atualizar-servidor.sh

echo "🔄 Iniciando atualização do servidor..."

cd /var/www/partiu-ensaio

echo "📥 Buscando atualizações do GitHub..."
git pull origin master

echo "📦 Instalando dependências do backend..."
cd server
npm install
cd ..

echo "📦 Instalando dependências do frontend..."
cd client
npm install
echo "🏗️ Compilando frontend..."
npm run build
cd ..

echo "🔄 Reiniciando aplicação..."
pm2 restart partiu-ensaio --update-env

echo "✅ Atualização concluída!"
echo "📊 Verificando status..."
pm2 status

echo "📋 Últimos logs:"
pm2 logs partiu-ensaio --lines 10 --nostream
```

**Para usar o script:**

```bash
chmod +x atualizar-servidor.sh
./atualizar-servidor.sh
```

## ⚠️ Importante

1. **Sempre faça backup antes de atualizar**
2. **Teste em ambiente de desenvolvimento primeiro** (se possível)
3. **Verifique os logs após cada atualização**
4. **Mantenha o PM2 salvo:** `pm2 save`
5. **Monitore o servidor após atualização**

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs partiu-ensaio --lines 100`
2. Verifique o status: `pm2 status`
3. Verifique o banco de dados
4. Verifique as variáveis de ambiente
5. Verifique os arquivos de configuração

---

**Última atualização:** $(date +%Y-%m-%d)
