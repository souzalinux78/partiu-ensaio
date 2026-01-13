# Partiu Ensaio - Iniciar Serviços
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PARTIU ENSAIO - INICIAR SERVIÇOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar processos Node anteriores
Write-Host "[1/3] Parando processos Node anteriores..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Processos anteriores parados" -ForegroundColor Green
Write-Host ""

# Iniciar Backend
Write-Host "[2/3] Iniciando BACKEND (MySQL) na porta 5000..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "server"
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = "FLoc25GD!"
$env:DB_NAME = "partiu_ensaio"
$env:PORT = "5000"
$env:JWT_SECRET = "27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🚀 BACKEND - PARTIU ENSAIO' -ForegroundColor Cyan; Write-Host 'Porta: 5000' -ForegroundColor Yellow; Write-Host ''; `$env:DB_HOST='localhost'; `$env:DB_USER='root'; `$env:DB_PASSWORD='FLoc25GD!'; `$env:DB_NAME='partiu_ensaio'; `$env:PORT='5000'; `$env:JWT_SECRET='27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef'; Set-Location '$backendPath'; node index.js"

Start-Sleep -Seconds 3
Write-Host "✅ Backend iniciado" -ForegroundColor Green
Write-Host ""

# Iniciar Frontend
Write-Host "[3/3] Iniciando FRONTEND (React) na porta 3000..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "client"

# Verificar se node_modules existe
if (-not (Test-Path (Join-Path $frontendPath "node_modules"))) {
    Write-Host "⚠️  Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    Write-Host ""
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🌐 FRONTEND - PARTIU ENSAIO' -ForegroundColor Green; Write-Host 'Porta: 3000' -ForegroundColor Yellow; Write-Host ''; Set-Location '$frontendPath'; npm start"

Start-Sleep -Seconds 2
Write-Host "✅ Frontend iniciado" -ForegroundColor Green
Write-Host ""

# Aguardar e verificar
Write-Host "Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ SERVIÇOS INICIADOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backend = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -WarningAction SilentlyContinue
$frontend = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($backend) {
    Write-Host "✅ Backend (porta 5000): RODANDO" -ForegroundColor Green
} else {
    Write-Host "⏳ Backend (porta 5000): AINDA INICIANDO..." -ForegroundColor Yellow
}

if ($frontend) {
    Write-Host "✅ Frontend (porta 3000): RODANDO" -ForegroundColor Green
} else {
    Write-Host "⏳ Frontend (porta 3000): AINDA INICIANDO..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📡 Backend:  http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 Credenciais Admin:" -ForegroundColor Yellow
Write-Host "   Email: admin@partiuensaio.com"
Write-Host "   Senha: admin123"
Write-Host ""
Write-Host "💡 Duas janelas foram abertas:" -ForegroundColor Magenta
Write-Host "   - Backend (porta 5000)"
Write-Host "   - Frontend (porta 3000)"
Write-Host ""
Write-Host "⚠️  NÃO FECHE ESTAS JANELAS!" -ForegroundColor Red
Write-Host "   Para parar os serviços, feche as janelas do Backend e Frontend"
Write-Host ""
