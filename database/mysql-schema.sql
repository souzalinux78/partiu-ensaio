-- =====================================================
-- PARTIU ENSAIO - Estrutura Completa do Banco MySQL
-- =====================================================
-- Versão: 1.0
-- Data: 2024
-- =====================================================

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS partiu_ensaio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE partiu_ensaio;

-- =====================================================
-- TABELA: users (Usuários do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'encarregado', 'musico') NOT NULL DEFAULT 'encarregado',
    aprovado TINYINT(1) DEFAULT 1 COMMENT '0 = Pendente, 1 = Aprovado',
    instrumento VARCHAR(100) NULL COMMENT 'Instrumento do músico',
    categoria_instrumento VARCHAR(50) NULL COMMENT 'Categoria do instrumento (TECLAS, METAIS, MADEIRAS, CORDAS)',
    celular VARCHAR(20) NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL COMMENT 'Sigla do estado (ex: SP, RJ)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_aprovado (aprovado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: ensaios (Ensaios cadastrados)
-- =====================================================
CREATE TABLE IF NOT EXISTS ensaios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nome_encarregado VARCHAR(255) NOT NULL,
    tipo ENUM('local', 'regional') NOT NULL,
    celular VARCHAR(20) NOT NULL,
    dia_semana VARCHAR(50) NULL COMMENT 'Ex: segunda-feira, terça-feira, etc.',
    semana_mes INT NULL COMMENT '1-4 para semanas do mês, -1 para última semana',
    proxima_data DATE NULL COMMENT 'Próxima data calculada do ensaio',
    horario TIME NOT NULL COMMENT 'Horário do ensaio (formato 24h)',
    nome_igreja VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    cidade VARCHAR(100) NULL,
    estado VARCHAR(2) NULL COMMENT 'Sigla do estado (ex: SP, RJ)',
    instrumento VARCHAR(100) NULL COMMENT 'Instrumento do encarregado',
    categoria_instrumento VARCHAR(50) NULL COMMENT 'Categoria do instrumento',
    foto_local VARCHAR(500) NULL COMMENT 'Caminho da foto do local',
    status ENUM('pendente', 'aprovado', 'rejeitado', 'cancelado') NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_proxima_data (proxima_data),
    INDEX idx_cidade (cidade),
    INDEX idx_estado (estado),
    INDEX idx_dia_semana (dia_semana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: interesses_ensaios (Interesses de músicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS interesses_ensaios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ensaio_id INT NOT NULL,
    musico_id INT NOT NULL,
    data_ensaio DATE NOT NULL COMMENT 'Data específica da ocorrência do ensaio',
    webhook_enviado TINYINT(1) DEFAULT 0 COMMENT '0 = não enviado, 1 = enviado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ensaio_id) REFERENCES ensaios(id) ON DELETE CASCADE,
    FOREIGN KEY (musico_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_ensaio_musico_data (ensaio_id, musico_id, data_ensaio),
    INDEX idx_ensaio_id (ensaio_id),
    INDEX idx_musico_id (musico_id),
    INDEX idx_data_ensaio (data_ensaio),
    INDEX idx_webhook_enviado (webhook_enviado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERIR USUÁRIO ADMIN PADRÃO
-- =====================================================
-- Senha: admin123 (hash bcrypt)
-- IMPORTANTE: Altere a senha após o primeiro login!
INSERT INTO users (email, password, name, role, aprovado) 
VALUES (
    'admin@partiuensaio.com',
    '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq',
    'Administrador',
    'admin',
    1
) ON DUPLICATE KEY UPDATE email=email;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

-- Estrutura de Roles:
-- - admin: Administrador do sistema (acesso total)
-- - encarregado: Encarregado de orquestra (pode cadastrar ensaios)
-- - musico: Músico (pode ver ensaios e demonstrar interesse)

-- Status de Ensaios:
-- - pendente: Aguardando aprovação do admin
-- - aprovado: Aprovado e visível publicamente
-- - rejeitado: Rejeitado pelo admin
-- - cancelado: Cancelado pelo encarregado ou admin

-- Semana do Mês (semana_mes):
-- - 1: Primeira semana
-- - 2: Segunda semana
-- - 3: Terceira semana
-- - 4: Quarta semana
-- - -1: Última semana do mês

-- Categorias de Instrumentos:
-- - TECLAS: Acordeon, etc.
-- - METAIS: Trompete, Trombone, Tuba, etc.
-- - MADEIRAS: Flauta, Clarinete, Saxofone, etc.
-- - CORDAS: Violino, Viola, Violoncelo, etc.
