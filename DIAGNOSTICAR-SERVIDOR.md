# 🔍 Diagnosticar Problema 404 no Servidor

## Problema
As rotas `/api/ensaio/public` e `/api/auth/login` estão retornando 404.

## Possíveis Causas

### 1. Servidor não inicializou completamente
O servidor pode estar travado na inicialização do banco de dados MySQL.

### 2. Banco MySQL não está acessível
Verifique se o MySQL está rodando e se as credenciais estão corretas.

## Solução Passo a Passo

### Passo 1: Verificar se o MySQL está rodando

```powershell
# Verificar se o MySQL está rodando
Get-Service | Where-Object {$_.Name -like "*mysql*"}
```

Ou verifique manualmente no Gerenciador de Serviços do Windows.

### Passo 2: Parar o servidor atual

```powershell
# Encontrar o processo
$pid = (Get-NetTCPConnection -LocalPort 5000).OwningProcess
Stop-Process -Id $pid -Force
```

### Passo 3: Verificar configuração do MySQL

Verifique se o arquivo `.env` na pasta `server/` existe e tem as configurações corretas:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=FLoc25GD!
DB_NAME=partiu_ensaio
PORT=5000
JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
```

### Passo 4: Testar conexão MySQL

```powershell
cd server
node -e "const mysql = require('mysql2/promise'); const conn = mysql.createConnection({host: 'localhost', user: 'root', password: 'FLoc25GD!'}); conn.then(c => {console.log('✅ MySQL OK'); c.end();}).catch(e => console.error('❌ Erro:', e.message));"
```

### Passo 5: Verificar se o banco existe

```powershell
cd server
node -e "const mysql = require('mysql2/promise'); const conn = mysql.createConnection({host: 'localhost', user: 'root', password: 'FLoc25GD!', database: 'partiu_ensaio'}); conn.then(c => {console.log('✅ Banco existe'); c.end();}).catch(e => console.error('❌ Erro:', e.message));"
```

### Passo 6: Criar banco se não existir

```powershell
cd server
node configurar-mysql.js
```

### Passo 7: Reiniciar o servidor

```powershell
cd server
node index.js
```

**Observe os logs!** Você deve ver:
- ✅ Conectado ao banco de dados MySQL
- ✅ Estrutura do banco verificada
- ✅ Usuário admin criado/verificado
- ✅ Servidor rodando na porta 5000
- 📡 API disponível em http://localhost:5000/api

### Passo 8: Testar a rota

Abra outro terminal e teste:

```powershell
# Testar rota de ensaios
Invoke-WebRequest -Uri "http://localhost:5000/api/ensaio/public" -Method GET
```

Ou use o navegador: `http://localhost:5000/api/ensaio/public`

## Solução Alternativa: Usar SQLite

Se o MySQL não estiver disponível, você pode temporariamente usar SQLite:

1. Edite `server/index.js`:
```javascript
// Trocar esta linha:
const db = require('./database-mysql'); // Para MySQL

// Por esta:
const db = require('./database'); // Para SQLite
```

2. Reinicie o servidor:
```powershell
cd server
node index.js
```

## Verificar Logs do Servidor

Quando iniciar o servidor, observe se aparecem erros como:
- ❌ Erro ao conectar ao MySQL
- ❌ Erro ao inicializar banco de dados
- ❌ Erro ao criar tabelas

Se aparecer algum erro, o servidor não vai iniciar o `app.listen()` e as rotas não estarão disponíveis.
