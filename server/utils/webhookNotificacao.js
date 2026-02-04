const axios = require('axios');
const { getDb } = require('../database-mysql');
const logger = require('./logger');

const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

// Função auxiliar para obter hora/minuto de São Paulo (mesma lógica do pushScheduler)
function getSaoPauloParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: process.env.APP_TIMEZONE || 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  return { hour, minute };
}

// Função para verificar e enviar notificações de ensaios do dia às 10:00
async function verificarEEnviarNotificacoes() {
  const db = getDb();
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
  
  logger.info(`Verificando ensaios do dia: ${hojeStr}`);
  
  // Buscar ensaios que ocorrem hoje
  db.all(
    `SELECT DISTINCT e.*, i.data_ensaio
     FROM ensaios e
     INNER JOIN interesses_ensaios i ON e.id = i.ensaio_id
     WHERE i.data_ensaio = ? 
     AND e.status = 'aprovado'
     AND i.webhook_enviado = 0`,
    [hojeStr],
    async (err, ensaios) => {
      if (err) {
        logger.error('Erro ao buscar ensaios do dia:', err);
        return;
      }

      if (ensaios.length === 0) {
        logger.debug('Nenhum ensaio com interesses não notificados encontrado para hoje');
        return;
      }

      logger.info(`Encontrados ${ensaios.length} ensaio(s) com interesses para notificar`);

      // Processar cada ensaio
      for (const ensaio of ensaios) {
        await processarEnsaio(ensaio, hojeStr);
      }
    }
  );
}

