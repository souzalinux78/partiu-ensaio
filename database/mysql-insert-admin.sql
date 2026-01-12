-- =====================================================
-- INSERIR/ATUALIZAR USUÁRIO ADMIN PADRÃO
-- =====================================================
-- Este script cria ou atualiza o usuário administrador padrão
-- Senha padrão: admin123
-- IMPORTANTE: Altere a senha após o primeiro login!

USE partiu_ensaio;

-- Hash bcrypt da senha "admin123"
-- Para gerar um novo hash, execute: node database/generate-admin-hash.js
-- Hash atual (admin123): $2a$10$4MmYvAPD8u7kaezFeXR8fuN6W2kF8Up7w/Ki.Rpw7zAH/3sAc.ihC
SET @admin_password = '$2a$10$4MmYvAPD8u7kaezFeXR8fuN6W2kF8Up7w/Ki.Rpw7zAH/3sAc.ihC';

-- Inserir ou atualizar admin
INSERT INTO users (email, password, name, role, aprovado) 
VALUES (
    'admin@partiuensaio.com',
    @admin_password,
    'Administrador',
    'admin',
    1
) ON DUPLICATE KEY UPDATE 
    password = @admin_password,
    name = 'Administrador',
    role = 'admin',
    aprovado = 1,
    updated_at = CURRENT_TIMESTAMP;

-- Verificar se foi criado
SELECT 
    id,
    email,
    name,
    role,
    aprovado,
    created_at
FROM users 
WHERE email = 'admin@partiuensaio.com';
