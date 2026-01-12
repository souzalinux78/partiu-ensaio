#!/bin/bash

# Script de Backup - Partiu Ensaio
# Uso: ./backup.sh

BACKUP_DIR="/var/backups/partiu-ensaio"
APP_DIR="/var/www/partiu-ensaio"
DATE=$(date +%Y%m%d-%H%M%S)

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Fazer backup do banco de dados
if [ -f "$APP_DIR/server/database.sqlite" ]; then
    cp "$APP_DIR/server/database.sqlite" "$BACKUP_DIR/database-$DATE.sqlite"
    echo "✅ Backup do banco de dados criado: database-$DATE.sqlite"
else
    echo "⚠️  Banco de dados não encontrado em $APP_DIR/server/database.sqlite"
fi

# Fazer backup dos uploads
if [ -d "$APP_DIR/server/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$APP_DIR/server" uploads/
    echo "✅ Backup dos uploads criado: uploads-$DATE.tar.gz"
fi

# Remover backups antigos (manter apenas últimos 7 dias)
find $BACKUP_DIR -name "database-*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "uploads-*.tar.gz" -mtime +7 -delete

echo "✅ Backup concluído!"
echo "📁 Localização: $BACKUP_DIR"
