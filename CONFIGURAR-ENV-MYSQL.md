# Configurar .env para MySQL

## 📝 Seu .env atual está assim:

```env
JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
SERVER_URL=https://partiuensaio.automatizeonline.com
NODE_ENV=production
```

## ✅ Adicione as configurações MySQL:

```env
JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
SERVER_URL=https://partiuensaio.automatizeonline.com
NODE_ENV=production

# Configuração MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua-senha-mysql-aqui
DB_NAME=partiu_ensaio

# Porta do servidor (opcional, padrão é 5000)
PORT=5000
```

## 🔧 Como configurar:

### 1. Editar o arquivo .env

```bash
cd /var/www/partiu-ensaio/server
nano .env
```

### 2. Adicionar as linhas MySQL

Adicione estas 4 linhas no final do arquivo:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua-senha-mysql-aqui
DB_NAME=partiu_ensaio
```

### 3. Substituir `sua-senha-mysql-aqui`

**IMPORTANTE:** Substitua `sua-senha-mysql-aqui` pela senha real do seu MySQL!

Exemplo:
```env
DB_PASSWORD=MinhaSenhaMySQL123
```

### 4. Verificar usuário MySQL

Se o usuário MySQL não for `root`, altere também:
```env
DB_USER=seu-usuario-mysql
```

### 5. Verificar nome do banco

Se o banco tiver outro nome, altere:
```env
DB_NAME=nome-do-seu-banco
```

## 📋 Exemplo completo do .env:

```env
JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
SERVER_URL=https://partiuensaio.automatizeonline.com
NODE_ENV=production

# Configuração MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=MinhaSenhaMySQL123
DB_NAME=partiu_ensaio

# Porta do servidor
PORT=5000
```

## ✅ Testar conexão MySQL

Após configurar, teste se consegue conectar:

```bash
mysql -u root -p
# Digite a senha quando pedir
```

Se conectar, está correto!

## 🚨 Importante

1. **Nunca compartilhe o arquivo `.env`** - ele contém senhas!
2. **Use senhas fortes** para MySQL em produção
3. **Verifique se o MySQL está rodando:**
   ```bash
   systemctl status mysql
   # ou
   systemctl status mariadb
   ```

## 🔍 Verificar se está funcionando

Após configurar, reinicie o servidor:

```bash
cd /var/www/partiu-ensaio/server
pm2 restart partiu-ensaio
# ou
npm start
```

Deve aparecer:
```
✅ Conectado ao banco de dados MySQL
✅ Estrutura do banco verificada
```

Se aparecer erro de conexão, verifique:
- Senha está correta?
- MySQL está rodando?
- Usuário tem permissão?
- Banco `partiu_ensaio` existe?
