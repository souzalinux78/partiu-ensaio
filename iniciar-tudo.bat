@echo off
echo ========================================
echo INICIAR PARTIU ENSAIO - BACKEND + FRONTEND
echo ========================================
echo.

REM Parar processos Node anteriores
echo Parando processos Node anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

REM ========================================
REM INICIAR BACKEND (MySQL)
REM ========================================
echo.
echo [1/2] Iniciando BACKEND (MySQL) na porta 5000...
echo.

cd /d "%~dp0\server"

set PORT=5000
set NODE_ENV=development
set JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=FLoc25GD!
set DB_NAME=partiu_ensaio

start "Backend - Partiu Ensaio" cmd /k "node index.js"

timeout /t 3 >nul

REM ========================================
REM INICIAR FRONTEND (React)
REM ========================================
echo.
echo [2/2] Iniciando FRONTEND (React) na porta 3000...
echo.

cd /d "%~dp0\client"

REM Verificar se node_modules existe
if not exist "node_modules" (
    echo Instalando dependências do frontend...
    call npm install
)

start "Frontend - Partiu Ensaio" cmd /k "npm start"

echo.
echo ========================================
echo ✅ SERVIÇOS INICIADOS!
echo ========================================
echo.
echo Backend:  http://localhost:5000/api
echo Frontend: http://localhost:3000
echo.
echo Credenciais Admin:
echo   Email: admin@partiuensaio.com
echo   Senha: admin123
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul
