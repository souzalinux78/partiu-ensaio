const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database-mysql');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

// Obter perfil do usuário logado
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  
  db.get('SELECT id, email, name, role, aprovado, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  });
});

// Listar músicos pendentes de aprovação (admin)
router.get('/musicos-pendentes', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT id, email, name, role, aprovado, created_at FROM users WHERE role = ? AND aprovado = ? ORDER BY created_at DESC',
    ['musico', 0],
    (err, musicos) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar músicos pendentes' });
      }
      res.json(musicos);
    }
  );
});

// Listar encarregados pendentes de aprovação (admin)
router.get('/encarregados-pendentes', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT id, email, name, role, aprovado, created_at FROM users WHERE role = ? AND aprovado = ? ORDER BY created_at DESC',
    ['encarregado', 0],
    (err, encarregados) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar encarregados pendentes' });
      }
      res.json(encarregados);
    }
  );
});

// Listar todos os usuários pendentes (admin)
router.get('/pendentes', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT id, email, name, role, aprovado, created_at FROM users WHERE role IN (?, ?) AND aprovado = ? ORDER BY created_at DESC',
    ['musico', 'encarregado', 0],
    (err, usuarios) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar usuários pendentes' });
      }
      res.json(usuarios);
    }
  );
});

// Aprovar ou rejeitar usuário (músico ou encarregado) (admin)
router.patch('/:id/aprovar', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { aprovado } = req.body;
  const db = getDb();

  if (aprovado !== 1 && aprovado !== 0) {
    return res.status(400).json({ error: 'Valor de aprovação inválido' });
  }

  // Se for rejeitar (aprovado = 0), deletar o usuário
  if (aprovado === 0) {
    // Primeiro verificar se o usuário existe e pode ser deletado
    db.get('SELECT * FROM users WHERE id = ? AND role IN (?, ?)', [id, 'musico', 'encarregado'], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado ou não pode ser rejeitado' });
      }

      // Deletar o usuário
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao deletar usuário' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        console.log(`Usuário ${user.email} (${user.role}) foi rejeitado e deletado`);
        res.json({ 
          message: 'Usuário rejeitado e removido com sucesso',
          deleted: true,
          user: user
        });
      });
    });
  } else {
    // Se for aprovar (aprovado = 1), atualizar o status
    db.run(
      'UPDATE users SET aprovado = ? WHERE id = ? AND role IN (?, ?)',
      [aprovado, id, 'musico', 'encarregado'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erro ao atualizar aprovação' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Usuário não encontrado ou não pode ser aprovado' });
        }

        db.get('SELECT * FROM users WHERE id = ?', [id], async (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário atualizado' });
          }
          console.log(`Usuário ${user.email} (${user.role}) foi aprovado`);
          
          // Enviar webhook de aprovação
          try {
            const webhookData = {
              tipo: `aprovacao_${user.role}`,
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              aprovado: true,
              tipo_encarregado: user.tipo || null,
              instrumento: user.instrumento || null,
              categoria_instrumento: user.categoria_instrumento || null,
              celular: user.celular || null,
              cidade: user.cidade || null,
              estado: user.estado || null,
              aprovado_em: new Date().toISOString(),
              created_at: user.created_at
            };

            console.log('=== ENVIANDO WEBHOOK - APROVAÇÃO DE USUÁRIO ===');
            console.log('URL:', WEBHOOK_URL);
            console.log('Dados:', JSON.stringify(webhookData, null, 2));

            let webhookEnviado = false;
            
            // Tentar POST primeiro
            try {
              const response = await axios.post(WEBHOOK_URL, webhookData, {
                headers: {
                  'Content-Type': 'application/json'
                },
                timeout: 15000
              });
              
              console.log('✅ Webhook de aprovação enviado com SUCESSO via POST!');
              console.log('Status:', response.status);
              webhookEnviado = true;
            } catch (webhookError) {
              console.error('❌ ERRO ao enviar webhook via POST:', webhookError.message);
              
              // Se o erro for 404 e mencionar GET, tentar GET como fallback
              if (webhookError.response?.status === 404 && 
                  webhookError.response?.data?.message?.includes('GET')) {
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
                  const getResponse = await axios.get(getUrl, { timeout: 15000 });
                  
                  console.log('✅ Webhook de aprovação enviado com SUCESSO via GET!');
                  webhookEnviado = true;
                } catch (getError) {
                  console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
                }
              }
            }
          } catch (webhookErr) {
            // Não bloquear a resposta se o webhook falhar
            console.error('❌ Erro ao processar webhook de aprovação:', webhookErr.message);
          }
          
          res.json(user);
        });
      }
    );
  }
});

