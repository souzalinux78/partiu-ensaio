/**
 * API Route: Buscar Ensaio por Telefone
 * 
 * Endpoint: GET /api/ensaios/por-telefone/:telefone
 * 
 * Descrição:
 * Endpoint para integração com n8n + WhatsApp (Evolution API) que identifica
 * automaticamente se um músico possui ensaio no dia atual, baseado no telefone.
 * 
 * Funciona em ambiente local e produção:
 * - LOCAL: http://localhost:5000/api/ensaios/por-telefone/{telefone}
 * - PRODUÇÃO: https://partiuensaio.automatizeonline.com.br/api/ensaios/por-telefone/{telefone}
 * 
 * Resposta:
 * - Se encontrar: { ensaio_id, titulo, horario, data }
 * - Se não encontrar: {} (objeto vazio, status 200)
 */

import { NextRequest, NextResponse } from 'next/server';

// Importar conexão MySQL (usando require para compatibilidade com CommonJS)
// Reutiliza a mesma configuração do projeto existente
let mysql: any;
let path: any;

try {
  mysql = require('mysql2/promise');
  path = require('path');
  require('dotenv').config({ path: path.join(process.cwd(), 'server', '.env') });
} catch (error) {
  console.error('[API ensaios/por-telefone] Erro ao carregar dependências:', error);
}

/**
 * Obter conexão com banco de dados MySQL
 * Reutiliza a mesma configuração do projeto existente
 */
function getDbConnection() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'FLoc25GD!',
    database: process.env.DB_NAME || 'partiu_ensaio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  return mysql.createPool(dbConfig);
}

/**
 * Normaliza um número de telefone para o formato padrão
 * Remove caracteres especiais e garante prefixo 55 (Brasil)
 * 
 * @param telefone - Telefone em qualquer formato
 * @returns Telefone normalizado (55XXXXXXXXXXX)
 * 
 * Exemplos:
 * - "(11) 97460-5594" → "5511974605594"
 * - "11974605594" → "5511974605594"
 * - "5511974605594" → "5511974605594"
 * - "+55 11 97460-5594" → "5511974605594"
 */
function normalizarTelefone(telefone: string): string | null {
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

  // Adiciona prefixo 55 se não tiver
  if (!numeros.startsWith('55')) {
    numeros = '55' + numeros;
  }

  return numeros;
}

/**
 * Busca um usuário pelo celular normalizado
 */
async function buscarUsuarioPorCelular(
  pool: any,
  celularNormalizado: string
): Promise<any | null> {
  try {
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

    const [rows] = await pool.execute(query, [celularNormalizado]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error: any) {
    console.error('[API ensaios/por-telefone] Erro ao buscar usuário:', error);
    throw error;
  }
}

/**
 * Busca o ensaio de um músico no dia atual
 */
async function buscarEnsaioDoDiaPorMusico(
  pool: any,
  musicoId: number
): Promise<any | null> {
  try {
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

    const [rows] = await pool.execute(query, [musicoId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error: any) {
    console.error('[API ensaios/por-telefone] Erro ao buscar ensaio:', error);
    throw error;
  }
}

/**
 * Handler GET para buscar ensaio por telefone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { telefone: string } }
) {
  try {
    const { telefone } = params;

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[API ensaios/por-telefone] Telefone recebido:', telefone);
    }

    // 1. Normalizar telefone
    const telefoneNormalizado = normalizarTelefone(telefone);

    if (!telefoneNormalizado) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[API ensaios/por-telefone] Telefone inválido');
      }
      // Retornar objeto vazio (não erro 404) para facilitar integração n8n
      return NextResponse.json({}, { status: 200 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[API ensaios/por-telefone] Telefone normalizado:', telefoneNormalizado);
    }

    // 2. Obter conexão com banco de dados
    const pool = getDbConnection();

    try {
      // 3. Buscar usuário pelo celular normalizado
      const usuario = await buscarUsuarioPorCelular(pool, telefoneNormalizado);

      if (!usuario) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[API ensaios/por-telefone] Usuário não encontrado');
        }
        // Retornar objeto vazio (não erro 404) para facilitar integração n8n
        return NextResponse.json({}, { status: 200 });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[API ensaios/por-telefone] Usuário encontrado:', usuario.id, usuario.name);
      }

      // 4. Buscar ensaio do dia atual para este músico
      const ensaio = await buscarEnsaioDoDiaPorMusico(pool, usuario.id);

      if (!ensaio) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[API ensaios/por-telefone] Nenhum ensaio encontrado para hoje');
        }
        // Retornar objeto vazio (não erro 404) para facilitar integração n8n
        return NextResponse.json({}, { status: 200 });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[API ensaios/por-telefone] Ensaio encontrado:', ensaio);
      }

      // 5. Retornar ensaio encontrado
      return NextResponse.json(ensaio, { status: 200 });
    } finally {
      // Fechar pool de conexões (se necessário)
      // O pool gerencia conexões automaticamente, mas podemos garantir limpeza
    }
  } catch (error: any) {
    console.error('[API ensaios/por-telefone] Erro:', error);
    
    // Em caso de erro, retornar objeto vazio (não erro 500) para facilitar integração n8n
    return NextResponse.json({}, { status: 200 });
  }
}
