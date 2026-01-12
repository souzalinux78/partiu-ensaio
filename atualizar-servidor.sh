#!/bin/bash

# Script para atualizar o servidor Partiu Ensaio no Linux
# Uso: ./atualizar-servidor.sh

set -e  # Parar em caso de erro

echo "🔄 Iniciando atualização do servidor..."
echo ""

# Navegar para o diretório do projeto
cd /var/www/partiu-ensaio || {
    echo "❌ Erro: Diretório /var/www/partiu-ensaio não encontrado!"
    exit 1
}

echo "📂 Diretório: $(pwd)"
echo ""

# Passo 1: Descartar mudanças locais
echo "🗑️  Descartando mudanças locais..."
git restore . 2>/dev/null || git checkout . 2>/dev/null || echo "⚠️  Nenhuma mudança para descartar"
echo "✅ Mudanças locais descartadas"
echo ""

# Passo 2: Fazer pull
echo "📥 Atualizando código do GitHub..."
if git pull origin master; then
    echo "✅ Código atualizado com sucesso!"
else
    echo "⚠️  Erro no git pull, tentando fetch + reset..."
    git fetch origin
    git reset --hard origin/master
    echo "✅ Código atualizado via reset!"
fi
echo ""

# Passo 3: Reinstalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd server
if npm install; then
    echo "✅ Dependências do backend instaladas!"
else
    echo "⚠️  Erro ao instalar dependências do backend"
fi
cd ..
echo ""

# Passo 4: Reinstalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd client
if npm install; then
    echo "✅ Dependências do frontend instaladas!"
else
    echo "⚠️  Erro ao instalar dependências do frontend"
fi
echo ""

# Passo 5: Build do frontend
echo "🔨 Fazendo build do frontend..."
if npm run build; then
    echo "✅ Build do frontend concluído!"
else
    echo "❌ Erro no build do frontend!"
    exit 1
fi
cd ..
echo ""

# Passo 6: Reiniciar PM2
echo "🔄 Reiniciando aplicação PM2..."
if command -v pm2 &> /dev/null; then
    if pm2 restart partiu-ensaio; then
        echo "✅ Aplicação reiniciada!"
    else
        echo "⚠️  PM2 restart falhou, tentando start..."
        pm2 start ecosystem.config.js || echo "⚠️  PM2 não configurado"
    fi
else
    echo "⚠️  PM2 não encontrado. Reinicie manualmente com: pm2 restart partiu-ensaio"
fi
echo ""

# Verificar status
echo "📊 Status final:"
echo ""
git status --short
echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verificar logs: pm2 logs partiu-ensaio"
echo "   2. Verificar status: pm2 status"
echo "   3. Testar login: https://partiuensaio.automatizeonline.com.br/login"
echo ""
