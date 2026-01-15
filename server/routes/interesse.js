const express = require('express');
const { getDb } = require('../database-mysql');
const { authenticate, requireEncarregado } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();
const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatUtcForIcs(date) {
  // YYYYMMDDTHHMMSSZ
  return (
    date.getUTCFullYear() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(value) {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function parseHorarioToTime(horario) {
  if (!horario) return '20:00:00';
  return horario.length === 5 ? `${horario}:00` : horario;
}

function addHours(date, hours) {
  const d = new Date(date.getTime());
  d.setHours(d.getHours() + hours);
  return d;
}

// Baixar arquivo .ics do ensaio (para adicionar no Google Agenda/Calendário)
router.get('/:ensaioId/ics', authenticate, (req, res) => {
  const { ensaioId } = req.params;
  const { data_ensaio } = req.query;
  const db = getDb();

  if (req.user.role !== 'musico') {
    return res.status(403).json({ error: 'Apenas músicos podem baixar o arquivo .ics' });
  }

  if (!data_ensaio) {
    return res.status(400).json({ error: 'Data do ensaio é obrigatória' });
  }

  db.get('SELECT * FROM ensaios WHERE id = ?', [ensaioId], (err, ensaio) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar ensaio' });
    if (!ensaio) return res.status(404).json({ error: 'Ensaio não encontrado' });
    if (ensaio.status !== 'aprovado') return res.status(400).json({ error: 'Apenas ensaios aprovados podem gerar .ics' });

    const timeZone = process.env.APP_TIMEZONE || 'America/Sao_Paulo';
    const horario = parseHorarioToTime(ensaio.horario);

    // Gera Date local a partir de string ISO-like; o offset real depende do ambiente,
    // mas para .ics usaremos UTC (Z) via toISOString/UTC getters.
    const startLocal = new Date(`${data_ensaio}T${horario}`);
    if (Number.isNaN(startLocal.getTime())) {
      return res.status(400).json({ error: 'Data/horário inválidos para gerar .ics' });
    }
    const endLocal = addHours(startLocal, 2);

    const dtstamp = formatUtcForIcs(new Date());
    const dtstart = formatUtcForIcs(startLocal);
    const dtend = formatUtcForIcs(endLocal);

    const uid = `ensaio-${ensaioId}-${data_ensaio}-musico-${req.user.id}@partiuensaio`;
    const summary = `Ensaio - ${ensaio.nome_igreja || ensaio.local || 'Igreja'}`;
    const location = `${ensaio.endereco || ''}${ensaio.cidade ? ` - ${ensaio.cidade}` : ''}${ensaio.estado ? `/${ensaio.estado}` : ''}`.trim();
    const description = [
      'Partiu Ensaio - Interesse confirmado',
      `Data: ${data_ensaio}`,
      `Horário: ${horario}`,
      `Igreja: ${ensaio.nome_igreja || ensaio.local || 'N/A'}`,
      `Endereço: ${ensaio.endereco || 'N/A'}`,
      `Cidade/UF: ${ensaio.cidade || 'N/A'}${ensaio.estado ? `/${ensaio.estado}` : ''}`,
      `Encarregado: ${ensaio.nome_encarregado || 'N/A'}`,
      `Contato: ${ensaio.celular || 'N/A'}`
    ].join('\n');

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Partiu Ensaio//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${escapeIcsText(uid)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      location ? `LOCATION:${escapeIcsText(location)}` : null,
      `DESCRIPTION:${escapeIcsText(description)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean);

    const icsContent = icsLines.join('\r\n') + '\r\n';
    const filename = `ensaio-${ensaioId}-${data_ensaio}.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(icsContent);
  });
});

// Registrar interesse de músico em um ensaio
router.post('/:ensaioId', authenticate, async (req, res) => {
  const { ensaioId } = req.params;
  const { data_ensaio } = req.body;
  const musicoId = req.user.id;
  const db = getDb();

  // Verificar se o usuário é músico
  if (req.user.role !== 'musico') {
    return res.status(403).json({ error: 'Apenas músicos podem demonstrar interesse em ensaios' });
  }

  if (!data_ensaio) {
    return res.status(400).json({ error: 'Data do ensaio é obrigatória' });
  }

  // Verificar se o ensaio existe
  db.get('SELECT * FROM ensaios WHERE id = ?', [ensaioId], (err, ensaio) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ensaio' });
    }

    if (!ensaio) {
      return res.status(404).json({ error: 'Ensaio não encontrado' });
    }

    if (ensaio.status !== 'aprovado') {
      return res.status(400).json({ error: 'Apenas ensaios aprovados podem receber interesses' });
    }

    // Verificar se já existe interesse
    db.get(
      'SELECT * FROM interesses_ensaios WHERE ensaio_id = ? AND musico_id = ? AND data_ensaio = ?',
      [ensaioId, musicoId, data_ensaio],
      (err, interesseExistente) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao verificar interesse' });
        }

        if (interesseExistente) {
          return res.status(400).json({ error: 'Você já demonstrou interesse neste ensaio' });
        }

        // Buscar dados do músico
        db.get('SELECT * FROM users WHERE id = ?', [musicoId], async (err, musico) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados do músico' });
          }

          if (!musico) {
            return res.status(404).json({ error: 'Músico não encontrado' });
          }

          // Criar interesse
          db.run(
            'INSERT INTO interesses_ensaios (ensaio_id, musico_id, data_ensaio) VALUES (?, ?, ?)',
            [ensaioId, musicoId, data_ensaio],
            async function(err) {
              if (err) {
                return res.status(500).json({ error: 'Erro ao registrar interesse' });
              }

              const interesseId = this.lastID;

              // Preparar dados para o webhook
              const webhookData = {
                tipo: 'interesse_ensaio',
                interesse_id: interesseId,
                musico: {
                  id: musico.id,
                  name: musico.name,
                  email: musico.email,
                  instrumento: musico.instrumento || null,
                  categoria_instrumento: musico.categoria_instrumento || null,
                  celular: musico.celular || null,
                  cidade: musico.cidade || null,
                  estado: musico.estado || null
                },
                ensaio: {
                  id: ensaio.id,
                  nome_igreja: ensaio.nome_igreja || ensaio.local || null,
                  endereco: ensaio.endereco || null,
                  cidade: ensaio.cidade || null,
                  estado: ensaio.estado || null,
                  horario: ensaio.horario || null,
                  data_ensaio: data_ensaio,
                  nome_encarregado: ensaio.nome_encarregado || null,
                  celular: ensaio.celular || null,
                  tipo: ensaio.tipo || null,
                  instrumento: ensaio.instrumento || null,
                  categoria_instrumento: ensaio.categoria_instrumento || null,
                  dia_semana: ensaio.dia_semana || null,
                  semana_mes: ensaio.semana_mes || null
                },
                created_at: new Date().toISOString()
              };

              // Enviar webhook imediatamente
              console.log('=== ENVIANDO WEBHOOK - INTERESSE EM ENSAIO ===');
              console.log('URL:', WEBHOOK_URL);
              console.log('Dados:', JSON.stringify(webhookData, null, 2));
              
              let webhookEnviado = false;
              
              // Tentar POST primeiro
              try {
                console.log('Tentando requisição POST...');
                const response = await axios.post(WEBHOOK_URL, webhookData, {
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  timeout: 15000
                });
                
                console.log('✅ Webhook enviado com SUCESSO via POST!');
                console.log('Status:', response.status);
                console.log('Resposta:', JSON.stringify(response.data, null, 2));
                webhookEnviado = true;
              } catch (webhookError) {
                console.error('❌ ERRO ao enviar webhook via POST:');
                console.error('Mensagem:', webhookError.message);
                if (webhookError.response) {
                  console.error('Status:', webhookError.response.status);
                  console.error('Resposta:', JSON.stringify(webhookError.response.data, null, 2));
                  
                  // Se o erro for 404 e mencionar GET, tentar GET como fallback
                  if (webhookError.response.status === 404 && 
                      webhookError.response.data?.message?.includes('GET')) {
                    console.log('⚠️ Webhook não aceita POST, tentando GET como fallback...');
                    
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
                      console.log('Tentando requisição GET com query params...');
                      
                      const getResponse = await axios.get(getUrl, { timeout: 15000 });
                      
                      console.log('✅ Webhook enviado com SUCESSO via GET!');
                      console.log('Status:', getResponse.status);
                      console.log('Resposta:', JSON.stringify(getResponse.data, null, 2));
                      webhookEnviado = true;
                    } catch (getError) {
                      console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
                    }
                  }
                }
                if (webhookError.request && !webhookEnviado) {
                  console.error('Request config:', {
                    url: webhookError.config?.url,
                    method: webhookError.config?.method,
                    data: webhookError.config?.data
                  });
                }
              }

              // Retornar resposta (não bloquear se webhook falhar)
              res.status(201).json({
                message: 'Interesse registrado com sucesso!',
                interesse: {
                  id: interesseId,
                  ensaio_id: ensaioId,
                  musico_id: musicoId,
                  data_ensaio: data_ensaio
                }
              });
            }
          );
        });
      }
    );
  });
});

