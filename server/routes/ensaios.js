/**
 * Rotas para endpoints de ensaios (plural)
 * Endpoint específico para integração com n8n + WhatsApp
 */

const express = require('express');
const { getDb } = require('../database-mysql');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Normaliza telefone gerando duas versões: com e sem DDI 55
 * 
 * @param {string} telefone - Telefone em qualquer formato
 * @returns {Object} - { comDDI: "55XXXXXXXXXXX", semDDI: "XXXXXXXXXXX" }
 * 
 * Exemplos:
 * - "(11) 97460-5594" → { comDDI: "5511974605594", semDDI: "11974605594" }
 * - "11974605594" → { comDDI: "5511974605594", semDDI: "11974605594" }
 * - "5511974605594" → { comDDI: "5511974605594", semDDI: "11974605594" }
 */
function normalizarTelefone(telefone) {
  if (!telefone || typeof telefone !== 'string') {
    return null;
  }

  // Remove todos os caracteres não numéricos
  let numeros = telefone.replace(/\D/g, '');

  // Se começar com 55, extrair sem DDI
  if (numeros.startsWith('55')) {
    const semDDI = numeros.substring(2);
    return {
      comDDI: numeros,
      semDDI: semDDI
    };
  }

  // Se começar com 0, remover o 0
  if (numeros.startsWith('0')) {
    numeros = numeros.substring(1);
  }

  // Gerar versão com DDI 55
  const comDDI = '55' + numeros;

  return {
    comDDI: comDDI,
    semDDI: numeros
  };
}

/**
 * GET /api/ensaios/por-telefone/:telefone
 * 
 * Endpoint para integração com n8n + WhatsApp que identifica
 * se um músico possui ensaio no dia atual, baseado no telefone.
 * 
 * Regras:
 * - Busca ensaios com status = 'aprovado'
 * - Busca ensaios com proxima_data = CURDATE() (hoje)
 * - Considera apenas ensaios ativos (não finalizados, em confirmação)
 * - Relaciona músico através de interesses_ensaios
 * - Normaliza telefone em duas versões (com e sem DDI 55)
 * 
 * Resposta:
 * - Se encontrar: { ensaio_id, titulo, horario }
 * - Se não encontrar: 404 (não objeto vazio, conforme requisito)
 * 
 * Funciona em ambiente local e produção:
 * - LOCAL: http://localhost:5000/api/ensaios/por-telefone/{telefone}
 * - PRODUÇÃO: https://partiuensaio.automatizeonline.com.br/api/ensaios/por-telefone/{telefone}
 */
router.get('/por-telefone/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[API ensaios/por-telefone] Telefone recebido:', telefone);
    }

    // 1. Normalizar telefone (gerar duas versões: com e sem DDI 55)
    const telefonesNormalizados = normalizarTelefone(telefone);

    if (!telefonesNormalizados) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[API ensaios/por-telefone] Telefone inválido');
      }
      return res.status(404).json({ message: 'Nenhum ensaio encontrado para hoje' });
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[API ensaios/por-telefone] Telefones normalizados:', telefonesNormalizados);
    }

    // 2. Obter conexão com banco de dados
    const db = getDb();

    // 3. Query para buscar ensaio do dia atual
    // Relaciona: interesses_ensaios → users → ensaios
    // Filtra: status = 'aprovado', DATE(proxima_data) = CURDATE() ou DATE(data_ensaio) = CURDATE()
    // IMPORTANTE: Usar DATE() para garantir comparação correta entre DATE e DATETIME
    // Considera apenas ensaios ativos (não finalizados, em confirmação)
    // Busca telefone em duas versões (com e sem DDI 55)
    const query = `
      SELECT
        e.id AS ensaio_id,
        e.nome_igreja AS titulo,
        TIME_FORMAT(e.horario, '%H:%i') AS horario
      FROM interesses_ensaios ie
      JOIN users u ON u.id = ie.musico_id
      JOIN ensaios e ON e.id = ie.ensaio_id
      WHERE
        e.status = 'aprovado'
        AND (
          DATE(e.proxima_data) = CURDATE()
          OR DATE(ie.data_ensaio) = CURDATE()
        )
        AND (
          REPLACE(REPLACE(REPLACE(REPLACE(u.celular, ' ', ''), '-', ''), '(', ''), ')', '') = ?
          OR REPLACE(REPLACE(REPLACE(REPLACE(u.celular, ' ', ''), '-', ''), '(', ''), ')', '') = ?
        )
      LIMIT 1
    `;

    // 4. Executar query com ambas as versões do telefone
    db.get(
      query,
      [telefonesNormalizados.comDDI, telefonesNormalizados.semDDI],
      (err, row) => {
        if (err) {
          logger.error('[API ensaios/por-telefone] Erro ao buscar ensaio:', err);
          return res.status(404).json({ message: 'Nenhum ensaio encontrado para hoje' });
        }

        if (!row) {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('[API ensaios/por-telefone] Nenhum ensaio encontrado para hoje');
          }
          return res.status(404).json({ message: 'Nenhum ensaio encontrado para hoje' });
        }

        if (process.env.NODE_ENV === 'development') {
          logger.info('[API ensaios/por-telefone] Ensaio encontrado:', row);
        }

        // 5. Retornar ensaio encontrado (apenas campos necessários)
        res.status(200).json({
          ensaio_id: row.ensaio_id,
          titulo: row.titulo,
          horario: row.horario
        });
      }
    );
  } catch (error) {
    logger.error('[API ensaios/por-telefone] Erro:', error);
    return res.status(404).json({ message: 'Nenhum ensaio encontrado para hoje' });
  }
});

