const express = require('express');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { getDb } = require('../database-mysql');

const router = express.Router();
const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

router.post('/problema', authenticate, async (req, res) => {
  const { categoria, mensagem, pagina, deviceInfo } = req.body || {};
  const db = getDb();

  if (!mensagem || String(mensagem).trim().length < 5) {
    return res.status(400).json({ error: 'Descreva o problema (mínimo 5 caracteres).' });
  }

  // Só músicos/encarregados (admin pode também, se quiser)
  if (!['musico', 'encarregado', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  db.get('SELECT id, email, name, role, tipo, celular, cidade, estado FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar usuário' });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const webhookData = {
      tipo: 'reportar_problema',
      usuario: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tipo_encarregado: user.role === 'encarregado' ? (user.tipo || null) : null,
        celular: user.celular || null,
        cidade: user.cidade || null,
        estado: user.estado || null
      },
      problema: {
        categoria: categoria || 'geral',
        mensagem: String(mensagem).trim(),
        pagina: pagina || null
      },
      device: deviceInfo || null,
      created_at: new Date().toISOString()
    };

    console.log('=== ENVIANDO WEBHOOK - REPORTAR PROBLEMA ===');
    console.log('URL:', WEBHOOK_URL);
    console.log('Dados:', JSON.stringify(webhookData, null, 2));

    // Tentar POST primeiro, com fallback GET
    try {
      await axios.post(WEBHOOK_URL, webhookData, { timeout: 15000 });
      console.log('✅ Webhook de problema enviado via POST');
    } catch (webhookError) {
      console.error('❌ ERRO ao enviar webhook via POST:', webhookError.message);

      if (webhookError.response?.status === 404 && webhookError.response?.data?.message?.includes('GET')) {
        try {
          const params = new URLSearchParams();
          Object.keys(webhookData).forEach((key) => {
            const val = webhookData[key];
            if (val !== null && val !== undefined) {
              params.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
            }
          });
          const getUrl = `${WEBHOOK_URL}?${params.toString()}`;
          await axios.get(getUrl, { timeout: 15000 });
          console.log('✅ Webhook de problema enviado via GET');
        } catch (getError) {
          console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
        }
      }
    }

    res.json({ success: true });
  });
});

module.exports = router;

