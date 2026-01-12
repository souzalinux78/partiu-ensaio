# Guia de Deploy - Partiu Ensaio

## 📋 Pré-requisitos

### Servidor
- **Sistema Operacional**: Ubuntu 20.04+ ou similar (Linux)
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Disco**: Mínimo 10GB livres
- **Acesso**: SSH root ou sudo

### Software Necessário
- Node.js 18+ e npm
- PM2 (gerenciador de processos)
- Nginx (servidor web reverso)
- Certbot (para SSL/HTTPS)
- SQLite3 (já incluído com Node.js)

---

## 🚀 Passo 1: Preparar o Servidor

### 1.1 Atualizar o sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Instalar Node.js
```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 1.3 Instalar PM2 globalmente
```bash
sudo npm install -g pm2
```

### 1.4 Instalar Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 Instalar Certbot (para SSL)
```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 📦 Passo 2: Preparar o Código

### 2.1 No seu computador local

#### Opção A: Usar Git (Recomendado)
```bash
# No diretório do projeto
git init
git add .
git commit -m "Versão inicial para deploy"

# Criar repositório no GitHub/GitLab e fazer push
git remote add origin https://github.com/seu-usuario/partiu-ensaio.git
git push -u origin main
```

#### Opção B: Transferir via SCP
```bash
# Compactar o projeto (excluindo node_modules)
tar -czf partiu-ensaio.tar.gz --exclude='node_modules' --exclude='.git' PartiuEnsaio/

# Transferir para o servidor
scp partiu-ensaio.tar.gz usuario@seu-servidor.com:/home/usuario/
```

---

## 🔧 Passo 3: Configurar no Servidor

### 3.1 Conectar ao servidor
```bash
ssh usuario@seu-servidor.com
```

### 3.2 Criar diretório da aplicação
```bash
sudo mkdir -p /var/www/partiu-ensaio
sudo chown $USER:$USER /var/www/partiu-ensaio
cd /var/www/partiu-ensaio
```

### 3.3 Clonar/Extrair o código

**Se usou Git:**
```bash
git clone https://github.com/seu-usuario/partiu-ensaio.git .
```

**Se transferiu via SCP:**
```bash
# Extrair o arquivo
tar -xzf ~/partiu-ensaio.tar.gz --strip-components=1
```

### 3.4 Instalar dependências do servidor
```bash
cd server
npm install --production
```

### 3.5 Instalar dependências do cliente
```bash
cd ../client
npm install
```

### 3.6 Fazer build do cliente
```bash
npm run build
```

Isso criará a pasta `build` com os arquivos estáticos.

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### 4.1 Criar arquivo .env no servidor
```bash
cd /var/www/partiu-ensaio/server
nano .env
```

### 4.2 Adicionar configurações
```env
# Porta do servidor (use uma porta interna, Nginx fará o proxy)
PORT=5000

# JWT Secret (gere uma string aleatória forte)
JWT_SECRET=SUA_CHAVE_SECRETA_MUITO_FORTE_AQUI_GERE_UMA_ALEATORIA

# URL do servidor (ajuste com seu domínio)
SERVER_URL=https://partiuensaio.com

# Ambiente
NODE_ENV=production
```

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4.3 Criar diretório de uploads
```bash
mkdir -p /var/www/partiu-ensaio/server/uploads
chmod 755 /var/www/partiu-ensaio/server/uploads
```

---

## 🗄️ Passo 5: Configurar Banco de Dados

### 5.1 O SQLite será criado automaticamente
O banco será criado em: `/var/www/partiu-ensaio/server/database.sqlite`

### 5.2 (Opcional) Fazer backup do banco existente
Se você já tem um banco local:
```bash
# No seu computador
scp server/database.sqlite usuario@seu-servidor.com:/var/www/partiu-ensaio/server/
```

### 5.3 Garantir permissões
```bash
chmod 644 /var/www/partiu-ensaio/server/database.sqlite
```

---

## 🚀 Passo 6: Configurar PM2

### 6.1 Criar arquivo de configuração PM2
```bash
cd /var/www/partiu-ensaio
nano ecosystem.config.js
```

### 6.2 Adicionar configuração
```javascript
module.exports = {
  apps: [{
    name: 'partiu-ensaio',
    script: './server/index.js',
    cwd: '/var/www/partiu-ensaio',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 6.3 Criar diretório de logs
```bash
mkdir -p /var/www/partiu-ensaio/logs
```

### 6.4 Iniciar aplicação com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

O último comando mostrará um comando para executar com sudo - execute-o.

---

## 🌐 Passo 7: Configurar Nginx

### 7.1 Criar configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/partiu-ensaio
```

### 7.2 Adicionar configuração
```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name partiuensaio.com www.partiuensaio.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    server_name partiuensaio.com www.partiuensaio.com;

    # Certificados SSL (serão gerados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/partiuensaio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/partiuensaio.com/privkey.pem;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Tamanho máximo de upload (para fotos)
    client_max_body_size 10M;

    # Servir arquivos estáticos do React
    location / {
        root /var/www/partiu-ensaio/client/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # API - Proxy para Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads de imagens
    location /uploads {
        alias /var/www/partiu-ensaio/server/uploads;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Service Worker e Manifest (sem cache)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/partiu-ensaio/client/build;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3 Habilitar o site
```bash
sudo ln -s /etc/nginx/sites-available/partiu-ensaio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Passo 8: Configurar SSL/HTTPS

