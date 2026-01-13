@echo off
echo ========================================
echo CONFIGURAR MYSQL LOCAL
echo ========================================
echo.

REM Criar banco de dados
echo Criando banco de dados...
mysql -u root -pFLoc25GD! -e "CREATE DATABASE IF NOT EXISTS partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if errorlevel 1 (
    echo [ERRO] Falha ao criar banco de dados!
    echo Verifique se o MySQL esta rodando e se a senha esta correta.
    pause
    exit /b 1
)

echo [OK] Banco de dados criado
echo.

REM Executar schema
echo Executando schema...
mysql -u root -pFLoc25GD! partiu_ensaio < database\mysql-schema.sql

if errorlevel 1 (
    echo [ERRO] Falha ao executar schema!
    pause
    exit /b 1
)

echo [OK] Schema executado
echo.

REM Criar admin
echo Criando usuario admin...
mysql -u root -pFLoc25GD! partiu_ensaio < database\mysql-insert-admin.sql

if errorlevel 1 (
    echo [AVISO] Falha ao criar admin, mas continuando...
)

echo [OK] Configuracao concluida!
echo.
echo Credenciais:
echo   Email: admin@partiuensaio.com
echo   Senha: admin123
echo.
pause
