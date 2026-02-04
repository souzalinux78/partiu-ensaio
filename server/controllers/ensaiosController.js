/**
 * Controller para lógica de negócio relacionada a ensaios
 * Responsável por processar requisições e coordenar repositories
 */

const ensaiosRepository = require('../repositories/ensaiosRepository');
const logger = require('../utils/logger');

/**
 * Normaliza um número de telefone para o formato padrão
 * Remove caracteres especiais e garante DDI 55 (Brasil)
 * 
 * @param {string} telefone - Telefone em qualquer formato
 * @returns {string} - Telefone normalizado (55XXXXXXXXXXX)
 * 
 * Exemplos:
 * - "(11) 97460-5594" → "5511974605594"
 * - "11974605594" → "5511974605594"
 * - "5511974605594" → "5511974605594"
 * - "+55 11 97460-5594" → "5511974605594"
 */
function normalizarTelefone(telefone) {
  if (!telefone || typeof telefone !== 'string') {
    return null;
  }

  // Remove todos os caracteres não numéricos
  let numeros = telefone.replace(/\D/g, '');

  // Se começar com 55, mantém
  if (numeros.startsWith('55')) {
    return numeros;
  }

  // Se começar com 0, remove o 0 e adiciona 55
  if (numeros.startsWith('0')) {
    numeros = numeros.substring(1);
  }

  // Adiciona DDI 55 se não tiver
  if (!numeros.startsWith('55')) {
    numeros = '55' + numeros;
  }

  return numeros;
}

/**
 * Busca o ensaio de um músico no dia atual pelo telefone
 * 
 * @param {string} telefone - Telefone do músico (qualquer formato)
 * @returns {Promise<Object>} - { ensaio_id, titulo, horario, data } ou null
 */
async function buscarEnsaioPorTelefone(telefone) {
  try {
    // 1. Normalizar telefone
    const telefoneNormalizado = normalizarTelefone(telefone);
    
    if (!telefoneNormalizado) {
      logger.warn('Telefone inválido fornecido:', telefone);
      return null;
    }

    logger.debug('Telefone normalizado:', telefoneNormalizado);

    // 2. Buscar usuário pelo celular normalizado
    const usuario = await ensaiosRepository.buscarUsuarioPorCelular(telefoneNormalizado);
    
    if (!usuario) {
      logger.debug('Usuário não encontrado para o telefone:', telefoneNormalizado);
      return null;
    }

    logger.debug('Usuário encontrado:', { id: usuario.id, name: usuario.name });

    // 3. Buscar ensaio do dia atual para este músico
    const ensaio = await ensaiosRepository.buscarEnsaioDoDiaPorMusico(usuario.id);
    
    if (!ensaio) {
      logger.debug('Nenhum ensaio encontrado para o músico no dia atual:', usuario.id);
      return null;
    }

    logger.info('Ensaio encontrado:', {
      musico: usuario.name,
      ensaio_id: ensaio.ensaio_id,
      data: ensaio.data,
      horario: ensaio.horario
    });

    return ensaio;
  } catch (error) {
    logger.error('Erro ao buscar ensaio por telefone:', error);
    throw error;
  }
}

module.exports = {
  buscarEnsaioPorTelefone,
  normalizarTelefone
};
