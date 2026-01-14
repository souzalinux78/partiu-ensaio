#!/bin/bash
# Script para reiniciar PM2 corretamente

echo "🔄 Reiniciando PM2..."
echo ""

# Parar e deletar todos os processos
echo "🧹 [1/5] Limpando processos órfãos..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 flush 2>/dev/null || true

# Navegar para o diretório
cd /var/www/partiu-ensaio || {
    echo "❌ Erro: Diretório /var/www/partiu-ensaio não encontrado!"
    exit 1
}

# Verificar se ecosystem.config.js existe
if [ -f "ecosystem.config.js" ]; then
    echo "✅ [2/5] ecosystem.config.js encontrado"
    
    # Verificar se o diretório de logs existe
    if [ ! -d "logs" ]; then
        echo "📁 Criando diretório de logs..."
        mkdir -p logs
    fi
    
    # Iniciar usando ecosystem.config.js
    echo "🚀 [3/5] Iniciando aplicação com PM2..."
    pm2 start ecosystem.config.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Aplicação iniciada com sucesso!"
    else
        echo "❌ Erro ao iniciar aplicação"
        echo "⚠️  Tentando iniciar manualmente..."
        cd server
        pm2 start index.js --name partiu-ensaio --env production
        cd ..
    fi
else
    echo "⚠️  [2/5] ecosystem.config.js não encontrado"
    echo "🚀 [3/5] Iniciando manualmente..."
    
    if [ -f "server/index.js" ]; then
        cd server
        pm2 start index.js --name partiu-ensaio --env production
        cd ..
    else
        echo "❌ Erro: server/index.js não encontrado!"
        exit 1
    fi
fi

# Salvar configuração
echo "💾 [4/5] Salvando configuração do PM2..."
pm2 save

# Verificar status
echo ""
echo "📊 [5/5] Status do PM2:"
pm2 status

# Mostrar informações do processo
echo ""
echo "ℹ️  Informações do processo:"
pm2 show partiu-ensaio 2>/dev/null || echo "⚠️  Não foi possível obter informações"

# Mostrar últimas linhas dos logs
echo ""
echo "📋 Últimas linhas dos logs:"
pm2 logs partiu-ensaio --lines 10 --nostream 2>/dev/null || echo "⚠️  Logs não disponíveis ainda"

echo ""
echo "✅ Concluído!"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: pm2 logs partiu-ensaio"
echo "   Ver status: pm2 status"
echo "   Reiniciar: pm2 restart partiu-ensaio"
echo "   Parar: pm2 stop partiu-ensaio"
