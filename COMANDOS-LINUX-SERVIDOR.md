# Comandos para Servidor Linux

## 🐧 Comandos Rápidos (Copiar e Colar)

### Opção 1: Script Automático (Recomendado)

```bash
# 1. Enviar script para o servidor (via SCP ou criar manualmente)
# 2. Tornar executável
chmod +x /var/www/partiu-ensaio/atualizar-servidor.sh

# 3. Executar
/var/www/partiu-ensaio/atualizar-servidor.sh
```

### Opção 2: Comandos Manuais

```bash
cd /var/www/partiu-ensaio
git restore .
git pull origin master
cd server && npm install && cd ..
cd client && npm install && npm run build && cd ..
pm2 restart partiu-ensaio
```

---

## 📋 Comandos Úteis no Linux

### Verificar Status do Git

```bash
cd /var/www/partiu-ensaio
git status
git branch
git log --oneline -5
```

### Verificar Processos PM2

```bash
pm2 status
pm2 logs partiu-ensaio
pm2 monit
```

### Verificar Portas em Uso

```bash
netstat -tulpn | grep :5000
# ou
ss -tulpn | grep :5000
```

### Verificar Logs do Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Verificar Permissões

```bash
ls -la /var/www/partiu-ensaio
chown -R www-data:www-data /var/www/partiu-ensaio
```

### Reiniciar Serviços

```bash
# Nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# MySQL
sudo systemctl restart mysql
sudo systemctl status mysql

# PM2
pm2 restart all
pm2 save
```

---

## 🔧 Criar Script no Servidor

### Método 1: Via Nano

```bash
nano /var/www/partiu-ensaio/atualizar-servidor.sh
```

Cole o conteúdo do arquivo `atualizar-servidor.sh` e salve (Ctrl+O, Enter, Ctrl+X).

### Método 2: Via SCP (do seu computador Windows)

```powershell
# No PowerShell do Windows
scp atualizar-servidor.sh root@seu-servidor:/var/www/partiu-ensaio/
```

### Método 3: Via Cat (copiar e colar)

```bash
cat > /var/www/partiu-ensaio/atualizar-servidor.sh << 'EOF'
# Cole aqui o conteúdo do arquivo atualizar-servidor.sh
EOF
```

Depois tornar executável:
```bash
chmod +x /var/www/partiu-ensaio/atualizar-servidor.sh
```

---

## 🚀 Atualização Rápida (Uma Linha)

```bash
cd /var/www/partiu-ensaio && git restore . && git pull origin master && cd server && npm install && cd ../client && npm install && npm run build && cd .. && pm2 restart partiu-ensaio
```

---

## 📝 Verificar se Atualização Funcionou

```bash
# Verificar se arquivo foi atualizado
cat /var/www/partiu-ensaio/client/src/utils/api.js | grep "getApiUrl"

# Verificar build
ls -la /var/www/partiu-ensaio/client/build/

# Verificar PM2
pm2 status
pm2 logs partiu-ensaio --lines 50
```

---

## 🆘 Troubleshooting Linux

### Erro: "Permission denied"
```bash
sudo chown -R $USER:$USER /var/www/partiu-ensaio
chmod -R 755 /var/www/partiu-ensaio
```

### Erro: "Command not found: npm"
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Erro: "Port 5000 already in use"
```bash
# Encontrar processo
lsof -i :5000
# ou
fuser -k 5000/tcp

# Matar processo
kill -9 $(lsof -t -i:5000)
```

### Erro: "PM2 not found"
```bash
npm install -g pm2
pm2 startup
pm2 save
```

---

## 📚 Estrutura de Diretórios no Linux

```
/var/www/partiu-ensaio/
├── server/
│   ├── index.js
│   ├── database-mysql.js
│   ├── .env
│   └── package.json
├── client/
│   ├── src/
│   ├── build/          # Build de produção
│   └── package.json
├── database/
│   └── mysql-schema.sql
└── ecosystem.config.js
```

---

## ✅ Checklist de Atualização

- [ ] `cd /var/www/partiu-ensaio`
- [ ] `git restore .`
- [ ] `git pull origin master`
- [ ] `cd server && npm install`
- [ ] `cd ../client && npm install && npm run build`
- [ ] `pm2 restart partiu-ensaio`
- [ ] Verificar logs: `pm2 logs partiu-ensaio`
- [ ] Testar no navegador
