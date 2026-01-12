const express = require('express');
const { getDb } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

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

        db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário atualizado' });
          }
          console.log(`Usuário ${user.email} (${user.role}) foi aprovado`);
          res.json(user);
        });
      }
    );
  }
});

module.exports = router;
