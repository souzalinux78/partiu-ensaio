#!/bin/bash

# Script para corrigir configuração Nginx para uploads
# Execute como: sudo bash corrigir-uploads-nginx.sh

echo "🔧 Corrigindo configuração Nginx para uploads..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar/criar diretório de uploads
UPLOADS_DIR="/var/www/partiu-ensaio/server/uploads"
echo -e "${YELLOW}📁 Verificando diretório de uploads...${NC}"

if [ ! -d "$UPLOADS_DIR" ]; then
    echo -e "${YELLOW}   Diretório não existe, criando...${NC}"
    mkdir -p "$UPLOADS_DIR"
    chmod 755 "$UPLOADS_DIR"
    chown www-data:www-data "$UPLOADS_DIR"
    echo -e "${GREEN}✅ Diretório criado${NC}"
else
    echo -e "${GREEN}✅ Diretório existe${NC}"
fi

# 2. Ajustar permissões
echo -e "${YELLOW}🔐 Ajustando permissões...${NC}"
chmod -R 755 "$UPLOADS_DIR"
chown -R www-data:www-data "$UPLOADS_DIR"
echo -e "${GREEN}✅ Permissões ajustadas${NC}"

# 3. Verificar configuração Nginx
NGINX_CONFIG="/etc/nginx/sites-available/partiu-ensaio"
if [ ! -f "$NGINX_CONFIG" ]; then
    NGINX_CONFIG="/etc/nginx/conf.d/partiu-ensaio.conf"
fi

if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${RED}❌ Arquivo de configuração Nginx não encontrado!${NC}"
    echo "   Procurando em:"
    echo "   - /etc/nginx/sites-available/partiu-ensaio"
    echo "   - /etc/nginx/conf.d/partiu-ensaio.conf"
    exit 1
fi

echo -e "${YELLOW}📝 Arquivo de configuração encontrado: $NGINX_CONFIG${NC}"

# 4. Verificar se já tem configuração de uploads
if grep -q "location /uploads" "$NGINX_CONFIG"; then
    echo -e "${YELLOW}⚠️  Configuração de uploads já existe${NC}"
    echo "   Verifique se está correta no arquivo: $NGINX_CONFIG"
else
    echo -e "${YELLOW}📝 Adicionando configuração de uploads...${NC}"
    # Adicionar antes do último }
    sed -i '/^}$/i\    # Uploads de imagens\n    location /uploads {\n        alias /var/www/partiu-ensaio/server/uploads;\n        \n        # Headers CORS para imagens\n        add_header Access-Control-Allow-Origin "*" always;\n        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;\n        add_header Access-Control-Allow-Headers "Content-Type" always;\n        \n        # Cache e Content-Type\n        add_header Cache-Control "public, max-age=86400" always;\n        expires 1d;\n        \n        # Content-Type correto para imagens\n        types {\n            image/jpeg jpg jpeg;\n            image/png png;\n            image/gif gif;\n            image/webp webp;\n        }\n        default_type image/jpeg;\n        \n        # Permitir acesso\n        autoindex off;\n    }' "$NGINX_CONFIG"
    echo -e "${GREEN}✅ Configuração adicionada${NC}"
fi

# 5. Testar configuração Nginx
echo -e "${YELLOW}🧪 Testando configuração Nginx...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Configuração válida${NC}"
    
    # 6. Recarregar Nginx
    echo -e "${YELLOW}🔄 Recarregando Nginx...${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx recarregado${NC}"
else
    echo -e "${RED}❌ Erro na configuração Nginx!${NC}"
    echo "   Corrija os erros antes de continuar"
    exit 1
fi

# 7. Verificar se há arquivos de upload
FILE_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
echo -e "${YELLOW}📊 Arquivos encontrados em uploads: $FILE_COUNT${NC}"

if [ "$FILE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}📋 Listando alguns arquivos:${NC}"
    ls -lh "$UPLOADS_DIR" | head -5
fi

echo ""
echo -e "${GREEN}✅ Correção concluída!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste uma imagem: curl -I https://partiuensaio.automatizeonline.com.br/uploads/nome-arquivo.jpg"
echo "   2. Verifique os logs: sudo tail -f /var/log/nginx/error.log"
echo "   3. Limpe o cache do navegador e teste novamente"
