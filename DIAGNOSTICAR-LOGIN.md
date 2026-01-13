# Diagnosticar Problema de Login

## 🔍 Problemas Possíveis

### 1. Backend não está rodando
O erro `ERR_FAILED` em `localhost:5000` indica que o backend não está respondendo.

### 2. Senha do admin pode estar incorreta
O hash da senha pode não corresponder.

### 3. Admin não existe no banco
O usuário admin pode não ter sido criado.

## ✅ Diagnóstico no Servidor

### 1. Verificar se backend está rodando

```bash
pm2 status
pm2 logs partiu-ensaio --lines 30
```

### 2. Verificar se porta 5000 está ativa

```bash
netstat -tulpn | grep :5000
# ou
ss -tulpn | grep :5000
```

### 3. Testar backend diretamente

```bash
curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@partiuensaio.com","password":"admin123"}'
```

### 4. Verificar se admin existe no banco

```bash
cd /var/www/partiu-ensaio/server
sqlite3 database.sqlite "SELECT id, email, role, aprovado FROM users WHERE email='admin@partiuensaio.com';"
```

### 5. Verificar hash da senha

```bash
sqlite3 database.sqlite "SELECT password FROM users WHERE email='admin@partiuensaio.com';"
```

## 🔧 Soluções

### Solução 1: Reiniciar Backend

```bash
pm2 restart partiu-ensaio
pm2 logs partiu-ensaio --lines 20
```

### Solução 2: Recriar Admin

Se o admin não existir ou a senha estiver errada:

```bash
cd /var/www/partiu-ensaio/server
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10, (err, hash) => { if (err) console.error(err); else console.log(hash); });"
```

Copie o hash gerado e execute:

```bash
sqlite3 database.sqlite "UPDATE users SET password='HASH_AQUI' WHERE email='admin@partiuensaio.com';"
```

Ou delete e recrie:

```bash
sqlite3 database.sqlite "DELETE FROM users WHERE email='admin@partiuensaio.com';"
```

Depois reinicie o servidor (ele vai criar o admin automaticamente).

### Solução 3: Verificar Logs de Login

Os logs devem mostrar:
- Email sendo verificado
- Se usuário foi encontrado
- Resultado da comparação de senha

## 🚀 Comandos Rápidos

```bash
# Verificar tudo
pm2 status
pm2 logs partiu-ensaio --lines 30
netstat -tulpn | grep :5000
curl http://localhost:5000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@partiuensaio.com","password":"admin123"}'
```
