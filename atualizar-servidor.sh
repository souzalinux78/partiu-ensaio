#!/bin/bash

# Script de Atualização do Servidor Partiu Ensaio
# Uso: ./atualizar-servidor.sh

set -e  # Parar em caso de erro

echo "🚀 =========================================="
echo "🚀 Atualização do Servidor Partiu Ensaio"
echo "🚀 =========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do projeto
PROJECT_DIR="/var/www/partiu-ensaio"

# Verificar se está no diretório correto
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Diretório do projeto não encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo -e "${YELLOW}📋 Verificando status atual...${NC}"
echo ""

# Verificar status do Git
echo -e "${YELLOW}📥 Status do Git:${NC}"
git status --short
echo ""

# Verificar processos PM2
echo -e "${YELLOW}📊 Processos PM2:${NC}"
pm2 list
echo ""

# Perguntar confirmação
read -p "Deseja continuar com a atualização? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Atualização cancelada.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔄 Iniciando atualização...${NC}"
echo ""

# 1. Fazer backup (opcional)
echo -e "${YELLOW}💾 Criando backup...${NC}"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
if [ -d "server/uploads" ]; then
    cp -r server/uploads "$BACKUP_DIR/uploads" 2>/dev/null || true
    echo -e "${GREEN}✅ Backup de uploads criado${NC}"
fi
echo ""

# 2. Descartar mudanças locais (se houver)
echo -e "${YELLOW}🧹 Limpando mudanças locais...${NC}"
git restore . 2>/dev/null || true
echo -e "${GREEN}✅ Mudanças locais descartadas${NC}"
echo ""

# 3. Buscar atualizações
echo -e "${YELLOW}📥 Buscando atualizações do GitHub...${NC}"
git fetch origin
echo ""

# 4. Mostrar diferenças
echo -e "${YELLOW}📊 Diferenças encontradas:${NC}"
git diff HEAD origin/master --stat || true
echo ""

# 5. Fazer pull
echo -e "${YELLOW}⬇️ Fazendo pull das atualizações...${NC}"
if git pull origin master; then
    echo -e "${GREEN}✅ Código atualizado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao fazer pull. Tentando reset hard...${NC}"
    read -p "Deseja forçar atualização (reset --hard)? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git reset --hard origin/master
        echo -e "${GREEN}✅ Reset hard concluído${NC}"
    else
        echo -e "${RED}❌ Atualização cancelada${NC}"
        exit 1
    fi
fi
echo ""

# 6. Instalar dependências do backend
echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
cd server
if npm install --production; then
    echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
else
    echo -e "${RED}❌ Erro ao instalar dependências do backend${NC}"
    exit 1
fi
cd ..
echo ""

# 7. Instalar dependências do frontend
echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
cd client
if npm install; then
    echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
else
    echo -e "${RED}❌ Erro ao instalar dependências do frontend${NC}"
    exit 1
fi
echo ""

# 8. Compilar frontend
echo -e "${YELLOW}🏗️ Compilando frontend...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Frontend compilado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao compilar frontend${NC}"
    exit 1
fi
cd ..
echo ""

# 9. Verificar .env
echo -e "${YELLOW}⚙️ Verificando variáveis de ambiente...${NC}"
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
else
    echo -e "${YELLOW}⚠️ Arquivo .env não encontrado. Verifique se está configurado.${NC}"
fi
echo ""

# 10. Reiniciar PM2
echo -e "${YELLOW}🔄 Reiniciando aplicação PM2...${NC}"
if pm2 restart partiu-ensaio --update-env; then
    echo -e "${GREEN}✅ Aplicação reiniciada${NC}"
else
    echo -e "${YELLOW}⚠️ Erro ao reiniciar. Tentando iniciar...${NC}"
    pm2 start ecosystem.config.js || pm2 start server/index.js --name partiu-ensaio
fi
echo ""

# 11. Salvar configuração PM2
echo -e "${YELLOW}💾 Salvando configuração PM2...${NC}"
pm2 save
echo -e "${GREEN}✅ Configuração salva${NC}"
echo ""

# 12. Verificar status
echo -e "${YELLOW}📊 Status da aplicação:${NC}"
pm2 status
echo ""

# 13. Mostrar últimos logs
echo -e "${YELLOW}📋 Últimos logs (20 linhas):${NC}"
pm2 logs partiu-ensaio --lines 20 --nostream
echo ""

# 14. Testar API
echo -e "${YELLOW}🧪 Testando API...${NC}"
if curl -s http://localhost:5000/api/ensaio/public > /dev/null; then
    echo -e "${GREEN}✅ API respondendo corretamente${NC}"
else
    echo -e "${RED}❌ API não está respondendo${NC}"
fi
echo ""

# 15. Verificar Nginx (se existir)
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}🌐 Verificando Nginx...${NC}"
    if nginx -t 2>/dev/null; then
        echo -e "${GREEN}✅ Configuração do Nginx está correta${NC}"
        systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
    else
        echo -e "${YELLOW}⚠️ Verifique a configuração do Nginx manualmente${NC}"
    fi
    echo ""
fi

# Resumo
echo "🚀 =========================================="
echo -e "${GREEN}✅ Atualização concluída com sucesso!${NC}"
echo "🚀 =========================================="
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique os logs: pm2 logs partiu-ensaio"
echo "   2. Teste o sistema no navegador"
echo "   3. Verifique se todas as funcionalidades estão funcionando"
echo ""
echo "📊 Comandos úteis:"
echo "   - Ver logs: pm2 logs partiu-ensaio"
echo "   - Ver status: pm2 status"
echo "   - Monitorar: pm2 monit"
echo ""
