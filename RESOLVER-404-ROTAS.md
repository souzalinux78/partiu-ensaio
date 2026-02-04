# 🚨 Resolver Erro 404 nas Rotas da API

## Problema
As rotas `/api/ensaio/public` e `/api/auth/login` retornam 404, mesmo com o servidor rodando na porta 5000.

## Causa Provável
O servidor travou na inicialização do banco de dados MySQL e não registrou as rotas.

## Solução Rápida

### 1. Parar o servidor atual

```powershell
# Encontrar e parar o processo na porta 5000
$pid = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) {
    Stop-Process -Id $pid -Force
    Write-Host "✅ Processo $pid parado"
    Start-Sleep -Seconds 2
} else {
    Write-Host "⚠️ Nenhum processo encontrado na porta 5000"
}
```

### 2. Verificar se o MySQL está rodando

```powershell
# Verificar serviço MySQL
Get-Service | Where-Object {$_.DisplayName -like "*MySQL*"}
```

Se não estiver rodando, inicie o MySQL.

### 3. Testar conexão MySQL

```powershell
cd server
node criar-admin-mysql.js
```

Se der erro de conexão, o MySQL não está acessível. Verifique:
- MySQL está instalado e rodando?
- Senha está correta? (padrão: `FLoc25GD!`)
- Banco `partiu_ensaio` existe?

### 4. Criar/Configurar banco se necessário

```powershell
cd server
node configurar-mysql.js
```

### 5. Reiniciar o servidor e OBSERVAR OS LOGS

```powershell
cd server
node index.js
```

**IMPORTANTE:** Você DEVE ver estas mensagens na ordem:

```
✅ Conectado ao banco de dados MySQL
✅ Estrutura do banco verificada
✅ Usuário admin criado/verificado
✅ Banco de dados inicializado
✅ Servidor rodando na porta 5000
📡 API disponível em http://localhost:5000/api
```

**Se aparecer algum erro antes de "Servidor rodando", o problema está na inicialização do banco!**

### 6. Testar a rota

Em outro terminal ou no navegador:

```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/ensaio/public" -Method GET

# Ou no navegador:
http://localhost:5000/api/ensaio/public
```

## Solução Alternativa: Usar SQLite Temporariamente

Se o MySQL não estiver disponível, use SQLite:

1. **Edite `server/index.js`** (linha 8-9):

```javascript
// COMENTAR esta linha:
// const db = require('./database-mysql'); // Para MySQL

// DESCOMENTAR esta linha:
const db = require('./database'); // Para SQLite
```

2. **Reinicie o servidor:**

```powershell
cd server
node index.js
```

3. **Teste novamente**

## Verificar se as Rotas Estão Registradas

Se o servidor iniciou mas as rotas ainda não funcionam, adicione uma rota de teste:

**Edite `server/index.js`** e adicione ANTES de `app.listen()`:

```javascript
// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!' });
});
```

Se `/api/test` funcionar mas as outras não, o problema está nas rotas específicas.

## Checklist

- [ ] Servidor parado completamente
- [ ] MySQL rodando e acessível
- [ ] Banco `partiu_ensaio` existe
- [ ] Servidor iniciou SEM erros
- [ ] Logs mostram "Servidor rodando na porta 5000"
- [ ] Rota `/api/test` funciona (se adicionada)
- [ ] Rota `/api/ensaio/public` funciona
