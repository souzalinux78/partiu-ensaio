/**
 * Rotas para endpoints de Dashboard Web
 * Endpoints específicos para visualização de dados consolidados
 */

const express = require('express');
const { getDb } = require('../database-mysql');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/dashboard/resumo
 * 
 * Endpoint para retornar dados consolidados gerais do dashboard.
 * 
 * Retorna:
 * {
 *   "ensaios_hoje": number,
 *   "ensaios_semana": number,
 *   "taxa_media_presenca": number
 * }
 * 
 * Regras:
 * - ensaios_hoje: ensaios do dia atual (CURDATE) com status aprovado
 * - ensaios_semana: ensaios dos últimos 7 dias com status aprovado
 * - taxa_media_presenca: média de presença dos últimos 30 dias
 */
router.get('/resumo', async (req, res) => {
  try {
    const db = getDb();

    // Constantes
    const TOLERANCIA_MINUTOS = 60; // 1 hora após o término
    const DURACAO_ENSINO_HORAS = 2; // Duração padrão do ensaio
    const DIAS_FREQUENCIA = 30; // Período para cálculo de frequência

    // Query para buscar resumo consolidado
    const query = `
      SELECT 
        (SELECT COUNT(DISTINCT e.id)
         FROM ensaios e
         WHERE e.status = 'aprovado'
           AND DATE(e.proxima_data) = CURDATE()) AS ensaios_hoje,
        
        (SELECT COUNT(DISTINCT e.id)
         FROM ensaios e
         WHERE e.status = 'aprovado'
           AND DATE(e.proxima_data) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
           AND DATE(e.proxima_data) <= CURDATE()) AS ensaios_semana,
        
        (SELECT 
           COALESCE(
             AVG(
               CASE 
                 WHEN total_musicos > 0 THEN (confirmados * 100.0 / total_musicos)
                 ELSE 0
               END
             ),
             0
           )
         FROM (
           SELECT 
             e.id,
             COUNT(DISTINCT ie.musico_id) AS total_musicos,
             COUNT(DISTINCT CASE WHEN p.status = 'confirmado' THEN p.musico_id END) AS confirmados
           FROM ensaios e
           JOIN interesses_ensaios ie ON ie.ensaio_id = e.id
           LEFT JOIN presencas_ensaios p ON 
             p.ensaio_id = ie.ensaio_id 
             AND p.musico_id = ie.musico_id 
             AND DATE(p.data_ensaio) = DATE(ie.data_ensaio)
           WHERE e.status = 'aprovado'
             AND DATE(ie.data_ensaio) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
             AND DATE(ie.data_ensaio) < CURDATE()
             AND NOW() > DATE_ADD(
               DATE_ADD(
                 TIMESTAMP(ie.data_ensaio, e.horario),
                 INTERVAL ? HOUR
               ),
               INTERVAL ? MINUTE
             )
           GROUP BY e.id, DATE(ie.data_ensaio)
         ) AS stats) AS taxa_media_presenca
    `;

    db.get(
      query,
      [DIAS_FREQUENCIA, DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS],
      (err, row) => {
        if (err) {
          logger.error('[API dashboard/resumo] Erro ao buscar resumo:', err);
          return res.status(500).json({ error: 'Erro ao buscar resumo do dashboard' });
        }

        const resumo = {
          ensaios_hoje: row.ensaios_hoje || 0,
          ensaios_semana: row.ensaios_semana || 0,
          taxa_media_presenca: parseFloat((row.taxa_media_presenca || 0).toFixed(2))
        };

        if (process.env.NODE_ENV === 'development') {
          logger.info('[API dashboard/resumo] Resumo gerado:', resumo);
        }

        res.status(200).json(resumo);
      }
    );
  } catch (error) {
    logger.error('[API dashboard/resumo] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/dashboard/ensaios
 * 
 * Endpoint para retornar lista de ensaios com estatísticas de presença.
 * 
 * Retorna:
 * [
 *   {
 *     "ensaio_id": number,
 *     "titulo": string,
 *     "data": date,
 *     "horario": string,
 *     "total_musicos": number,
 *     "confirmados": number,
 *     "ausentes": number,
 *     "nao_responderam": number
 *   }
 * ]
 * 
 * Regras:
 * - Buscar ensaios dos últimos 30 dias
 * - Apenas ensaios aprovados
 * - Calcular estatísticas de presença
 */
router.get('/ensaios', async (req, res) => {
  try {
    const db = getDb();

    // Constantes
    const TOLERANCIA_MINUTOS = 60; // 1 hora após o término
    const DURACAO_ENSINO_HORAS = 2; // Duração padrão do ensaio
    const DIAS_BUSCA = 30; // Período de busca

    // Query para buscar ensaios com estatísticas
    const query = `
      SELECT 
        e.id AS ensaio_id,
        e.nome_igreja AS titulo,
        DATE(ie.data_ensaio) AS data,
        TIME_FORMAT(e.horario, '%H:%i') AS horario,
        COUNT(DISTINCT ie.musico_id) AS total_musicos,
        SUM(CASE WHEN p.status = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
        SUM(CASE WHEN p.status = 'ausente_justificado' THEN 1 ELSE 0 END) AS ausentes,
        SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) AS nao_responderam
      FROM ensaios e
      JOIN interesses_ensaios ie ON ie.ensaio_id = e.id
      LEFT JOIN presencas_ensaios p ON 
        p.ensaio_id = ie.ensaio_id 
        AND p.musico_id = ie.musico_id 
        AND DATE(p.data_ensaio) = DATE(ie.data_ensaio)
      WHERE e.status = 'aprovado'
        AND DATE(ie.data_ensaio) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND DATE(ie.data_ensaio) <= CURDATE()
      GROUP BY e.id, DATE(ie.data_ensaio)
      ORDER BY ie.data_ensaio DESC, e.horario DESC
    `;

    db.all(query, [DIAS_BUSCA], (err, rows) => {
      if (err) {
        logger.error('[API dashboard/ensaios] Erro ao buscar ensaios:', err);
        return res.status(500).json({ error: 'Erro ao buscar ensaios do dashboard' });
      }

      const ensaios = rows.map(row => ({
        ensaio_id: row.ensaio_id,
        titulo: row.titulo,
        data: row.data,
        horario: row.horario,
        total_musicos: row.total_musicos || 0,
        confirmados: row.confirmados || 0,
        ausentes: row.ausentes || 0,
        nao_responderam: row.nao_responderam || 0
      }));

      if (process.env.NODE_ENV === 'development') {
        logger.info('[API dashboard/ensaios] Ensaios encontrados:', ensaios.length);
      }

      res.status(200).json(ensaios);
    });
  } catch (error) {
    logger.error('[API dashboard/ensaios] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/dashboard/musicos
 * 
 * Endpoint para retornar lista de músicos com frequência e status.
 * 
 * Retorna:
 * [
 *   {
 *     "musico_id": number,
 *     "nome": string,
 *     "frequencia_percentual": number,
 *     "ultima_presenca": date,
 *     "status": "ok" | "atencao" | "risco"
 *   }
 * ]
 * 
 * Regras:
 * - Frequência baseada nos últimos 30 dias
 * - Status:
 *   - ok: frequência ≥ 80%
 *   - atencao: frequência ≥ 60% e < 80%
 *   - risco: frequência < 60%
 */
router.get('/musicos', async (req, res) => {
  try {
    const db = getDb();

    // Constantes
    const DIAS_FREQUENCIA = 30; // Período para cálculo de frequência
    const LIMITE_OK = 80; // Frequência mínima para status "ok"
    const LIMITE_ATENCAO = 60; // Frequência mínima para status "atencao"

    // Query para buscar músicos com frequência
    const query = `
      SELECT 
        u.id AS musico_id,
        u.name AS nome,
        COUNT(DISTINCT ie.id) AS total_ensaios,
        COUNT(DISTINCT CASE WHEN p.status = 'confirmado' THEN p.id END) AS presencas,
        MAX(DATE(p.data_ensaio)) AS ultima_presenca,
        CASE 
          WHEN COUNT(DISTINCT ie.id) > 0 THEN
            (COUNT(DISTINCT CASE WHEN p.status = 'confirmado' THEN p.id END) * 100.0 / COUNT(DISTINCT ie.id))
          ELSE 0
        END AS frequencia_percentual
      FROM users u
      JOIN interesses_ensaios ie ON ie.musico_id = u.id
      JOIN ensaios e ON e.id = ie.ensaio_id
      LEFT JOIN presencas_ensaios p ON 
        p.ensaio_id = ie.ensaio_id 
        AND p.musico_id = u.id 
        AND DATE(p.data_ensaio) = DATE(ie.data_ensaio)
        AND p.status = 'confirmado'
      WHERE u.role = 'musico'
        AND u.aprovado = 1
        AND e.status = 'aprovado'
        AND DATE(ie.data_ensaio) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND DATE(ie.data_ensaio) <= CURDATE()
      GROUP BY u.id, u.name
      HAVING COUNT(DISTINCT ie.id) > 0
      ORDER BY frequencia_percentual DESC, u.name ASC
    `;

    db.all(query, [DIAS_FREQUENCIA], (err, rows) => {
      if (err) {
        logger.error('[API dashboard/musicos] Erro ao buscar músicos:', err);
        return res.status(500).json({ error: 'Erro ao buscar músicos do dashboard' });
      }

      const musicos = rows.map(row => {
        const frequencia = parseFloat((row.frequencia_percentual || 0).toFixed(2));
        
        // Determinar status baseado na frequência
        let status = 'risco';
        if (frequencia >= LIMITE_OK) {
          status = 'ok';
        } else if (frequencia >= LIMITE_ATENCAO) {
          status = 'atencao';
        }

        return {
          musico_id: row.musico_id,
          nome: row.nome,
          frequencia_percentual: frequencia,
          ultima_presenca: row.ultima_presenca || null,
          status: status
        };
      });

      if (process.env.NODE_ENV === 'development') {
        logger.info('[API dashboard/musicos] Músicos encontrados:', musicos.length);
      }

      res.status(200).json(musicos);
    });
  } catch (error) {
    logger.error('[API dashboard/musicos] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