// Processar um ensaio e enviar webhook com músicos interessados
async function processarEnsaio(ensaio, dataEnsaio) {
  const db = getDb();
  
  logger.info(`Processando ensaio ID ${ensaio.id} - ${ensaio.nome_igreja}`);

  // Buscar todos os músicos interessados neste ensaio nesta data
  db.all(
    `SELECT u.id, u.name, u.email, u.instrumento, u.categoria_instrumento, u.celular, u.cidade, u.estado
     FROM interesses_ensaios i
     JOIN users u ON i.musico_id = u.id
     WHERE i.ensaio_id = ? 
     AND i.data_ensaio = ?
     AND i.webhook_enviado = 0`,
    [ensaio.id, dataEnsaio],
    async (err, musicos) => {
      if (err) {
        logger.error(`Erro ao buscar músicos interessados no ensaio ${ensaio.id}:`, err);
        return;
      }

      if (musicos.length === 0) {
        logger.debug(`Nenhum músico interessado encontrado para o ensaio ${ensaio.id}`);
        return;
      }

      logger.info(`Encontrados ${musicos.length} músico(s) interessado(s)`);

      // Formatar horário para exibição
      const horarioFormatado = ensaio.horario || '20:00';
      const horarioDisplay = horarioFormatado.length === 5 ? horarioFormatado : horarioFormatado.substring(0, 5);
      
      // Preparar mensagem amigável e clara
      const mensagemLembrete = `🎵 Lembrete: Hoje tem ensaio às ${horarioDisplay}! 🎵\n\n` +
        `📍 ${ensaio.nome_igreja || ensaio.local || 'Ensaio'}\n` +
        (ensaio.endereco ? `📍 ${ensaio.endereco}\n` : '') +
        (ensaio.cidade || ensaio.estado ? `📍 ${[ensaio.cidade, ensaio.estado].filter(Boolean).join(', ')}\n` : '') +
        (ensaio.nome_encarregado ? `👤 Encarregado: ${ensaio.nome_encarregado}\n` : '') +
        (ensaio.celular ? `📱 Contato: ${ensaio.celular}\n` : '') +
        `\n✨ Nos vemos lá! ✨`;

      // Preparar dados para o webhook
      const webhookData = {
        tipo: 'lembrete_ensaio',
        mensagem: mensagemLembrete,
        ensaio: {
          id: ensaio.id,
          nome_igreja: ensaio.nome_igreja || ensaio.local || 'Ensaio',
          endereco: ensaio.endereco || null,
          cidade: ensaio.cidade || null,
          estado: ensaio.estado || null,
          horario: horarioDisplay,
          data: dataEnsaio,
          nome_encarregado: ensaio.nome_encarregado || null,
          celular: ensaio.celular || null,
          tipo: ensaio.tipo || null
        },
        musicos_interessados: musicos.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          instrumento: m.instrumento || null,
          categoria_instrumento: m.categoria_instrumento || null,
          celular: m.celular || null,
          cidade: m.cidade || null,
          estado: m.estado || null
        })),
        total_musicos: musicos.length,
        data_notificacao: new Date().toISOString(),
        hora_notificacao: '10:00'
      };

      // Enviar webhook
      try {
        logger.info('Enviando webhook de notificação...');
        const response = await axios.post(WEBHOOK_URL, webhookData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        
        logger.info(`Webhook enviado com sucesso via POST! Status: ${response.status}`);
        
        // Marcar como enviado
        db.run(
          'UPDATE interesses_ensaios SET webhook_enviado = 1 WHERE ensaio_id = ? AND data_ensaio = ?',
          [ensaio.id, dataEnsaio],
          (err) => {
            if (err) {
              logger.error('Erro ao marcar webhook como enviado:', err);
            } else {
              logger.info(`Interesses marcados como notificados para o ensaio ${ensaio.id}`);
            }
          }
        );
      } catch (webhookError) {
        logger.error('ERRO ao enviar webhook via POST:', webhookError);
        
        // Tentar GET como fallback
        if (webhookError.response?.status === 404 && 
            webhookError.response?.data?.message?.includes('GET')) {
          logger.warn('Tentando GET como fallback...');
          
          try {
            const params = new URLSearchParams();
            Object.keys(webhookData).forEach(key => {
              if (webhookData[key] !== null && webhookData[key] !== undefined) {
                params.append(key, typeof webhookData[key] === 'object' 
                  ? JSON.stringify(webhookData[key]) 
                  : String(webhookData[key]));
              }
            });
            
            const getUrl = `${WEBHOOK_URL}?${params.toString()}`;
            const getResponse = await axios.get(getUrl, { timeout: 15000 });
            
            logger.info('Webhook enviado com sucesso via GET!');
            
            // Marcar como enviado
            db.run(
              'UPDATE interesses_ensaios SET webhook_enviado = 1 WHERE ensaio_id = ? AND data_ensaio = ?',
              [ensaio.id, dataEnsaio],
              (err) => {
                if (err) {
                  logger.error('Erro ao marcar webhook como enviado:', err);
                } else {
                  logger.info(`Interesses marcados como notificados para o ensaio ${ensaio.id}`);
                }
              }
            );
          } catch (getError) {
            logger.error('ERRO ao enviar webhook via GET:', getError);
          }
        }
      }
    }
  );
}

// Iniciar verificação periódica (a cada 15 minutos, disparo às 10:00)
function iniciarVerificacaoPeriodica() {
  logger.info('✅ Sistema de lembretes de ensaios iniciado (verificação a cada 15 minutos, disparo às 10:00)');

  const tick = async () => {
    const { hour, minute } = getSaoPauloParts();
    // Verificar às 10:00 (janela de 15 minutos: entre 10:00 e 10:15)
    // Isso garante que mesmo se o processo atrasar, ainda enviará o lembrete
    if (hour === 10 && minute >= 0 && minute < 15) {
      const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      logger.info(`⏰ ${now} - Verificando lembretes de ensaios...`);
      await verificarEEnviarNotificacoes();
    }
  };

  // Verificar imediatamente se já são 10:00
  tick();
  
  // Verificar a cada 15 minutos
  setInterval(tick, 15 * 60 * 1000); // 15 minutos em milissegundos
}

module.exports = {
  verificarEEnviarNotificacoes,
  iniciarVerificacaoPeriodica
};
