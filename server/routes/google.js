const express = require('express');
const { google } = require('googleapis');
const { getDb } = require('../database-mysql');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  return `${proto}://${req.get('host')}`;
}

function getOAuthClient(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET não configurados');
  }
  const redirectUri = `${getBaseUrl(req)}/api/google/callback`;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

router.get('/status', authenticate, (req, res) => {
  const db = getDb();
  db.get(
    'SELECT google_email, google_refresh_token FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar status Google' });
      const connected = !!row?.google_refresh_token;
      res.json({ connected, google_email: row?.google_email || null });
    }
  );
});

router.get('/auth', authenticate, (req, res) => {
  try {
    if (req.user.role !== 'musico') {
      return res.status(403).json({ error: 'Apenas músicos podem conectar Google Agenda' });
    }

    const oauth2Client = getOAuthClient(req);
    const scopes = ['https://www.googleapis.com/auth/calendar.events'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: String(req.user.id),
      include_granted_scopes: true
    });
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Erro ao iniciar OAuth' });
  }
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const userId = state;

  try {
    const oauth2Client = getOAuthClient(req);
    const { tokens } = await oauth2Client.getToken(code);

    const db = getDb();

    // Caso comum: Google não reenvia refresh_token se o usuário já autorizou antes.
    // Se já existe refresh_token salvo, seguimos sem erro.
    const existingRefresh = await new Promise((resolve) => {
      db.get('SELECT google_refresh_token FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) return resolve(null);
        resolve(row?.google_refresh_token || null);
      });
    });

    const refreshTokenToSave = tokens?.refresh_token || existingRefresh;

    if (!refreshTokenToSave) {
      const front = process.env.FRONTEND_URL || getBaseUrl(req);
      const html = `
        <html><head><meta charset="utf-8"><title>Erro no callback do Google</title></head>
        <body style="font-family: Arial, sans-serif; padding: 16px;">
          <h3>Erro no callback do Google</h3>
          <p><strong>Motivo:</strong> não recebemos <code>refresh_token</code>.</p>
          <p>Isso normalmente acontece quando a conta Google já autorizou o app anteriormente e o Google não reenvia o refresh token.</p>
          <p><strong>Como resolver:</strong> vá em <em>Conta Google → Segurança → Acesso de terceiros</em>, remova o acesso do app e tente conectar novamente.</p>
          <p><a href="${front}/dashboard">Voltar ao app</a></p>
        </body></html>`;
      return res.status(400).send(html);
    }

    oauth2Client.setCredentials({ ...tokens, refresh_token: refreshTokenToSave });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    const googleEmail = me?.data?.email || null;

    db.run(
      'UPDATE users SET google_refresh_token = ?, google_email = ? WHERE id = ?',
      [refreshTokenToSave, googleEmail, userId],
      function (err) {
        if (err) {
          console.error('Erro ao salvar tokens Google:', err);
          return res.status(500).send('Erro ao salvar conexão Google');
        }
        const front = process.env.FRONTEND_URL || getBaseUrl(req);
        return res.redirect(`${front}/dashboard?google=connected`);
      }
    );
  } catch (e) {
    console.error('Erro callback Google:', e?.response?.data || e);
    const front = process.env.FRONTEND_URL || getBaseUrl(req);
    const redirectUri = `${getBaseUrl(req)}/api/google/callback`;
    const details = escapeHtml(JSON.stringify(e?.response?.data || { message: e?.message || String(e) }, null, 2));
    const html = `
      <html><head><meta charset="utf-8"><title>Erro no callback do Google</title></head>
      <body style="font-family: Arial, sans-serif; padding: 16px;">
        <h3>Erro no callback do Google</h3>
        <p>Veja os detalhes abaixo (isso ajuda a corrigir rapidamente).</p>
        <p><strong>redirect_uri esperado pelo servidor:</strong> <code>${escapeHtml(redirectUri)}</code></p>
        <pre style="background:#f5f5f5; padding:12px; border-radius:8px; overflow:auto;">${details}</pre>
        <p><a href="${front}/dashboard">Voltar ao app</a></p>
      </body></html>`;
    res.status(500).send(html);
  }
});

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

router.post('/disconnect', authenticate, (req, res) => {
  const db = getDb();
  db.run(
    'UPDATE users SET google_refresh_token = NULL, google_email = NULL WHERE id = ?',
    [req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao desconectar Google' });
      res.json({ success: true });
    }
  );
});

// Criar evento no Google Calendar para um interesse
router.post('/create-event', authenticate, (req, res) => {
  const { ensaioId, data_ensaio } = req.body || {};
  const db = getDb();

  if (req.user.role !== 'musico') return res.status(403).json({ error: 'Apenas músico' });
  if (!ensaioId || !data_ensaio) return res.status(400).json({ error: 'ensaioId e data_ensaio são obrigatórios' });

  db.get('SELECT google_refresh_token FROM users WHERE id = ?', [req.user.id], async (err, u) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar usuário' });
    if (!u?.google_refresh_token) return res.status(400).json({ error: 'Google Agenda não conectado' });

    db.get(
      `SELECT i.id AS interesse_id, i.google_event_id, e.*
       FROM interesses_ensaios i
       JOIN ensaios e ON e.id = i.ensaio_id
       WHERE i.ensaio_id = ? AND i.musico_id = ? AND i.data_ensaio = ?`,
      [ensaioId, req.user.id, data_ensaio],
      async (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar interesse/ensaio' });
        if (!row) return res.status(404).json({ error: 'Interesse não encontrado' });

        try {
          const oauth2Client = getOAuthClient(req);
          oauth2Client.setCredentials({ refresh_token: u.google_refresh_token });
          const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

          const timeZone = process.env.APP_TIMEZONE || 'America/Sao_Paulo';
          const horario = row.horario ? String(row.horario) : '20:00:00';
          const startLocal = new Date(`${data_ensaio}T${horario}`);
          const endLocal = new Date(startLocal.getTime() + 2 * 60 * 60 * 1000);

          const summary = `Ensaio - ${row.nome_igreja || row.local || 'Igreja'}`;
          const location = `${row.endereco || ''}${row.cidade ? ` - ${row.cidade}` : ''}${row.estado ? `/${row.estado}` : ''}`.trim();
          const description = [
            'Partiu Ensaio - Interesse confirmado',
            `Data: ${data_ensaio}`,
            `Horário: ${horario}`,
            `Encarregado: ${row.nome_encarregado || 'N/A'}`,
            `Contato: ${row.celular || 'N/A'}`
          ].join('\n');

          const requestBody = {
            summary,
            location: location || undefined,
            description,
            start: { dateTime: startLocal.toISOString(), timeZone },
            end: { dateTime: endLocal.toISOString(), timeZone },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 0 } // Google pode ajustar, mas evitamos default 30m
              ]
            }
          };

          let eventId = row.google_event_id;
          if (eventId) {
            await calendar.events.update({ calendarId: 'primary', eventId, requestBody });
          } else {
            const ev = await calendar.events.insert({ calendarId: 'primary', requestBody });
            eventId = ev?.data?.id || null;
            if (eventId) {
              db.run('UPDATE interesses_ensaios SET google_event_id = ? WHERE id = ?', [eventId, row.interesse_id], () => {});
            }
          }

          res.json({ success: true, google_event_id: eventId });
        } catch (e) {
          console.error('Erro criar evento Google:', e);
          res.status(500).json({ error: 'Erro ao criar evento no Google Agenda' });
        }
      }
    );
  });
});

module.exports = router;

