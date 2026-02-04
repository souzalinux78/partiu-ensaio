const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_key_aqui_mude_em_producao';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'seu_secret_key_aqui_mude_em_producao') {
  logger.warn('⚠️ JWT_SECRET usando valor padrão. Configure uma chave secreta forte em produção!');
}

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    logger.warn(`Tentativa de acesso sem token: ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Token inválido: ${req.method} ${req.path}`, err.message);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    logger.warn(`Tentativa de acesso sem autenticação: ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Acesso negado - não é admin: ${req.user.role} tentou acessar ${req.method} ${req.path}`);
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

const requireEncarregado = (req, res, next) => {
  if (!req.user) {
    logger.warn(`Tentativa de acesso sem autenticação: ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  if (req.user.role !== 'encarregado' && req.user.role !== 'admin') {
    logger.warn(`Acesso negado - não é encarregado/admin: ${req.user.role} tentou acessar ${req.method} ${req.path}`);
    return res.status(403).json({ error: 'Acesso negado. Apenas encarregados ou administradores.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireEncarregado
};
