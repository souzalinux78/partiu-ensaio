#!/bin/bash

# Script para atualizar o servidor do Partiu Ensaio
# Uso: ./update-server.sh

set -e  # Parar em caso de erro

echo "🔄 Iniciando atualização do servidor..."

# Navegar para o diretório do projeto
cd /var/www/partiu-ensaio || exit 1

echo "📥 Atualizando código do GitHub..."

# Verificar se é repositório Git
if [ ! -d .git ]; then
    echo "⚠️ Repositório Git não encontrado. Inicializando..."
    git init
    git remote add origin https://github.com/souzalinux78/partiu-ensaio.git || true
fi

# Verificar remote
if ! git remote | grep -q origin; then
    echo "⚠️ Remote 'origin' não encontrado. Adicionando..."
    git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
fi

# Buscar atualizações
git fetch origin

# Verificar qual branch usar (main ou master)
if git ls-remote --heads origin | grep -q "refs/heads/main"; then
    BRANCH="main"
elif git ls-remote --heads origin | grep -q "refs/heads/master"; then
    BRANCH="master"
else
    echo "❌ Nenhum branch 'main' ou 'master' encontrado no remote!"
    exit 1
fi

echo "✅ Branch encontrado: $BRANCH"

# Fazer checkout do branch se necessário
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ] || [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "🔄 Mudando para branch $BRANCH..."
    git checkout -b "$BRANCH" "origin/$BRANCH" 2>/dev/null || git checkout "$BRANCH" 2>/dev/null || true
fi

# Descartar mudanças locais e atualizar
echo "🔄 Atualizando código..."
git reset --hard "origin/$BRANCH"

echo "✅ Código atualizado!"

# Rebuild do frontend
echo "🔨 Fazendo build do frontend..."
cd client || exit 1
npm install --production=false 2>/dev/null || true
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build do frontend concluído!"
else
    echo "⚠️ Erro no build do frontend, mas continuando..."
fi

# Voltar para raiz
cd /var/www/partiu-ensaio || exit 1

# Reiniciar PM2
echo "🔄 Reiniciando aplicação..."
pm2 restart partiu-ensaio || pm2 start ecosystem.config.js || echo "⚠️ PM2 não encontrado ou não configurado"

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verificar logs: pm2 logs partiu-ensaio"
echo "   2. Verificar status: pm2 status"
echo "   3. Testar aplicação no navegador"
