const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../database-mysql');

const router = express.Router();

// Salvar/atualizar subscription do usuário logado
router.post('/subscribe', authenticate, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const sub = req.body?.subscription;

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ error: 'Subscription inválida' });
  }

  const endpoint = sub.endpoint;
  const p256dh = sub.keys.p256dh;
  const auth = sub.keys.auth;
  const expirationTime = sub.expirationTime || null;

  // Upsert por endpoint
  db.run(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, expiration_time)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id),
       p256dh = VALUES(p256dh),
       auth = VALUES(auth),
       expiration_time = VALUES(expiration_time),
       updated_at = CURRENT_TIMESTAMP`,
    [userId, endpoint, p256dh, auth, expirationTime],
    function (err) {
      if (err) {
        console.error('Erro ao salvar subscription:', err);
        return res.status(500).json({ error: 'Erro ao salvar subscription' });
      }
      res.json({ success: true });
    }
  );
});

router.post('/unsubscribe', authenticate, (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const endpoint = req.body?.endpoint;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint é obrigatório' });
  }

  db.run(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [userId, endpoint],
    function (err) {
      if (err) return res.status(500).json({ error: 'Erro ao remover subscription' });
      res.json({ success: true, removed: this.changes || 0 });
    }
  );
});

router.get('/status', authenticate, (req, res) => {
  const db = getDb();
  db.get(
    'SELECT COUNT(*) as total FROM push_subscriptions WHERE user_id = ?',
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Erro ao buscar status push' });
      res.json({ subscribed: (row?.total || 0) > 0, total: row?.total || 0 });
    }
  );
});

module.exports = router;

