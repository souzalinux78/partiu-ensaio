const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getDb } = require('../database-mysql');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Função auxiliar para calcular KPI de forma segura
 * Retorna 0 em caso de erro, nunca lança exceção
 */
function calcularKPI(query, params, nomeKPI) {
  return new Promise((resolve) => {
    try {
      const db = getDb();
      db.get(query, params || [], (err, result) => {
        if (err) {
          logger.error(`[KPIs] Erro ao calcular ${nomeKPI}:`, err);
          resolve(0);
        } else {
          const valor = result?.total || result?.valor || 0;
          resolve(typeof valor === 'number' ? valor : 0);
        }
      });
    } catch (error) {
      logger.error(`[KPIs] Exceção ao calcular ${nomeKPI}:`, error);
      resolve(0);
    }
  });
}

/**
 * Função auxiliar para calcular KPI com array de resultados
 */
function calcularKPIArray(query, params, nomeKPI) {
  return new Promise((resolve) => {
    try {
      const db = getDb();
      db.all(query, params || [], (err, result) => {
        if (err) {
          logger.error(`[KPIs] Erro ao calcular ${nomeKPI}:`, err);
          resolve([]);
        } else {
          resolve(Array.isArray(result) ? result : []);
        }
      });
    } catch (error) {
      logger.error(`[KPIs] Exceção ao calcular ${nomeKPI}:`, error);
      resolve([]);
    }
  });
}

/**
 * Função auxiliar para calcular KPI com múltiplos campos
 */
function calcularKPIMulti(query, params, nomeKPI) {
  return new Promise((resolve) => {
    try {
      const db = getDb();
      db.get(query, params || [], (err, result) => {
        if (err) {
          logger.error(`[KPIs] Erro ao calcular ${nomeKPI}:`, err);
          resolve(null);
        } else {
          resolve(result || null);
        }
      });
    } catch (error) {
      logger.error(`[KPIs] Exceção ao calcular ${nomeKPI}:`, error);
      resolve(null);
    }
  });
}

// Endpoint de KPIs administrativos
router.get('/kpis', authenticate, requireAdmin, async (req, res) => {
  try {
    // Inicializar valores padrão (sempre retornar algo, mesmo em caso de erro)
    const kpis = {
      totalEnsaiosMes: 0,
      totalMusicosInteressados: 0,
      ensaiosRealizados: 0,
      taxaComparecimento: 0,
      locaisMaisEnsaios: []
    };

    // KPI 1: Total de ensaios agendados no mês
    // Contar ensaios cadastrados no mês atual (status aprovado)
    // Usar YEAR e MONTH juntos (obrigatório)
    try {
      const query1 = `
        SELECT COUNT(*) as total 
        FROM ensaios
        WHERE status = 'aprovado'
          AND proxima_data IS NOT NULL
          AND YEAR(proxima_data) = YEAR(CURDATE())
          AND MONTH(proxima_data) = MONTH(CURDATE())
      `;
      kpis.totalEnsaiosMes = await calcularKPI(query1, [], 'Ensaios Agendados');
    } catch (error) {
      logger.error('[KPIs] Erro ao calcular Ensaios Agendados:', error);
      kpis.totalEnsaiosMes = 0;
    }

    // KPI 2: Total de músicos que receberão lembrete (elegíveis)
    // Músicos com interesse em ensaios do mês atual que ainda NÃO possuem presença
    // Usar YEAR e MONTH juntos (obrigatório)
    try {
      const query2 = `
        SELECT COUNT(DISTINCT ie.musico_id) as total 
        FROM interesses_ensaios ie
        JOIN ensaios e ON e.id = ie.ensaio_id
        LEFT JOIN presencas_ensaios p ON 
          p.ensaio_id = ie.ensaio_id 
          AND p.musico_id = ie.musico_id 
          AND DATE(p.data_ensaio) = DATE(ie.data_ensaio)
        WHERE e.status = 'aprovado'
          AND ie.data_ensaio IS NOT NULL
          AND YEAR(ie.data_ensaio) = YEAR(CURDATE())
          AND MONTH(ie.data_ensaio) = MONTH(CURDATE())
          AND p.id IS NULL
      `;
      kpis.totalMusicosInteressados = await calcularKPI(query2, [], 'Receberão Lembrete');
    } catch (error) {
      logger.error('[KPIs] Erro ao calcular Receberão Lembrete:', error);
      kpis.totalMusicosInteressados = 0;
    }

    // KPI 3: Ensaios realizados (com data_ensaio no passado)
    try {
      const hojeStr = new Date().toISOString().split('T')[0];
      const query3 = `
        SELECT COUNT(DISTINCT e.id) as total 
        FROM ensaios e
        INNER JOIN interesses_ensaios i ON e.id = i.ensaio_id
        WHERE e.status = 'aprovado' 
          AND i.data_ensaio IS NOT NULL
          AND DATE(i.data_ensaio) < ?
      `;
      kpis.ensaiosRealizados = await calcularKPI(query3, [hojeStr], 'Ensaios Realizados');
    } catch (error) {
      logger.error('[KPIs] Erro ao calcular Ensaios Realizados:', error);
      kpis.ensaiosRealizados = 0;
    }

    // KPI 4: Taxa de comparecimento
    try {
      const hojeStr = new Date().toISOString().split('T')[0];
      const query4 = `
        SELECT 
          COUNT(CASE WHEN i.data_ensaio IS NOT NULL AND DATE(i.data_ensaio) < ? THEN 1 END) as interesses_em_realizados,
          COUNT(*) as total_interesses
        FROM interesses_ensaios i
        INNER JOIN ensaios e ON i.ensaio_id = e.id
        WHERE e.status = 'aprovado'
      `;
      
      const result4 = await calcularKPIMulti(query4, [hojeStr], 'Taxa de Comparecimento');
      
      if (result4) {
        const interessesEmRealizados = result4.interesses_em_realizados || 0;
        const totalInteresses = result4.total_interesses || 0;
        kpis.taxaComparecimento = totalInteresses > 0 
          ? parseFloat(((interessesEmRealizados / totalInteresses) * 100).toFixed(1))
          : 0;
      } else {
        kpis.taxaComparecimento = 0;
      }
    } catch (error) {
      logger.error('[KPIs] Erro ao calcular Taxa de Comparecimento:', error);
      kpis.taxaComparecimento = 0;
    }

    // KPI 5: Locais com mais ensaios (top 5)
    try {
      const query5 = `
        SELECT 
          COALESCE(nome_igreja, 'Sem nome') as local,
          COUNT(*) as total
        FROM ensaios
        WHERE status = 'aprovado'
          AND nome_igreja IS NOT NULL
        GROUP BY COALESCE(nome_igreja, 'Sem nome')
        ORDER BY total DESC
        LIMIT 5
      `;
      kpis.locaisMaisEnsaios = await calcularKPIArray(query5, [], 'Locais Mais Ensaios');
    } catch (error) {
      logger.error('[KPIs] Erro ao calcular Locais Mais Ensaios:', error);
      kpis.locaisMaisEnsaios = [];
    }

    // SEMPRE retornar status 200, mesmo se algum KPI falhou
    res.status(200).json(kpis);

  } catch (error) {
    // Catch final para garantir que nunca retorne 500
    logger.error('[KPIs] Erro crítico na rota /api/admin/kpis:', error);
    
    // Retornar valores zerados com status 200
    res.status(200).json({
      totalEnsaiosMes: 0,
      totalMusicosInteressados: 0,
      ensaiosRealizados: 0,
      taxaComparecimento: 0,
      locaisMaisEnsaios: []
    });
  }
});

module.exports = router;