// Alterar senha do usuário
router.post('/alterar-senha', authenticate, (req, res) => {
  const { senhaAtual, novaSenha, userId } = req.body;
  const db = getDb();
  
  // Determinar qual usuário terá a senha alterada
  // Se userId for fornecido e o usuário for admin, pode alterar senha de qualquer usuário
  // Caso contrário, só pode alterar sua própria senha
  const isAdminChangingOtherUser = userId && req.user.role === 'admin';
  const targetUserId = isAdminChangingOtherUser ? userId : req.user.id;
  
  // Validar campos obrigatórios
  // Admin alterando senha de outro usuário não precisa de senhaAtual
  if (!isAdminChangingOtherUser && !senhaAtual) {
    return res.status(400).json({ error: 'Senha atual é obrigatória' });
  }
  
  if (!novaSenha) {
    return res.status(400).json({ error: 'Nova senha é obrigatória' });
  }
  
  // Validar tamanho da nova senha
  if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
  }
  
  // Buscar o usuário
  db.get('SELECT * FROM users WHERE id = ?', [targetUserId], (err, user) => {
    if (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Se não for admin alterando senha de outro usuário, verificar senha atual
    if (!isAdminChangingOtherUser) {
      // Verificar senha atual
      bcrypt.compare(senhaAtual, user.password, (err, isMatch) => {
        if (err) {
          console.error('❌ Erro ao verificar senha:', err);
          return res.status(500).json({ error: 'Erro ao verificar senha' });
        }
        
        if (!isMatch) {
          return res.status(401).json({ error: 'Senha atual incorreta' });
        }
        
        // Senha atual está correta, atualizar para nova senha
        updatePassword();
      });
    } else {
      // Admin alterando senha de outro usuário, não precisa verificar senha atual
      updatePassword();
    }
    
    function updatePassword() {
      // Gerar hash da nova senha
      bcrypt.hash(novaSenha, 10, (err, hash) => {
        if (err) {
          console.error('❌ Erro ao gerar hash da senha:', err);
          return res.status(500).json({ error: 'Erro ao gerar nova senha' });
        }
        
        // Atualizar senha no banco
        db.run('UPDATE users SET password = ? WHERE id = ?', [hash, targetUserId], function(err) {
          if (err) {
            console.error('❌ Erro ao atualizar senha:', err);
            return res.status(500).json({ error: 'Erro ao atualizar senha' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
          }
          
          console.log(`✅ Senha alterada com sucesso para usuário ${user.email} (ID: ${targetUserId})`);
          res.json({ 
            message: 'Senha alterada com sucesso',
            success: true
          });
        });
      });
    }
  });
});

// Listar todos os usuários (admin) - músico/encarregado/admin
router.get('/todos', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  db.all(
    `SELECT 
        u.id, u.email, u.name, u.role, u.aprovado, u.tipo, u.instrumento, u.categoria_instrumento, u.celular, u.cidade, u.estado, u.created_at, u.updated_at,
        GROUP_CONCAT(DISTINCT e.nome_igreja ORDER BY e.nome_igreja SEPARATOR ' | ') AS igrejas
     FROM users u
     LEFT JOIN ensaios e ON e.user_id = u.id AND e.nome_igreja IS NOT NULL AND e.nome_igreja != ''
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({ error: 'Erro ao buscar usuários' });
      }
      res.json(rows || []);
    }
  );
});

// Editar usuário (admin) - permite atualizar dados de perfil
router.patch('/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    aprovado,
    tipo,
    instrumento,
    categoria_instrumento,
    celular,
    cidade,
    estado
  } = req.body || {};

  const db = getDb();

  // Buscar usuário alvo
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar usuário' });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Não permitir alterar role por aqui (segurança)
    // Validar aprovado se enviado
    if (aprovado !== undefined && aprovado !== 0 && aprovado !== 1) {
      return res.status(400).json({ error: 'Campo aprovado inválido' });
    }

    // Validar tipo de encarregado se enviado
    if (tipo !== undefined && tipo !== null && tipo !== '' && !['local', 'regional'].includes(String(tipo).toLowerCase())) {
      return res.status(400).json({ error: 'Tipo deve ser local ou regional' });
    }

    const updateQuery = `
      UPDATE users SET
        name = ?,
        email = ?,
        aprovado = ?,
        tipo = ?,
        instrumento = ?,
        categoria_instrumento = ?,
        celular = ?,
        cidade = ?,
        estado = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [
      name !== undefined ? name : user.name,
      email !== undefined ? email : user.email,
      aprovado !== undefined ? aprovado : user.aprovado,
      tipo !== undefined ? (tipo ? String(tipo).toLowerCase() : null) : user.tipo,
      instrumento !== undefined ? (instrumento || null) : user.instrumento,
      categoria_instrumento !== undefined ? (categoria_instrumento || null) : user.categoria_instrumento,
      celular !== undefined ? (celular || null) : user.celular,
      cidade !== undefined ? (cidade || null) : user.cidade,
      estado !== undefined ? (estado || null) : user.estado,
      id
    ];

    db.run(updateQuery, values, function (err) {
      if (err) {
        console.error('Erro ao atualizar usuário:', err);
        // MySQL: email duplicado
        if (String(err.message || '').includes('Duplicate') || String(err.code || '').includes('DUP')) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }

      db.get(
        'SELECT id, email, name, role, aprovado, tipo, instrumento, categoria_instrumento, celular, cidade, estado, created_at, updated_at FROM users WHERE id = ?',
        [id],
        (err, updated) => {
          if (err) return res.status(500).json({ error: 'Erro ao buscar usuário atualizado' });
          res.json(updated);
        }
      );
    });
  });
});

module.exports = router;
