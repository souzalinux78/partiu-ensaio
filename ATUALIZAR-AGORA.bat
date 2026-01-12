@echo off
echo ========================================
echo ATUALIZAR REPOSITORIO GITHUB
echo ========================================
echo.

REM Verificar se Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Git nao esta instalado!
    echo.
    echo Por favor, instale o Git:
    echo https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [OK] Git encontrado
echo.

REM Navegar para o diretório do projeto
cd /d "%~dp0"
echo Diretorio: %CD%
echo.

REM Verificar se é repositório Git
if not exist ".git" (
    echo [INFO] Inicializando repositorio Git...
    git init
    git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
    echo [OK] Repositorio inicializado
    echo.
)

REM Verificar status
echo Verificando mudancas...
git status
echo.

REM Perguntar se deseja continuar
set /p continuar="Deseja adicionar todos os arquivos e fazer commit? (S/N): "
if /i not "%continuar%"=="S" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo Adicionando arquivos...
git add .
echo [OK] Arquivos adicionados
echo.

REM Perguntar mensagem de commit
set /p mensagem="Digite a mensagem do commit (ou pressione Enter para usar padrao): "
if "%mensagem%"=="" set mensagem=Atualiza arquivos do projeto

echo.
echo Fazendo commit...
git commit -m "%mensagem%"
echo [OK] Commit realizado
echo.

REM Perguntar se deseja fazer push
set /p fazerpush="Deseja enviar para o GitHub? (S/N): "
if /i not "%fazerpush%"=="S" (
    echo.
    echo Para enviar depois, execute: git push
    pause
    exit /b 0
)

echo.
echo Enviando para GitHub...
echo [NOTA] Se pedir autenticacao, use seu Personal Access Token como senha
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao enviar. Verifique:
    echo - Se esta autenticado corretamente
    - Se o remote origin esta configurado
    - Se ha mudancas remotas (tente: git pull primeiro)
    echo.
) else (
    echo.
    echo [SUCESSO] Arquivos enviados para o GitHub!
    echo.
    echo Acesse: https://github.com/souzalinux78/partiu-ensaio
    echo.
)

pause
