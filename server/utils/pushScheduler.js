const webpush = require('web-push');
const { getDb } = require('../database-mysql');

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
  const yyyy = parts.year;
  const mm = parts.month;
  const dd = parts.day;
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  return { dateStr: `${yyyy}-${mm}-${dd}`, hour, minute };
}

function initWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@partiuensaio.com';
  if (!publicKey || !privateKey) {
    console.warn('⚠️ WebPush desativado: defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no .env');
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function sendToSubscription(subRow, payload) {
  const subscription = {
    endpoint: subRow.endpoint,
    expirationTime: subRow.expiration_time || null,
    keys: { p256dh: subRow.p256dh, auth: subRow.auth }
  };
  return await webpush.sendNotification(subscription, JSON.stringify(payload));
}

async function enviarNotificacoesSlot(slotHour) {
  const db = getDb();
  const { dateStr } = getSaoPauloParts();

  // Buscar interesses do dia + subscriptions
  db.all(
    `SELECT 
        i.id AS interesse_id,
        i.musico_id,
        e.id AS ensaio_id,
        e.nome_igreja,
        e.horario,
        e.cidade,
        e.estado
     FROM interesses_ensaios i
     JOIN ensaios e ON e.id = i.ensaio_id
     WHERE i.data_ensaio = ?
       AND e.status = 'aprovado'`,
    [dateStr],
    async (err, interesses) => {
      if (err) {
        console.error('Erro ao buscar interesses do dia (push):', err);
        return;
      }
      if (!interesses || interesses.length === 0) return;

      for (const it of interesses) {
        // Checar se já enviou para este slot
        const already = await new Promise((resolve) => {
          db.get(
            'SELECT id FROM push_notifications_sent WHERE interesse_id = ? AND slot_hour = ?',
            [it.interesse_id, slotHour],
            (err, row) => resolve(!!row)
          );
        });
        if (already) continue;

        const subs = await new Promise((resolve) => {
          db.all(
            'SELECT * FROM push_subscriptions WHERE user_id = ?',
            [it.musico_id],
            (err, rows) => resolve(rows || [])
          );
        });
        if (!subs.length) continue;

        const title = '⏰ Lembrete de Ensaio';
        const place = `${it.cidade || ''}${it.estado ? `/${it.estado}` : ''}`.trim();
        const body = `${it.nome_igreja || 'Ensaio'} hoje às ${it.horario || 'horário a confirmar'}${place ? ` (${place})` : ''}`;

        const payload = {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: `ensaio-${it.ensaio_id}-${dateStr}`,
          data: { url: '/dashboard', ensaioId: it.ensaio_id }
        };

        let anySuccess = false;

        for (const sub of subs) {
          try {
            await sendToSubscription(sub, payload);
            anySuccess = true;
          } catch (e) {
            const statusCode = e?.statusCode || e?.status || null;
            // subscription inválida
            if (statusCode === 404 || statusCode === 410) {
              db.run('DELETE FROM push_subscriptions WHERE id = ?', [sub.id], () => {});
            } else {
              console.error('Erro ao enviar push:', e?.message || e);
            }
          }
        }

        if (anySuccess) {
          db.run(
            'INSERT INTO push_notifications_sent (interesse_id, slot_hour) VALUES (?, ?)',
            [it.interesse_id, slotHour],
            (err) => {
              if (err) console.error('Erro ao marcar push como enviado:', err);
            }
          );
        }
      }
    }
  );
}

function iniciarPushScheduler() {
  const enabled = initWebPush();
  if (!enabled) return;

  console.log('✅ Push Scheduler iniciado (10:00, 11:00, 12:00)');

  const slots = [10, 11, 12];

  const tick = async () => {
    const { hour, minute } = getSaoPauloParts();
    // janela de 10 min pra garantir envio mesmo se o processo atrasar
    if (minute < 10 && slots.includes(hour)) {
      await enviarNotificacoesSlot(hour);
    }
  };

  tick();
  setInterval(tick, 60 * 1000);
}

module.exports = { iniciarPushScheduler };