### 8.1 Obter certificado SSL gratuito
```bash
sudo certbot --nginx -d partiuensaio.com -d www.partiuensaio.com
```

Siga as instruções:
- Email para notificações
- Aceitar termos
- (Opcional) Compartilhar email com EFF

### 8.2 Renovação automática
O Certbot configura renovação automática. Teste:
```bash
sudo certbot renew --dry-run
```

---

## ✅ Passo 9: Verificar e Testar

### 9.1 Verificar status do PM2
```bash
pm2 status
pm2 logs partiu-ensaio
```

### 9.2 Verificar Nginx
```bash
sudo systemctl status nginx
```

### 9.3 Testar a aplicação
- Acesse: `https://partiuensaio.com`
- Teste login, cadastro, uploads
- Verifique se o PWA pode ser instalado

### 9.4 Verificar logs
```bash
# Logs do PM2
pm2 logs partiu-ensaio

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Passo 10: Atualizações Futuras

### 10.1 Processo de atualização
```bash
cd /var/www/partiu-ensaio

# Se usar Git
git pull origin main

# Atualizar dependências do servidor
cd server
npm install --production

# Atualizar e fazer build do cliente
cd ../client
npm install
npm run build

# Reiniciar aplicação
pm2 restart partiu-ensaio

# Verificar logs
pm2 logs partiu-ensaio
```

### 10.2 Backup do banco de dados
```bash
# Criar script de backup
nano /var/www/partiu-ensaio/backup.sh
```

Adicione:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/partiu-ensaio"
mkdir -p $BACKUP_DIR
cp /var/www/partiu-ensaio/server/database.sqlite $BACKUP_DIR/database-$(date +%Y%m%d-%H%M%S).sqlite
# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "database-*.sqlite" -mtime +7 -delete
```

Tornar executável:
```bash
chmod +x /var/www/partiu-ensaio/backup.sh
```

Agendar backup diário:
```bash
crontab -e
# Adicionar linha:
0 2 * * * /var/www/partiu-ensaio/backup.sh
```

---

## 🛠️ Comandos Úteis

### Gerenciar aplicação
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs partiu-ensaio

# Reiniciar
pm2 restart partiu-ensaio

# Parar
pm2 stop partiu-ensaio

# Iniciar
pm2 start partiu-ensaio

# Monitorar
pm2 monit
```

### Gerenciar Nginx
```bash
# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx
```

### Verificar portas
```bash
# Ver se a porta 5000 está em uso
sudo netstat -tlnp | grep 5000

# Ver processos Node
ps aux | grep node
```

---

## 🔍 Troubleshooting

### Aplicação não inicia
```bash
# Ver logs detalhados
pm2 logs partiu-ensaio --lines 100

# Verificar se a porta está livre
sudo lsof -i :5000

# Verificar permissões
ls -la /var/www/partiu-ensaio/server/
```

### Erro 502 Bad Gateway
- Verificar se o PM2 está rodando: `pm2 status`
- Verificar se a porta 5000 está correta no Nginx
- Verificar logs do Nginx: `sudo tail -f /var/log/nginx/error.log`

### Erro de permissão
```bash
# Ajustar permissões
sudo chown -R $USER:$USER /var/www/partiu-ensaio
chmod -R 755 /var/www/partiu-ensaio
chmod 644 /var/www/partiu-ensaio/server/database.sqlite
```

### SSL não funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📝 Checklist Final

- [ ] Node.js instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx instalado e configurado
- [ ] SSL/HTTPS configurado
- [ ] Aplicação rodando no PM2
- [ ] Build do cliente feito
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado
- [ ] Uploads funcionando
- [ ] PWA funcionando (HTTPS)
- [ ] Backup configurado
- [ ] Domínio apontando para o servidor

---

## 🌍 Configuração de DNS

No seu provedor de domínio, configure:

**Registro A:**
```
@ → IP_DO_SERVIDOR
www → IP_DO_SERVIDOR
```

**Exemplo:**
```
A     @           192.168.1.100
A     www         192.168.1.100
```

Aguarde propagação (pode levar até 48h, geralmente menos de 1h).

---

## 💡 Dicas de Segurança

1. **Firewall:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Atualizar sistema regularmente:**
```bash
sudo apt update && sudo apt upgrade -y
```

3. **Não expor porta 5000 publicamente** (só via Nginx)

4. **JWT_SECRET forte e único**

5. **Backups regulares do banco de dados**

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs` e `sudo tail -f /var/log/nginx/error.log`
2. Verifique status: `pm2 status` e `sudo systemctl status nginx`
3. Teste manualmente: `cd /var/www/partiu-ensaio/server && node index.js`
