@echo off
title Partiu Ensaio - Servicos
color 0A

echo ========================================
echo   PARTIU ENSAIO - INICIAR SERVICOS
echo ========================================
echo.

REM Parar processos Node anteriores
echo [1/3] Parando processos Node anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo ✅ Processos anteriores parados
echo.

REM ========================================
REM INICIAR BACKEND (MySQL)
REM ========================================
echo [2/3] Iniciando BACKEND (MySQL) na porta 5000...
echo.

cd /d "%~dp0\server"

set PORT=5000
set NODE_ENV=development
set JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=FLoc25GD!
set DB_NAME=partiu_ensaio

start "Backend - Partiu Ensaio (Porta 5000)" cmd /k "title Backend - Partiu Ensaio ^& color 0B ^& echo ✅ BACKEND INICIANDO... ^& echo. ^& node index.js"

timeout /t 3 >nul
echo ✅ Backend iniciado
echo.

REM ========================================
REM INICIAR FRONTEND (React)
REM ========================================
echo [3/3] Iniciando FRONTEND (React) na porta 3000...
echo.

cd /d "%~dp0\client"

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo ⚠️  Instalando dependências do frontend...
    call npm install
    echo.
)

start "Frontend - Partiu Ensaio (Porta 3000)" cmd /k "title Frontend - Partiu Ensaio ^& color 0E ^& echo ✅ FRONTEND INICIANDO... ^& echo. ^& npm start"

timeout /t 2 >nul
echo ✅ Frontend iniciado
echo.

REM ========================================
REM RESUMO
REM ========================================
echo ========================================
echo   ✅ SERVICOS INICIADOS COM SUCESSO!
echo ========================================
echo.
echo 📡 Backend:  http://localhost:5000/api
echo 🌐 Frontend: http://localhost:3000
echo.
echo 👤 Credenciais Admin:
echo    Email: admin@partiuensaio.com
echo    Senha: admin123
echo.
echo 💡 Duas janelas foram abertas:
echo    - Backend (porta 5000)
echo    - Frontend (porta 3000)
echo.
echo ⚠️  NÃO FECHE ESTAS JANELAS!
echo    Para parar os serviços, feche as janelas do Backend e Frontend
echo.
timeout /t 5 >nul