/**
 * GET /api/ensaios/pendentes-confirmacao
 * 
 * Endpoint para integração com n8n que retorna músicos pendentes de confirmação
 * que ainda não receberam reenvio automático.
 * 
 * Regras:
 * - Busca apenas ensaios do dia atual (CURDATE)
 * - status do ensaio = 'aprovado'
 * - Músico possui interesse registrado (interesses_ensaios)
 * - NÃO existe presença confirmada ou ausente_justificado
 * - NÃO foi reenviado ainda (reenviado_whatsapp = 0)
 * - Dentro da janela de confirmação (horário permitido)
 * - Duração padrão: 2 horas, tolerância: 60 minutos
 * 
 * Resposta:
 * Array de objetos:
 * [
 *   {
 *     "ensaio_id": number,
 *     "musico_id": number,
 *     "telefone": string,
 *     "nome": string,
 *     "titulo": string,
 *     "horario": string
 *   }
 * ]
 * 
 * Uso:
 * - n8n consome via CRON (ex: a cada 10 minutos)
 * - Após enviar mensagem, marcar reenviado_whatsapp = 1
 * - Nunca reenviar mais de uma vez por músico
 */
router.get('/pendentes-confirmacao', async (req, res) => {
  try {
    const db = getDb();

    // Constantes de validação de horário
    const TOLERANCIA_MINUTOS = 60; // 1 hora após o término
    const DURACAO_ENSINO_HORAS = 2; // Duração padrão do ensaio

    // Query para buscar músicos pendentes de confirmação
    // Critérios:
    // 1. Ensaio do dia atual
    // 2. Status aprovado
    // 3. Músico tem interesse registrado
    // 4. NÃO tem presença confirmada/ausente
    // 5. NÃO foi reenviado ainda
    // 6. Dentro da janela de confirmação (horário permitido)
    // 
    // IMPORTANTE: Para compatibilidade com DISTINCT + ORDER BY no MySQL,
    // todas as colunas do ORDER BY devem estar no SELECT.
    const query = `
      SELECT DISTINCT
        e.id AS ensaio_id,
        u.id AS musico_id,
        u.celular AS telefone,
        u.name AS nome,
        e.nome_igreja AS titulo,
        e.horario AS horario_raw,
        TIME_FORMAT(e.horario, '%H:%i') AS horario,
        TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario) AS inicio_ensaio,
        DATE_ADD(
          DATE_ADD(
            TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario),
            INTERVAL ? HOUR
          ),
          INTERVAL ? MINUTE
        ) AS limite_confirmacao
      FROM interesses_ensaios ie
      JOIN users u ON u.id = ie.musico_id
      JOIN ensaios e ON e.id = ie.ensaio_id
      LEFT JOIN presencas_ensaios p ON 
        p.ensaio_id = e.id 
        AND p.musico_id = u.id 
        AND DATE(p.data_ensaio) = CURDATE()
      WHERE
        e.status = 'aprovado'
        AND (
          DATE(e.proxima_data) = CURDATE()
          OR DATE(ie.data_ensaio) = CURDATE()
        )
        AND u.role = 'musico'
        AND u.aprovado = 1
        AND u.celular IS NOT NULL
        AND u.celular != ''
        AND p.id IS NULL
        AND (ie.reenviado_whatsapp IS NULL OR ie.reenviado_whatsapp = 0)
        AND NOW() >= TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario)
        AND NOW() <= DATE_ADD(
          DATE_ADD(
            TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario),
            INTERVAL ? HOUR
          ),
          INTERVAL ? MINUTE
        )
      ORDER BY e.horario ASC, u.name ASC
    `;

    db.all(
      query,
      [DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS, DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS],
      (err, rows) => {
        if (err) {
          logger.error('[API ensaios/pendentes-confirmacao] Erro ao buscar pendentes:', err);
          logger.error('[API ensaios/pendentes-confirmacao] Detalhes do erro:', err.message, err.sql);
          return res.status(500).json({ error: 'Erro ao buscar músicos pendentes' });
        }

        // Validar se rows existe e é um array
        if (!Array.isArray(rows)) {
          logger.warn('[API ensaios/pendentes-confirmacao] Resposta do banco não é array:', typeof rows);
          return res.status(200).json([]);
        }

        if (process.env.NODE_ENV === 'development') {
          logger.info('[API ensaios/pendentes-confirmacao] Músicos pendentes encontrados:', rows.length);
        }

        // Formatar resposta (incluir musico_id para facilitar marcação de reenvio)
        // Garantir que todos os campos existam antes de mapear
        const resultado = rows
          .filter(row => row && row.ensaio_id && row.musico_id) // Filtrar linhas inválidas
          .map(row => ({
            ensaio_id: parseInt(row.ensaio_id) || 0,
            musico_id: parseInt(row.musico_id) || 0,
            telefone: row.telefone || '',
            nome: row.nome || '',
            titulo: row.titulo || '',
            horario: row.horario || ''
          }));

        res.status(200).json(resultado);
      }
    );
  } catch (error) {
    logger.error('[API ensaios/pendentes-confirmacao] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ensaios/marcar-reenvio
 * 
 * Endpoint para marcar que o reenvio foi enviado para um músico.
 * Deve ser chamado pelo n8n após enviar a mensagem de reenvio.
 * 
 * Payload esperado:
 * {
 *   "ensaio_id": number,
 *   "musico_id": number
 * }
 * 
 * Regras:
 * - Localizar interesse pelo ensaio_id e musico_id
 * - Marcar reenviado_whatsapp = 1
 * - Registrar timestamp do reenvio (via updated_at automático)
 * - Idempotente: se já estiver marcado, retornar 200 sem alterar
 * 
 * Respostas:
 * - 200: Reenvio marcado com sucesso (ou já estava marcado)
 * - 400: Payload inválido
 * - 404: Interesse não encontrado
 */
router.post('/marcar-reenvio', async (req, res) => {
  try {
    const { ensaio_id, musico_id } = req.body;

    // Validar payload
    if (!ensaio_id || !musico_id) {
      logger.warn('[API ensaios/marcar-reenvio] Payload inválido:', req.body);
      return res.status(400).json({ 
        error: 'Payload inválido. Campos obrigatórios: ensaio_id, musico_id' 
      });
    }

    const db = getDb();

    // Verificar se interesse existe e se já foi reenviado
    const verificarInteresseQuery = `
      SELECT id, reenviado_whatsapp
      FROM interesses_ensaios
      WHERE
        ensaio_id = ?
        AND musico_id = ?
        AND DATE(data_ensaio) = CURDATE()
      LIMIT 1
    `;

    db.get(verificarInteresseQuery, [ensaio_id, musico_id], (err, interesse) => {
      if (err) {
        logger.error('[API ensaios/marcar-reenvio] Erro ao verificar interesse:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (!interesse) {
        logger.warn('[API ensaios/marcar-reenvio] Interesse não encontrado:', {
          ensaio_id: ensaio_id,
          musico_id: musico_id
        });
        return res.status(404).json({ error: 'Interesse não encontrado' });
      }

      // Se já foi reenviado, retornar sucesso (idempotência)
      if (interesse.reenviado_whatsapp === 1) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('[API ensaios/marcar-reenvio] Reenvio já estava marcado:', {
            interesse_id: interesse.id,
            ensaio_id: ensaio_id,
            musico_id: musico_id
          });
        }
        return res.status(200).json({
          message: 'Reenvio já estava marcado',
          ensaio_id: ensaio_id,
          musico_id: musico_id
        });
      }

      // Marcar reenvio
      const marcarReenvioQuery = `
        UPDATE interesses_ensaios
        SET reenviado_whatsapp = 1,
            updated_at = NOW()
        WHERE id = ?
      `;

      db.run(marcarReenvioQuery, [interesse.id], function(err) {
        if (err) {
          logger.error('[API ensaios/marcar-reenvio] Erro ao marcar reenvio:', err);
          return res.status(500).json({ error: 'Erro ao marcar reenvio' });
        }

        if (process.env.NODE_ENV === 'development') {
          logger.info('[API ensaios/marcar-reenvio] Reenvio marcado com sucesso:', {
            interesse_id: interesse.id,
            ensaio_id: ensaio_id,
            musico_id: musico_id,
            linhas_afetadas: this.changes
          });
        }

        res.status(200).json({
          message: 'Reenvio marcado com sucesso',
          ensaio_id: ensaio_id,
          musico_id: musico_id
        });
      });
    });
  } catch (error) {
    logger.error('[API ensaios/marcar-reenvio] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ensaios/relatorio-presenca/:ensaio_id
 * 
 * Endpoint para gerar relatório consolidado de presença de um ensaio.
 * Retorna dados agregados para envio ao encarregado.
 * 
 * Regras:
 * - Validar se o ensaio existe
 * - Não permitir acesso a ensaios futuros
 * - Calcular totais: confirmados, ausentes, não responderam
 * - Usar apenas dados do próprio ensaio
 * 
 * Resposta:
 * {
 *   "ensaio_id": number,
 *   "titulo": string,
 *   "horario": string,
 *   "total_musicos": number,
 *   "confirmados": number,
 *   "ausentes_justificados": number,
 *   "nao_responderam": number,
 *   "data_fechamento": datetime
 * }
 * 
 * Respostas HTTP:
 * - 200: Relatório gerado com sucesso
 * - 404: Ensaio não encontrado
 * - 400: Ensaio ainda não finalizado
 */
router.get('/relatorio-presenca/:ensaio_id', async (req, res) => {
  try {
    const { ensaio_id } = req.params;
    const db = getDb();

    // Constantes de validação de horário
    const TOLERANCIA_MINUTOS = 60; // 1 hora após o término
    const DURACAO_ENSINO_HORAS = 2; // Duração padrão do ensaio

    // 1. Validar se o ensaio existe e já passou da janela de confirmação
    const validarEnsaioQuery = `
      SELECT 
        e.id,
        e.nome_igreja AS titulo,
        TIME_FORMAT(e.horario, '%H:%i') AS horario,
        e.proxima_data,
        DATE_ADD(
          DATE_ADD(
            TIMESTAMP(e.proxima_data, e.horario),
            INTERVAL ? HOUR
          ),
          INTERVAL ? MINUTE
        ) AS limite_confirmacao
      FROM ensaios e
      WHERE e.id = ?
        AND e.status = 'aprovado'
    `;

    db.get(
      validarEnsaioQuery,
      [DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS, ensaio_id],
      (err, ensaio) => {
        if (err) {
          logger.error('[API ensaios/relatorio-presenca] Erro ao buscar ensaio:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (!ensaio) {
          logger.warn('[API ensaios/relatorio-presenca] Ensaio não encontrado:', ensaio_id);
          return res.status(404).json({ error: 'Ensaio não encontrado' });
        }

        // Validar se já passou da janela de confirmação
        const limiteConfirmacao = new Date(ensaio.limite_confirmacao);
        const agora = new Date();

        if (agora < limiteConfirmacao) {
          logger.warn('[API ensaios/relatorio-presenca] Ensaio ainda não finalizado:', {
            ensaio_id: ensaio_id,
            limite_confirmacao: ensaio.limite_confirmacao
          });
          return res.status(400).json({ 
            error: 'Ensaio ainda não finalizado. Relatório disponível após o encerramento da janela de confirmação.' 
          });
        }

        // 2. Calcular totais de presença
        // IMPORTANTE: Usar data_ensaio do interesse para garantir correspondência correta
        const relatorioQuery = `
          SELECT 
            COUNT(DISTINCT ie.musico_id) AS total_musicos,
            SUM(CASE WHEN p.status = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
            SUM(CASE WHEN p.status = 'ausente_justificado' THEN 1 ELSE 0 END) AS ausentes_justificados,
            SUM(CASE WHEN p.id IS NULL THEN 1 ELSE 0 END) AS nao_responderam
          FROM interesses_ensaios ie
          LEFT JOIN presencas_ensaios p ON 
            p.ensaio_id = ie.ensaio_id 
            AND p.musico_id = ie.musico_id 
            AND DATE(p.data_ensaio) = DATE(ie.data_ensaio)
          WHERE ie.ensaio_id = ?
            AND DATE(ie.data_ensaio) = DATE(?)
        `;

        db.get(
          relatorioQuery,
          [ensaio_id, ensaio.proxima_data],
          (err, totais) => {
            if (err) {
              logger.error('[API ensaios/relatorio-presenca] Erro ao calcular totais:', err);
              return res.status(500).json({ error: 'Erro ao gerar relatório' });
            }

            // 3. Montar resposta consolidada
            const relatorio = {
              ensaio_id: parseInt(ensaio_id),
              titulo: ensaio.titulo,
              horario: ensaio.horario,
              total_musicos: totais.total_musicos || 0,
              confirmados: totais.confirmados || 0,
              ausentes_justificados: totais.ausentes_justificados || 0,
              nao_responderam: totais.nao_responderam || 0,
              data_fechamento: ensaio.limite_confirmacao
            };

            if (process.env.NODE_ENV === 'development') {
              logger.info('[API ensaios/relatorio-presenca] Relatório gerado:', relatorio);
            }

            res.status(200).json(relatorio);
          }
        );
      }
    );
  } catch (error) {
    logger.error('[API ensaios/relatorio-presenca] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ensaios/finalizados-hoje
 * 
 * Endpoint auxiliar para listar ensaios que já passaram da janela de confirmação
 * e ainda não tiveram relatório enviado.
 * 
 * Regras:
 * - Buscar apenas ensaios do dia atual (CURDATE)
 * - Status = 'aprovado'
 * - Já passaram da janela de confirmação
 * - relatorio_enviado = 0 ou NULL
 * 
 * Resposta:
 * Array de objetos:
 * [
 *   {
 *     "ensaio_id": number,
 *     "titulo": string,
 *     "horario": string,
 *     "limite_confirmacao": datetime
 *   }
 * ]
 * 
 * Uso:
 * - n8n consome via CRON para identificar ensaios que precisam de relatório
 * - Após enviar relatório, marcar relatorio_enviado = 1
 */
router.get('/finalizados-hoje', async (req, res) => {
  try {
    const db = getDb();

    // Constantes de validação de horário
    const TOLERANCIA_MINUTOS = 60; // 1 hora após o término
    const DURACAO_ENSINO_HORAS = 2; // Duração padrão do ensaio

    // Query para buscar ensaios finalizados hoje que ainda não tiveram relatório enviado
    const query = `
      SELECT 
        e.id AS ensaio_id,
        e.nome_igreja AS titulo,
        TIME_FORMAT(e.horario, '%H:%i') AS horario,
        DATE_ADD(
          DATE_ADD(
            TIMESTAMP(e.proxima_data, e.horario),
            INTERVAL ? HOUR
          ),
          INTERVAL ? MINUTE
        ) AS limite_confirmacao
      FROM ensaios e
      WHERE e.status = 'aprovado'
        AND DATE(e.proxima_data) = CURDATE()
        AND (e.relatorio_enviado IS NULL OR e.relatorio_enviado = 0)
        AND NOW() > DATE_ADD(
          DATE_ADD(
            TIMESTAMP(e.proxima_data, e.horario),
            INTERVAL ? HOUR
          ),
          INTERVAL ? MINUTE
        )
      ORDER BY e.horario ASC
    `;

    db.all(
      query,
      [DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS, DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS],
      (err, rows) => {
        if (err) {
          logger.error('[API ensaios/finalizados-hoje] Erro ao buscar ensaios:', err);
          return res.status(500).json({ error: 'Erro ao buscar ensaios finalizados' });
        }

        if (process.env.NODE_ENV === 'development') {
          logger.info('[API ensaios/finalizados-hoje] Ensaios finalizados encontrados:', rows.length);
        }

        res.status(200).json(rows);
      }
    );
  } catch (error) {
    logger.error('[API ensaios/finalizados-hoje] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ensaios/marcar-relatorio-enviado
 * 
 * Endpoint para marcar que o relatório foi enviado ao encarregado.
 * Deve ser chamado pelo n8n após enviar o relatório.
 * 
 * Payload esperado:
 * {
 *   "ensaio_id": number
 * }
 * 
 * Regras:
 * - Validar se o ensaio existe
 * - Marcar relatorio_enviado = 1
 * - Registrar timestamp do envio (via updated_at)
 * - Idempotente: se já estiver marcado, retornar 200 sem alterar
 * 
 * Respostas:
 * - 200: Relatório marcado como enviado (ou já estava marcado)
 * - 400: Payload inválido
 * - 404: Ensaio não encontrado
 */
router.post('/marcar-relatorio-enviado', async (req, res) => {
  try {
    const { ensaio_id } = req.body;

    // Validar payload
    if (!ensaio_id) {
      logger.warn('[API ensaios/marcar-relatorio-enviado] Payload inválido:', req.body);
      return res.status(400).json({ 
        error: 'Payload inválido. Campo obrigatório: ensaio_id' 
      });
    }

    const db = getDb();

    // Verificar se ensaio existe
    db.get('SELECT id, relatorio_enviado FROM ensaios WHERE id = ?', [ensaio_id], (err, ensaio) => {
      if (err) {
        logger.error('[API ensaios/marcar-relatorio-enviado] Erro ao buscar ensaio:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (!ensaio) {
        logger.warn('[API ensaios/marcar-relatorio-enviado] Ensaio não encontrado:', ensaio_id);
        return res.status(404).json({ error: 'Ensaio não encontrado' });
      }

      // Se já foi marcado, retornar sucesso (idempotência)
      if (ensaio.relatorio_enviado === 1) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('[API ensaios/marcar-relatorio-enviado] Relatório já estava marcado:', ensaio_id);
        }
        return res.status(200).json({
          message: 'Relatório já estava marcado como enviado',
          ensaio_id: parseInt(ensaio_id)
        });
      }

      // Marcar como enviado (updated_at será atualizado automaticamente)
      db.run(
        'UPDATE ensaios SET relatorio_enviado = 1, updated_at = NOW() WHERE id = ?',
        [ensaio_id],
        function(err) {
          if (err) {
            logger.error('[API ensaios/marcar-relatorio-enviado] Erro ao marcar relatório:', err);
            return res.status(500).json({ error: 'Erro ao marcar relatório como enviado' });
          }

          if (process.env.NODE_ENV === 'development') {
            logger.info('[API ensaios/marcar-relatorio-enviado] Relatório marcado como enviado:', {
              ensaio_id: ensaio_id,
              linhas_afetadas: this.changes
            });
          }

          res.status(200).json({
            message: 'Relatório marcado como enviado com sucesso',
            ensaio_id: parseInt(ensaio_id)
          });
        }
      );
    });
  } catch (error) {
    logger.error('[API ensaios/marcar-relatorio-enviado] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
