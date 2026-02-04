# 🔄 Reiniciar Servidor e Testar Endpoint

## ⚠️ Problema

O erro "Cannot GET" indica que o servidor precisa ser **reiniciado** para carregar a nova rota `/api/ensaio/por-telefone/:telefone`.

## 🔧 Solução: Reiniciar o Servidor

### Opção 1: Parar e Iniciar Manualmente

```powershell
# 1. Parar o servidor (encontrar PID e matar processo)
$pid = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) {
    Stop-Process -Id $pid -Force
    Write-Host "Servidor parado (PID: $pid)"
}

# 2. Aguardar 2 segundos
Start-Sleep -Seconds 2

# 3. Iniciar servidor novamente
cd server
npm start
```

### Opção 2: Usar Script de Inicialização

```powershell
# Parar servidor atual
.\iniciar-servidor.bat
# (ou reiniciar manualmente)
```

## 🧪 Após Reiniciar: Testar Endpoint

### Teste 1: Telefone Completo
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/ensaio/por-telefone/5511974605594" -Method GET
```

### Teste 2: Telefone sem DDI (será normalizado)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/ensaio/por-telefone/11974605594" -Method GET
```

### Teste 3: Verificar Resposta Vazia (sem ensaio)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/ensaio/por-telefone/5511999999999" -Method GET
```

## 📋 Respostas Esperadas

### ✅ Com Ensaio Hoje
```json
{
  "ensaio_id": 123,
  "titulo": "Igreja Central",
  "horario": "20:00",
  "data": "2024-01-15"
}
```

### ❌ Sem Ensaio Hoje
```json
{}
```

## 🔍 Verificar se Rota Foi Carregada

Após reiniciar, verifique os logs do servidor. Você deve ver:
```
✅ Servidor rodando na porta 5000
📡 API disponível em http://localhost:5000/api
```

E ao testar o endpoint, não deve mais aparecer "Cannot GET".

## ⚡ Comando Rápido (PowerShell)

```powershell
# Parar servidor
$pid = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force }

# Aguardar
Start-Sleep -Seconds 2

# Iniciar servidor (em nova janela ou background)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm start"
```
