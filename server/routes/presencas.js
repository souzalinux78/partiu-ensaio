/**
 * Rotas para confirmação de presença em ensaios via WhatsApp
 * Integração com n8n para automação de confirmação de presença
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
 * POST /api/presencas/confirmar-whatsapp
 * 
 * Endpoint para confirmação de presença via WhatsApp (n8n).
 * 
 * Payload esperado:
 * {
 *   "phone": string,
 *   "ensaio_id": number,
 *   "resposta": "1" | "2"
 * }
 * 
 * Regras:
 * - Localizar músico pelo telefone
 * - Validar se músico pertence ao ensaio (via interesses_ensaios)
 * - Validar se ensaio é do dia atual
 * - Não permitir confirmação duplicada (idempotência)
 * - resposta "1" = CONFIRMADO
 * - resposta "2" = AUSENTE JUSTIFICADO
 * - Registrar origem = "whatsapp"
 * 
 * Respostas:
 * - 200: Confirmação processada ou já existente
 * - 400: Payload inválido
 * - 404: Músico ou ensaio não encontrado
 * - 409: Tentativa de confirmação fora das regras
 */
router.post('/confirmar-whatsapp', async (req, res) => {
  try {
    const { phone, ensaio_id, resposta } = req.body;

    // 1. Validar payload
    if (!phone || !ensaio_id || !resposta) {
      logger.warn('[API presencas/confirmar-whatsapp] Payload inválido:', req.body);
      return res.status(400).json({ 
        error: 'Payload inválido. Campos obrigatórios: phone, ensaio_id, resposta' 
      });
    }

    if (resposta !== '1' && resposta !== '2') {
      logger.warn('[API presencas/confirmar-whatsapp] Resposta inválida:', resposta);
      return res.status(400).json({ 
        error: 'Resposta inválida. Use "1" para confirmado ou "2" para ausente justificado' 
      });
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[API presencas/confirmar-whatsapp] Payload recebido:', { phone, ensaio_id, resposta });
    }

    // 2. Normalizar telefone
    const telefonesNormalizados = normalizarTelefone(phone);
    if (!telefonesNormalizados) {
      logger.warn('[API presencas/confirmar-whatsapp] Telefone inválido:', phone);
      return res.status(400).json({ error: 'Telefone inválido' });
    }

    const db = getDb();

    // 3. Buscar músico pelo telefone
    const buscarMusicoQuery = `
      SELECT id, name, email
      FROM users
      WHERE 
        role = 'musico'
        AND aprovado = 1
        AND (
          REPLACE(REPLACE(REPLACE(REPLACE(celular, ' ', ''), '-', ''), '(', ''), ')', '') = ?
          OR REPLACE(REPLACE(REPLACE(REPLACE(celular, ' ', ''), '-', ''), '(', ''), ')', '') = ?
        )
      LIMIT 1
    `;

    db.get(
      buscarMusicoQuery,
      [telefonesNormalizados.comDDI, telefonesNormalizados.semDDI],
      async (err, musico) => {
        if (err) {
          logger.error('[API presencas/confirmar-whatsapp] Erro ao buscar músico:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        if (!musico) {
          logger.warn('[API presencas/confirmar-whatsapp] Músico não encontrado:', phone);
          return res.status(404).json({ error: 'Músico não encontrado' });
        }

        if (process.env.NODE_ENV === 'development') {
          logger.debug('[API presencas/confirmar-whatsapp] Músico encontrado:', musico.id);
        }

        // 4. Validar se o ensaio existe e é do dia atual
        // IMPORTANTE: 
        // - Não buscar ensaio pelo telefone (já foi validado no GET)
        // - Usar apenas ensaio_id recebido
        // - Usar DATE() para garantir comparação correta entre DATE e DATETIME
        // - Validar tanto proxima_data do ensaio quanto data_ensaio do interesse
        //   (consistente com GET /api/ensaios/por-telefone)
        // - Buscar também horario para validação de bloqueio por horário
        const validarEnsaioQuery = `
          SELECT 
            e.id,
            e.proxima_data,
            e.horario,
            e.status,
            e.nome_igreja,
            COALESCE(ie.data_ensaio, e.proxima_data) AS data_valida
          FROM ensaios e
          LEFT JOIN interesses_ensaios ie ON ie.ensaio_id = e.id AND ie.musico_id = ? AND DATE(ie.data_ensaio) = CURDATE()
          WHERE 
            e.id = ?
            AND e.status = 'aprovado'
            AND (
              DATE(e.proxima_data) = CURDATE()
              OR DATE(ie.data_ensaio) = CURDATE()
            )
        `;

        db.get(validarEnsaioQuery, [musico.id, ensaio_id], (err, ensaio) => {
          if (err) {
            logger.error('[API presencas/confirmar-whatsapp] Erro ao validar ensaio:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }

          if (!ensaio) {
            logger.warn('[API presencas/confirmar-whatsapp] Ensaio não encontrado ou inválido:', {
              ensaio_id: ensaio_id,
              musico_id: musico.id
            });
            return res.status(404).json({ error: 'Ensaio não encontrado ou não é válido para hoje' });
          }

          // 5. Validar se o músico pertence ao ensaio (via interesses_ensaios)
          // IMPORTANTE: Usar DATE() para garantir comparação correta
          const validarVinculoQuery = `
            SELECT id, data_ensaio
            FROM interesses_ensaios
            WHERE 
              ensaio_id = ?
              AND musico_id = ?
              AND DATE(data_ensaio) = CURDATE()
            LIMIT 1
          `;

          db.get(validarVinculoQuery, [ensaio_id, musico.id], (err, vinculo) => {
            if (err) {
              logger.error('[API presencas/confirmar-whatsapp] Erro ao validar vínculo:', err);
              return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (!vinculo) {
              logger.warn('[API presencas/confirmar-whatsapp] Músico não possui vínculo com o ensaio:', {
                musico_id: musico.id,
                ensaio_id: ensaio_id
              });
              return res.status(409).json({ 
                error: 'Músico não possui interesse registrado neste ensaio para hoje' 
              });
            }

            // 6. Verificar se já existe presença registrada (idempotência)
            // IMPORTANTE: Usar DATE() para garantir comparação correta
            const verificarPresencaQuery = `
              SELECT id, status, origem
              FROM presencas_ensaios
              WHERE 
                ensaio_id = ?
                AND musico_id = ?
                AND DATE(data_ensaio) = CURDATE()
              LIMIT 1
            `;

            db.get(verificarPresencaQuery, [ensaio_id, musico.id], (err, presencaExistente) => {
              if (err) {
                logger.error('[API presencas/confirmar-whatsapp] Erro ao verificar presença:', err);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }

              // Se já existe presença, retornar sucesso (idempotência)
              // IMPORTANTE: Não aplicar bloqueio por horário se presença já existe
              if (presencaExistente) {
                if (process.env.NODE_ENV === 'development') {
                  logger.info('[API presencas/confirmar-whatsapp] Presença já registrada:', presencaExistente.id);
                }
                return res.status(200).json({ 
                  message: 'Presença já registrada',
                  presenca_id: presencaExistente.id,
                  status: presencaExistente.status
                });
              }

              // 7. Validar bloqueio por horário
              // Regras:
              // - Confirmação só pode ocorrer a partir do horário de início do ensaio
              // - Até no máximo 60 minutos após o término do ensaio (tolerância)
              // - Duração padrão do ensaio: 2 horas
              // - Usar DATETIME para comparações corretas (nunca comparar strings)
              const TOLERANCIA_MINUTOS = 60; // 1 hora após o término
              const DURACAO_ENSINO_HORAS = 2; // Duração padrão do ensaio
              
              const validarHorarioQuery = `
                SELECT 
                  TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario) AS inicio_ensaio,
                  DATE_ADD(
                    TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario),
                    INTERVAL ? HOUR
                  ) AS fim_ensaio,
                  DATE_ADD(
                    DATE_ADD(
                      TIMESTAMP(COALESCE(ie.data_ensaio, e.proxima_data), e.horario),
                      INTERVAL ? HOUR
                    ),
                    INTERVAL ? MINUTE
                  ) AS limite_confirmacao,
                  NOW() AS agora_servidor
                FROM ensaios e
                LEFT JOIN interesses_ensaios ie ON ie.ensaio_id = e.id AND ie.musico_id = ? AND DATE(ie.data_ensaio) = CURDATE()
                WHERE e.id = ?
              `;

              db.get(
                validarHorarioQuery,
                [DURACAO_ENSINO_HORAS, DURACAO_ENSINO_HORAS, TOLERANCIA_MINUTOS, musico.id, ensaio_id],
                (err, horarioData) => {
                  if (err) {
                    logger.error('[API presencas/confirmar-whatsapp] Erro ao validar horário:', err);
                    return res.status(500).json({ error: 'Erro interno do servidor' });
                  }

                  if (!horarioData) {
                    logger.warn('[API presencas/confirmar-whatsapp] Dados de horário não encontrados:', ensaio_id);
                    return res.status(500).json({ error: 'Erro ao validar horário do ensaio' });
                  }

                  // Validar se está dentro da janela permitida usando comparação direta de DATETIME
                  // inicio_ensaio <= NOW() <= limite_confirmacao
                  // Usar comparação direta com DATETIME do MySQL (nunca comparar strings)
                  const inicioEnsaio = new Date(horarioData.inicio_ensaio);
                  const limiteConfirmacao = new Date(horarioData.limite_confirmacao);
                  const agora = new Date(horarioData.agora_servidor);

                  if (agora < inicioEnsaio || agora > limiteConfirmacao) {
                    logger.warn('[API presencas/confirmar-whatsapp] Confirmação fora do horário permitido:', {
                      telefone: phone,
                      ensaio_id: ensaio_id,
                      inicio_ensaio: horarioData.inicio_ensaio,
                      limite_confirmacao: horarioData.limite_confirmacao,
                      agora_servidor: horarioData.agora_servidor,
                      motivo: 'fora_do_horario'
                    });
                    return res.status(409).json({ 
                      error: 'Confirmação fora do horário permitido',
                      detalhes: {
                        inicio_permitido: horarioData.inicio_ensaio,
                        limite_permitido: horarioData.limite_confirmacao,
                        horario_atual: horarioData.agora_servidor
                      }
                    });
                  }

                  // 8. Registrar presença (dentro da janela permitida)
                  const statusPresenca = resposta === '1' ? 'confirmado' : 'ausente_justificado';
                  
                  const inserirPresencaQuery = `
                    INSERT INTO presencas_ensaios (
                      ensaio_id,
                      musico_id,
                      data_ensaio,
                      status,
                      origem
                    ) VALUES (?, ?, CURDATE(), ?, 'whatsapp')
                  `;

                  db.run(
                    inserirPresencaQuery,
                    [ensaio_id, musico.id, statusPresenca],
                    function(err) {
                      if (err) {
                        // Se erro for de chave duplicada, retornar sucesso (idempotência)
                        if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate')) {
                          logger.info('[API presencas/confirmar-whatsapp] Presença duplicada (race condition):', err.message);
                          return res.status(200).json({ 
                            message: 'Presença já registrada',
                            status: statusPresenca
                          });
                        }

                        logger.error('[API presencas/confirmar-whatsapp] Erro ao registrar presença:', err);
                        return res.status(500).json({ error: 'Erro ao registrar presença' });
                      }

                      if (process.env.NODE_ENV === 'development') {
                        logger.info('[API presencas/confirmar-whatsapp] Presença registrada com sucesso:', {
                          presenca_id: this.lastID,
                          musico_id: musico.id,
                          ensaio_id: ensaio_id,
                          status: statusPresenca,
                          horario_confirmacao: horarioData.agora_servidor
                        });
                      }

                      // 9. Retornar sucesso
                      res.status(200).json({
                        message: 'Presença registrada com sucesso',
                        presenca_id: this.lastID,
                        musico_id: musico.id,
                        ensaio_id: ensaio_id,
                        status: statusPresenca,
                        origem: 'whatsapp'
                      });
                    }
                  );
                }
              );
            });
          });
        });
      }
    );
  } catch (error) {
    logger.error('[API presencas/confirmar-whatsapp] Erro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