// Remover interesse de músico em um ensaio
router.delete('/:ensaioId', authenticate, async (req, res) => {
  const { ensaioId } = req.params;
  const { data_ensaio, musico_id } = req.body;
  const db = getDb();

  // Se musico_id for fornecido, é o encarregado/admin removendo
  // Se não, é o próprio músico removendo
  const musicoId = musico_id || req.user.id;

  // Verificar se o usuário é músico (removendo próprio interesse) ou encarregado/admin (removendo qualquer interesse)
  if (req.user.role === 'musico' && musico_id && musico_id !== req.user.id) {
    return res.status(403).json({ error: 'Você só pode remover seu próprio interesse' });
  }

  if (req.user.role !== 'musico' && req.user.role !== 'encarregado' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Se for encarregado/admin removendo, verificar se o ensaio pertence a ele
  if (req.user.role === 'encarregado' || req.user.role === 'admin') {
    db.get('SELECT * FROM ensaios WHERE id = ?', [ensaioId], (err, ensaio) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar ensaio' });
      }

      if (!ensaio) {
        return res.status(404).json({ error: 'Ensaio não encontrado' });
      }

      if (ensaio.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Você não tem permissão para remover interesses deste ensaio' });
      }

      // Remover interesse
      const query = data_ensaio
        ? 'DELETE FROM interesses_ensaios WHERE ensaio_id = ? AND musico_id = ? AND data_ensaio = ?'
        : 'DELETE FROM interesses_ensaios WHERE ensaio_id = ? AND musico_id = ?';
      
      const params = data_ensaio
        ? [ensaioId, musicoId, data_ensaio]
        : [ensaioId, musicoId];

      db.run(query, params, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao remover interesse' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Interesse não encontrado' });
        }

        res.json({ message: 'Interesse removido com sucesso' });
      });
    });
  } else {
    // Músico removendo próprio interesse
    const query = data_ensaio
      ? 'DELETE FROM interesses_ensaios WHERE ensaio_id = ? AND musico_id = ? AND data_ensaio = ?'
      : 'DELETE FROM interesses_ensaios WHERE ensaio_id = ? AND musico_id = ?';
    
    const params = data_ensaio
      ? [ensaioId, musicoId, data_ensaio]
      : [ensaioId, musicoId];

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao remover interesse' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Interesse não encontrado' });
      }

      res.json({ message: 'Interesse removido com sucesso' });
    });
  }
});

