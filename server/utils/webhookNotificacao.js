const axios = require('axios');
const { getDb } = require('../database');

const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

// Função para verificar e enviar notificações de ensaios do dia
async function verificarEEnviarNotificacoes() {
  const db = getDb();
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log(`\n=== VERIFICANDO ENSAIOS DO DIA: ${hojeStr} ===`);
  
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
        console.error('Erro ao buscar ensaios do dia:', err);
        return;
      }

      if (ensaios.length === 0) {
        console.log('Nenhum ensaio com interesses não notificados encontrado para hoje');
        return;
      }

      console.log(`Encontrados ${ensaios.length} ensaio(s) com interesses para notificar`);

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
  
  console.log(`\n📅 Processando ensaio ID ${ensaio.id} - ${ensaio.nome_igreja}`);

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
        console.error(`Erro ao buscar músicos interessados no ensaio ${ensaio.id}:`, err);
        return;
      }

      if (musicos.length === 0) {
        console.log(`Nenhum músico interessado encontrado para o ensaio ${ensaio.id}`);
        return;
      }

      console.log(`Encontrados ${musicos.length} músico(s) interessado(s)`);

      // Preparar dados para o webhook
      const webhookData = {
        tipo: 'notificacao_ensaio',
        ensaio: {
          id: ensaio.id,
          nome_igreja: ensaio.nome_igreja,
          endereco: ensaio.endereco,
          cidade: ensaio.cidade,
          estado: ensaio.estado,
          horario: ensaio.horario,
          data: dataEnsaio,
          nome_encarregado: ensaio.nome_encarregado,
          celular: ensaio.celular,
          tipo: ensaio.tipo,
          instrumento: ensaio.instrumento,
          categoria_instrumento: ensaio.categoria_instrumento
        },
        musicos_interessados: musicos.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          instrumento: m.instrumento,
          categoria_instrumento: m.categoria_instrumento,
          celular: m.celular,
          cidade: m.cidade,
          estado: m.estado
        })),
        total_musicos: musicos.length,
        data_notificacao: new Date().toISOString()
      };

      // Enviar webhook
      try {
        console.log('Enviando webhook de notificação...');
        const response = await axios.post(WEBHOOK_URL, webhookData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });
        
        console.log('✅ Webhook enviado com sucesso via POST!');
        console.log('Status:', response.status);
        
        // Marcar como enviado
        db.run(
          'UPDATE interesses_ensaios SET webhook_enviado = 1 WHERE ensaio_id = ? AND data_ensaio = ?',
          [ensaio.id, dataEnsaio],
          (err) => {
            if (err) {
              console.error('Erro ao marcar webhook como enviado:', err);
            } else {
              console.log(`✅ Interesses marcados como notificados para o ensaio ${ensaio.id}`);
            }
          }
        );
      } catch (webhookError) {
        console.error('❌ ERRO ao enviar webhook via POST:', webhookError.message);
        
        // Tentar GET como fallback
        if (webhookError.response?.status === 404 && 
            webhookError.response?.data?.message?.includes('GET')) {
          console.log('⚠️ Tentando GET como fallback...');
          
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
            
            console.log('✅ Webhook enviado com sucesso via GET!');
            
            // Marcar como enviado
            db.run(
              'UPDATE interesses_ensaios SET webhook_enviado = 1 WHERE ensaio_id = ? AND data_ensaio = ?',
              [ensaio.id, dataEnsaio],
              (err) => {
                if (err) {
                  console.error('Erro ao marcar webhook como enviado:', err);
                } else {
                  console.log(`✅ Interesses marcados como notificados para o ensaio ${ensaio.id}`);
                }
              }
            );
          } catch (getError) {
            console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
          }
        }
      }
    }
  );
}

// Iniciar verificação periódica (a cada hora)
function iniciarVerificacaoPeriodica() {
  // Verificar imediatamente ao iniciar
  verificarEEnviarNotificacoes();
  
  // Verificar a cada hora
  setInterval(() => {
    verificarEEnviarNotificacoes();
  }, 60 * 60 * 1000); // 1 hora em milissegundos
  
  console.log('✅ Sistema de notificações de ensaios iniciado (verificação a cada 1 hora)');
}

module.exports = {
  verificarEEnviarNotificacoes,
  iniciarVerificacaoPeriodica
};
