/**
 * Repository para operações de banco de dados relacionadas a ensaios
 * Responsável por abstrair queries SQL e retornar dados estruturados
 */

const { getDb } = require('../database-mysql');
const logger = require('../utils/logger');

/**
 * Busca o ensaio de um músico no dia atual
 * 
 * @param {number} musicoId - ID do músico
 * @returns {Promise<Object|null>} - Ensaio encontrado ou null
 */
async function buscarEnsaioDoDiaPorMusico(musicoId) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Query para buscar o ensaio mais próximo no horário do dia atual
    // Relaciona: interesses_ensaios → ensaios
    // Filtra: status = 'aprovado', data_ensaio = CURDATE()
    // Ordena: por horário (mais próximo primeiro)
    // Limita: 1 resultado
    const query = `
      SELECT 
        e.id as ensaio_id,
        e.nome_igreja as titulo,
        TIME_FORMAT(e.horario, '%H:%i') as horario,
        DATE_FORMAT(i.data_ensaio, '%Y-%m-%d') as data
      FROM interesses_ensaios i
      INNER JOIN ensaios e ON i.ensaio_id = e.id
      WHERE i.musico_id = ?
        AND i.data_ensaio = CURDATE()
        AND e.status = 'aprovado'
      ORDER BY e.horario ASC
      LIMIT 1
    `;

    db.get(query, [musicoId], (err, row) => {
      if (err) {
        logger.error('Erro ao buscar ensaio do dia por músico:', err);
        return reject(err);
      }

      // Retorna null se não encontrou (não é erro)
      resolve(row || null);
    });
  });
}

/**
 * Busca um usuário pelo celular normalizado
 * 
 * @param {string} celularNormalizado - Celular no formato 55XXXXXXXXXXX
 * @returns {Promise<Object|null>} - Usuário encontrado ou null
 */
async function buscarUsuarioPorCelular(celularNormalizado) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Busca usuário pelo celular (pode ter variações de formatação)
    // Normaliza o celular na query para comparar
    const query = `
      SELECT id, name, email, role, celular
      FROM users
      WHERE REPLACE(REPLACE(REPLACE(REPLACE(celular, ' ', ''), '-', ''), '(', ''), ')', '') = ?
        AND role = 'musico'
        AND aprovado = 1
      LIMIT 1
    `;

    db.get(query, [celularNormalizado], (err, row) => {
      if (err) {
        logger.error('Erro ao buscar usuário por celular:', err);
        return reject(err);
      }

      resolve(row || null);
    });
  });
}

module.exports = {
  buscarEnsaioDoDiaPorMusico,
  buscarUsuarioPorCelular
};