// Listar interesses de um ensaio (para encarregado)
router.get('/ensaio/:ensaioId', authenticate, requireEncarregado, (req, res) => {
  const { ensaioId } = req.params;
  const db = getDb();

  // Verificar se o ensaio pertence ao encarregado ou se é admin
  db.get('SELECT * FROM ensaios WHERE id = ?', [ensaioId], (err, ensaio) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ensaio' });
    }

    if (!ensaio) {
      return res.status(404).json({ error: 'Ensaio não encontrado' });
    }

    if (ensaio.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para ver os interesses deste ensaio' });
    }

    // Buscar interesses com dados dos músicos
    db.all(
      `SELECT i.*, u.name as musico_name, u.email as musico_email, u.instrumento, u.categoria_instrumento, u.celular, u.cidade, u.estado
       FROM interesses_ensaios i
       JOIN users u ON i.musico_id = u.id
       WHERE i.ensaio_id = ?
       ORDER BY i.created_at DESC`,
      [ensaioId],
      (err, interesses) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar interesses' });
        }

        res.json(interesses);
      }
    );
  });
});

// Verificar se músico tem interesse em um ensaio
router.get('/verificar/:ensaioId', authenticate, (req, res) => {
  const { ensaioId } = req.params;
  const { data_ensaio } = req.query;
  const musicoId = req.user.id;
  const db = getDb();

  if (!data_ensaio) {
    return res.status(400).json({ error: 'Data do ensaio é obrigatória' });
  }

  db.get(
    'SELECT * FROM interesses_ensaios WHERE ensaio_id = ? AND musico_id = ? AND data_ensaio = ?',
    [ensaioId, musicoId, data_ensaio],
    (err, interesse) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao verificar interesse' });
      }

      res.json({ temInteresse: !!interesse, interesse: interesse || null });
    }
  );
});

module.exports = router;
