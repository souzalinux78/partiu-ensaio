-- =====================================================
-- MIGRAÇÃO: Adicionar coluna 'tipo' na tabela users
-- =====================================================
-- Data: 2025-01-13
-- Descrição: Adiciona coluna 'tipo' para diferenciar encarregados locais e regionais
-- =====================================================

USE partiu_ensaio;

-- Verificar se a coluna já existe antes de adicionar
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'partiu_ensaio' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'tipo'
);

-- Adicionar coluna apenas se não existir
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN tipo ENUM(\'local\', \'regional\') NULL COMMENT \'Tipo de encarregado (local ou regional)\' AFTER aprovado',
  'SELECT "Coluna tipo já existe" AS resultado'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar resultado
SELECT 
  CASE 
    WHEN @col_exists = 0 THEN 'Coluna tipo adicionada com sucesso!'
    ELSE 'Coluna tipo já existe na tabela users'
  END AS status;
