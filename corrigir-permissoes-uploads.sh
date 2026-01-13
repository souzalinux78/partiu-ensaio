#!/bin/bash

# Script para corrigir permissões dos uploads
# Execute como: sudo bash corrigir-permissoes-uploads.sh

echo "🔧 Corrigindo permissões dos uploads..."

UPLOADS_DIR="/var/www/partiu-ensaio/server/uploads"

# Verificar se o diretório existe
if [ ! -d "$UPLOADS_DIR" ]; then
    echo "❌ Diretório não existe: $UPLOADS_DIR"
    exit 1
fi

# Corrigir permissões do diretório
echo "📁 Ajustando permissões do diretório..."
chmod 755 "$UPLOADS_DIR"
chown www-data:www-data "$UPLOADS_DIR"

# Corrigir permissões de todos os arquivos dentro
echo "📄 Ajustando permissões dos arquivos..."
chmod 644 "$UPLOADS_DIR"/*
chown www-data:www-data "$UPLOADS_DIR"/*

# Verificar resultado
echo ""
echo "✅ Permissões ajustadas!"
echo ""
echo "📊 Verificando:"
ls -la "$UPLOADS_DIR" | head -5

# Testar se o Nginx consegue ler
echo ""
echo "🧪 Testando acesso do Nginx..."
sudo -u www-data test -r "$UPLOADS_DIR/ensaio-1768317258755-695073803.jpg" && echo "✅ Nginx pode ler o arquivo" || echo "❌ Nginx NÃO pode ler o arquivo"

echo ""
echo "🔄 Recarregando Nginx..."
systemctl reload nginx

echo ""
echo "✅ Concluído! Teste novamente:"
echo "   curl -I https://partiuensaio.automatizeonline.com.br/uploads/ensaio-1768317258755-695073803.jpg"
