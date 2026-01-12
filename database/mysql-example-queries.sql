-- =====================================================
-- QUERIES DE EXEMPLO - PARTIU ENSAIO
-- =====================================================
-- Este arquivo contém exemplos de queries úteis para o banco MySQL

USE partiu_ensaio;

-- =====================================================
-- CONSULTAS DE USUÁRIOS
-- =====================================================

-- Listar todos os usuários
SELECT id, email, name, role, aprovado, created_at 
FROM users 
ORDER BY created_at DESC;

-- Usuários pendentes de aprovação
SELECT id, email, name, role, created_at 
FROM users 
WHERE aprovado = 0 
ORDER BY created_at DESC;

-- Músicos aprovados
SELECT id, email, name, instrumento, categoria_instrumento, cidade, estado 
FROM users 
WHERE role = 'musico' AND aprovado = 1 
ORDER BY name;

-- Encarregados aprovados
SELECT id, email, name, cidade, estado 
FROM users 
WHERE role = 'encarregado' AND aprovado = 1 
ORDER BY name;

-- =====================================================
-- CONSULTAS DE ENSAIOS
-- =====================================================

-- Todos os ensaios com informações do encarregado
SELECT 
    e.id,
    e.nome_igreja,
    e.endereco,
    e.cidade,
    e.estado,
    e.horario,
    e.proxima_data,
    e.status,
    u.name as encarregado_name,
    u.email as encarregado_email
FROM ensaios e
JOIN users u ON e.user_id = u.id
ORDER BY e.proxima_data ASC, e.created_at DESC;

-- Ensaios aprovados (públicos)
SELECT 
    e.*,
    u.name as encarregado_name
FROM ensaios e
JOIN users u ON e.user_id = u.id
WHERE e.status = 'aprovado'
    AND (e.proxima_data IS NULL OR e.proxima_data >= CURDATE())
ORDER BY e.proxima_data ASC;

-- Ensaios pendentes de aprovação
SELECT 
    e.*,
    u.name as encarregado_name,
    u.email as encarregado_email
FROM ensaios e
JOIN users u ON e.user_id = u.id
WHERE e.status = 'pendente'
ORDER BY e.created_at DESC;

-- Estatísticas por cidade
SELECT 
    cidade,
    COUNT(*) as total_ensaios,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados
FROM ensaios
WHERE cidade IS NOT NULL
GROUP BY cidade
ORDER BY total_ensaios DESC;

-- Estatísticas por estado
SELECT 
    estado,
    COUNT(*) as total_ensaios,
    COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados
FROM ensaios
WHERE estado IS NOT NULL
GROUP BY estado
ORDER BY total_ensaios DESC;

-- Ensaios por tipo
SELECT 
    tipo,
    COUNT(*) as total
FROM ensaios
WHERE status = 'aprovado'
GROUP BY tipo;

-- =====================================================
-- CONSULTAS DE INTERESSES
-- =====================================================

-- Músicos interessados em um ensaio específico
SELECT 
    ie.id,
    ie.data_ensaio,
    ie.webhook_enviado,
    u.name as musico_name,
    u.email as musico_email,
    u.instrumento,
    u.celular
FROM interesses_ensaios ie
JOIN users u ON ie.musico_id = u.id
WHERE ie.ensaio_id = 1  -- Substitua pelo ID do ensaio
ORDER BY ie.created_at DESC;

-- Ensaios com mais interesses
SELECT 
    e.id,
    e.nome_igreja,
    e.proxima_data,
    COUNT(ie.id) as total_interesses
FROM ensaios e
LEFT JOIN interesses_ensaios ie ON e.id = ie.ensaio_id
WHERE e.status = 'aprovado'
GROUP BY e.id
ORDER BY total_interesses DESC
LIMIT 10;

-- Interesses não notificados (webhook não enviado)
SELECT 
    ie.*,
    e.nome_igreja,
    e.proxima_data,
    u.name as musico_name,
    u.email as musico_email
FROM interesses_ensaios ie
JOIN ensaios e ON ie.ensaio_id = e.id
JOIN users u ON ie.musico_id = u.id
WHERE ie.webhook_enviado = 0
    AND e.proxima_data = CURDATE()
ORDER BY ie.created_at ASC;

-- =====================================================
-- ESTATÍSTICAS GERAIS
-- =====================================================

-- Dashboard de estatísticas
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'musico' AND aprovado = 1) as total_musicos,
    (SELECT COUNT(*) FROM users WHERE role = 'encarregado' AND aprovado = 1) as total_encarregados,
    (SELECT COUNT(*) FROM ensaios WHERE status = 'aprovado') as total_ensaios_aprovados,
    (SELECT COUNT(*) FROM ensaios WHERE status = 'pendente') as total_ensaios_pendentes,
    (SELECT COUNT(*) FROM interesses_ensaios) as total_interesses;

-- Instrumentos mais usados
SELECT 
    instrumento,
    categoria_instrumento,
    COUNT(*) as total
FROM users
WHERE instrumento IS NOT NULL
    AND role = 'musico'
    AND aprovado = 1
GROUP BY instrumento, categoria_instrumento
ORDER BY total DESC;

-- Instrumentos por categoria (naipes)
SELECT 
    categoria_instrumento,
    COUNT(*) as total
FROM users
WHERE categoria_instrumento IS NOT NULL
    AND role = 'musico'
    AND aprovado = 1
GROUP BY categoria_instrumento
ORDER BY total DESC;

-- =====================================================
-- MANUTENÇÃO
-- =====================================================

-- Limpar interesses antigos (mais de 30 dias)
DELETE FROM interesses_ensaios 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    AND webhook_enviado = 1;

-- Atualizar próxima_data de ensaios recorrentes
-- (Execute periodicamente via cron job)
UPDATE ensaios 
SET proxima_data = DATE_ADD(proxima_data, INTERVAL 1 MONTH)
WHERE dia_semana IS NOT NULL 
    AND semana_mes IS NOT NULL
    AND proxima_data < CURDATE();

-- Backup de dados importantes
-- Exportar usuários
SELECT * FROM users INTO OUTFILE '/tmp/users_backup.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Exportar ensaios
SELECT * FROM ensaios INTO OUTFILE '/tmp/ensaios_backup.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n';
