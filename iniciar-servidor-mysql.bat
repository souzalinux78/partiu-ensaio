@echo off
echo ========================================
echo INICIAR SERVIDOR COM MYSQL
echo ========================================
echo.

cd /d "%~dp0\server"

REM Configurar variáveis de ambiente
set PORT=5000
set NODE_ENV=development
set JWT_SECRET=27d50f6c877491c373e91a4c4ef90a3ef1bef914a18b571eeb8c2d8bf4b87cef
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=FLoc25GD!
set DB_NAME=partiu_ensaio

echo ✅ Configurações MySQL:
echo    Host: %DB_HOST%
echo    User: %DB_USER%
echo    Database: %DB_NAME%
echo.
echo 🚀 Iniciando servidor...
echo.

node index.js
