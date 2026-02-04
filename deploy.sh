#!/bin/bash

echo "=============================================="
echo "🚀 DEPLOY AUTOMÁTICO - PARTIU ENSAIO"
echo "=============================================="
echo

# === CONFIG FIXA ===
PROJECT_DIR="/var/www/partiu-ensaio"
BACKUP_DIR="/var/backups/partiu-ensaio"
PM2_APP_NAME="partiu-ensaio"

# === PERGUNTAS ===
read -p "🔖 Informe a TAG ou commit para deploy (ex: v1.4.0): " RELEASE_TAG
read -p "❓ Deseja rodar build do FRONTEND? (s/n): " BUILD_FRONT
read -p "❓ Confirmar DEPLOY em PRODUÇÃO? (s/n): " CONFIRM

if [[ "$CONFIRM" != "s" ]]; then
  echo "❌ Deploy cancelado."
  exit 1
fi

echo
echo "📦 Iniciando backup..."

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/backup_$(date +%F_%H-%M).tar.gz"
tar -czf "$BACKUP_FILE" "$PROJECT_DIR"

echo "✅ Backup criado em: $BACKUP_FILE"
echo

# === DEPLOY ===
cd "$PROJECT_DIR" || exit 1

echo "🔄 Limpando alterações locais..."
git reset --hard
git clean -fd

echo "📥 Atualizando repositório..."
git fetch --all --tags

echo "🏷️ Aplicando release: $RELEASE_TAG"
git reset --hard "$RELEASE_TAG"

echo
echo "📦 Instalando dependências BACKEND..."
npm install --production

if [[ -d "server" ]]; then
  cd server
  npm install --production
  cd ..
fi

# === FRONTEND ===
if [[ "$BUILD_FRONT" == "s" ]]; then
  if [[ -d "client" ]]; then
    echo
    echo "🎨 Buildando FRONTEND..."
    cd client || exit 1
    npm install
    npm run build
    cd ..
  else
    echo "⚠️ Pasta client não encontrada, pulando build."
  fi
fi

# === RESTART ===
echo
echo "🔄 Reiniciando aplicação no PM2..."
pm2 restart "$PM2_APP_NAME"

echo
echo "=============================================="
echo "✅ DEPLOY FINALIZADO COM SUCESSO"
echo "=============================================="
echo
echo "👉 Release aplicado: $RELEASE_TAG"
echo "👉 Backup disponível: $BACKUP_FILE"
echo