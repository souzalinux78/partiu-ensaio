const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_key_aqui_mude_em_producao';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

const requireEncarregado = (req, res, next) => {
  if (req.user.role !== 'encarregado' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas encarregados ou administradores.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireEncarregado
};
