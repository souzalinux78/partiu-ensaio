#!/bin/bash
# Script para atualizar cores no servidor

echo "🔄 Atualizando cores no servidor..."
echo ""

cd /var/www/partiu-ensaio

echo "📥 [1/7] Fazendo pull das mudanças..."
git pull origin master

echo "🧹 [2/7] Limpando cache e node_modules..."
cd client
rm -rf node_modules build .cache
npm cache clean --force

echo "📦 [3/7] Reinstalando dependências..."
npm install

echo "🔧 [4/7] Atualizando versão do Service Worker..."
cd ..
# Atualizar versão do cache no service-worker.js
sed -i "s/CACHE_NAME = 'partiu-ensaio-v[0-9]*'/CACHE_NAME = 'partiu-ensaio-v6'/" client/public/service-worker.js
sed -i "s/RUNTIME_CACHE = 'partiu-ensaio-runtime-v[0-9]*'/RUNTIME_CACHE = 'partiu-ensaio-runtime-v6'/" client/public/service-worker.js

echo "🏗️  [5/7] Fazendo build..."
cd client
npm run build

echo "🔍 [6/7] Verificando se as cores foram incluídas no build..."
if grep -q "D4AF37" build/static/css/main.*.css 2>/dev/null; then
    echo "✅ Cores encontradas no build!"
else
    echo "⚠️  AVISO: Cores podem não estar no build. Verifique manualmente."
fi

echo "🔄 [7/7] Reiniciando PM2..."
cd ..
pm2 stop partiu-ensaio
pm2 flush
pm2 restart partiu-ensaio --update-env

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "   2. Desregistre o Service Worker:"
echo "      - Abra DevTools (F12)"
echo "      - Vá em Application → Service Workers"
echo "      - Clique em 'Unregister'"
echo "   3. Recarregue a página"
echo ""
echo "📊 Verificar logs: pm2 logs partiu-ensaio --lines 50"
