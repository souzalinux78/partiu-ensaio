#!/bin/bash

# Script para verificar e corrigir configuração Nginx de uploads

echo "🔍 Verificando configuração Nginx..."

# Verificar configuração atual
echo ""
echo "📋 Configuração atual de /uploads:"
sudo nginx -T 2>/dev/null | grep -A 20 "location /uploads" || echo "❌ Bloco /uploads não encontrado!"

echo ""
echo "📋 Verificando ordem dos location blocks:"
sudo nginx -T 2>/dev/null | grep -E "^\s+location" | head -10

echo ""
echo "🧪 Testando caminho do alias:"
ALIAS_PATH=$(sudo nginx -T 2>/dev/null | grep -A 5 "location /uploads" | grep "alias" | awk '{print $2}' | tr -d ';')
if [ -n "$ALIAS_PATH" ]; then
    echo "   Alias configurado: $ALIAS_PATH"
    if [ -d "$ALIAS_PATH" ]; then
        echo "   ✅ Diretório existe"
        FILE_COUNT=$(find "$ALIAS_PATH" -type f | wc -l)
        echo "   📊 Arquivos encontrados: $FILE_COUNT"
    else
        echo "   ❌ Diretório NÃO existe!"
    fi
else
    echo "   ❌ Alias não encontrado na configuração!"
fi

echo ""
echo "🔍 Verificando se há conflitos com location /:"
LOCATION_SLASH=$(sudo nginx -T 2>/dev/null | grep -B 5 -A 10 "location / {" | head -15)
echo "$LOCATION_SLASH"

echo ""
echo "📝 Verificando arquivo de configuração:"
CONFIG_FILE=$(sudo nginx -T 2>/dev/null | head -1 | awk '{print $4}' | tr -d ';')
if [ -n "$CONFIG_FILE" ]; then
    echo "   Arquivo principal: $CONFIG_FILE"
    echo ""
    echo "   Conteúdo do bloco /uploads:"
    sudo grep -A 15 "location /uploads" "$CONFIG_FILE" 2>/dev/null || echo "   ❌ Não encontrado em $CONFIG_FILE"
fi
