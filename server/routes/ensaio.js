const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { getDb } = require('../database-mysql');
const { authenticate, requireAdmin, requireEncarregado } = require('../middleware/auth');
const { calcularProximaData, estaDentroDe7Dias, deveAparecer, calcularOcorrenciasFuturas } = require('../utils/dateCalculator');

const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

const router = express.Router();

// Função auxiliar para verificar se a coluna 'local' existe (apenas SQLite)
// MySQL não precisa desta verificação - a coluna 'local' não existe no schema MySQL
const checkLocalColumn = (db) => {
  // Para MySQL, sempre retorna false (não tem coluna 'local')
  return Promise.resolve(false);
};

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ensaio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif)'));
    }
  }
});

// Criar novo ensaio (apenas encarregados)
router.post('/', authenticate, requireEncarregado, upload.single('foto'), async (req, res) => {
  try {
    const { nome_encarregado, tipo, celular, dia_semana, semana_mes, horario, nome_igreja, endereco, cidade, estado, instrumento, categoria_instrumento } = req.body;
    const db = getDb();

    console.log('Dados recebidos:', { nome_encarregado, tipo, celular, dia_semana, semana_mes, horario, nome_igreja, endereco, cidade, estado, instrumento, categoria_instrumento });
    
    // Calcular próxima data do ensaio
    const proxima_data = calcularProximaData(dia_semana, semana_mes ? parseInt(semana_mes) : null);

    if (!nome_encarregado || !tipo || !celular || !horario || !nome_igreja || !endereco) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    if (!['local', 'regional'].includes(tipo.toLowerCase())) {
      return res.status(400).json({ error: 'Tipo deve ser "local" ou "regional"' });
    }

    const foto_local = req.file ? `/uploads/${req.file.filename}` : null;
    const foto_url = req.file ? `${req.protocol}://${req.get('host')}${foto_local}` : null;

    // Verificar se a coluna 'local' existe (compatibilidade com banco antigo)
    checkLocalColumn(db).then((hasLocalColumn) => {
      let insertQuery, insertValues;
      
      const semanaMesNum = semana_mes ? parseInt(semana_mes) : null;
      
      if (hasLocalColumn) {
        // Se a coluna 'local' existir, incluir ela na inserção (compatibilidade)
        insertQuery = 'INSERT INTO ensaios (user_id, nome_encarregado, tipo, celular, dia_semana, semana_mes, proxima_data, horario, nome_igreja, endereco, cidade, estado, instrumento, categoria_instrumento, local, foto_local, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        insertValues = [req.user.id, nome_encarregado, tipo.toLowerCase(), celular, dia_semana || null, semanaMesNum, proxima_data, horario, nome_igreja, endereco, cidade || null, estado || null, instrumento || null, categoria_instrumento || null, nome_igreja, foto_local, 'pendente'];
      } else {
        // Se não tiver a coluna 'local', usar a query normal
        insertQuery = 'INSERT INTO ensaios (user_id, nome_encarregado, tipo, celular, dia_semana, semana_mes, proxima_data, horario, nome_igreja, endereco, cidade, estado, instrumento, categoria_instrumento, foto_local, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        insertValues = [req.user.id, nome_encarregado, tipo.toLowerCase(), celular, dia_semana || null, semanaMesNum, proxima_data, horario, nome_igreja, endereco, cidade || null, estado || null, instrumento || null, categoria_instrumento || null, foto_local, 'pendente'];
      }

      db.run(insertQuery, insertValues, async function(err) {
        if (err) {
          console.error('Erro ao inserir ensaio no banco:', err);
          return res.status(500).json({ error: 'Erro ao criar ensaio: ' + err.message });
        }

        db.get('SELECT * FROM ensaios WHERE id = ?', [this.lastID], async (err, ensaio) => {
          if (err) {
            console.error('Erro ao buscar ensaio criado:', err);
            return res.status(500).json({ error: 'Erro ao buscar ensaio criado: ' + err.message });
          }

          // Preparar dados para o webhook
          const webhookData = {
            tipo: 'cadastro_ensaio',
            id: ensaio.id,
            nome_encarregado: ensaio.nome_encarregado,
            tipo_ensaio: ensaio.tipo,
            celular: ensaio.celular,
            instrumento: ensaio.instrumento || null,
            categoria_instrumento: ensaio.categoria_instrumento || null,
            dia_semana: ensaio.dia_semana || null,
            semana_mes: ensaio.semana_mes || null,
            proxima_data: ensaio.proxima_data || null,
            horario: ensaio.horario,
            nome_igreja: ensaio.nome_igreja,
            endereco: ensaio.endereco,
            cidade: ensaio.cidade || null,
            estado: ensaio.estado || null,
            foto_url: foto_url,
            status: ensaio.status,
            user_id: ensaio.user_id,
            created_at: ensaio.created_at
          };

          // Enviar dados para o webhook - AGUARDAR antes de retornar resposta
          let webhookEnviado = false;
          
          // Tentar POST primeiro
          try {
            console.log('=== ENVIANDO WEBHOOK - CADASTRO ENSAIO ===');
            console.log('URL:', WEBHOOK_URL);
            console.log('Dados:', JSON.stringify(webhookData, null, 2));
            console.log('Tentando requisição POST...');
            
            const response = await axios.post(WEBHOOK_URL, webhookData, {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 15000
            });
            
            console.log('✅ Webhook enviado com SUCESSO via POST!');
            console.log('Status:', response.status);
            console.log('Resposta:', JSON.stringify(response.data, null, 2));
            webhookEnviado = true;
          } catch (webhookError) {
            console.error('❌ ERRO ao enviar webhook via POST:');
            console.error('Mensagem:', webhookError.message);
            if (webhookError.response) {
              console.error('Status:', webhookError.response.status);
              console.error('Resposta:', JSON.stringify(webhookError.response.data, null, 2));
              
              // Se o erro for 404 e mencionar GET, tentar GET como fallback
              if (webhookError.response.status === 404 && 
                  webhookError.response.data?.message?.includes('GET')) {
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
                  console.log('Tentando requisição GET com query params...');
                  
                  const getResponse = await axios.get(getUrl, { timeout: 15000 });
                  
                  console.log('✅ Webhook enviado com SUCESSO via GET!');
                  console.log('Status:', getResponse.status);
                  console.log('Resposta:', JSON.stringify(getResponse.data, null, 2));
                  webhookEnviado = true;
                } catch (getError) {
                  console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
                }
              }
            }
            if (webhookError.request && !webhookEnviado) {
              console.error('Request config:', {
                url: webhookError.config?.url,
                method: webhookError.config?.method,
                data: webhookError.config?.data
              });
            }
          }

          res.status(201).json(ensaio);
        });
      });
    }).catch((err) => {
      console.error('Erro ao verificar coluna local:', err);
      return res.status(500).json({ error: 'Erro ao verificar estrutura do banco: ' + err.message });
    });
  } catch (error) {
    console.error('Erro geral ao criar ensaio:', error);
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
});

// Listar todos os ensaios (público - apenas aprovados, recorrentes, considerando horário de 20h)
router.get('/public', (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT e.id, e.nome_encarregado, e.tipo, e.dia_semana, e.semana_mes, e.proxima_data, e.horario, e.nome_igreja, e.endereco, e.foto_local, e.status, e.instrumento, e.categoria_instrumento, e.cidade, e.estado, e.created_at, e.user_id, u.name as encarregado_name FROM ensaios e JOIN users u ON e.user_id = u.id WHERE e.status = ? ORDER BY e.proxima_data ASC, e.created_at DESC',
    ['aprovado'],
    (err, ensaios) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar ensaios' });
      }
      
      // Expandir ensaios recorrentes em múltiplas ocorrências futuras
      const ensaiosExpandidos = [];
      const chavesUnicas = new Set(); // Para evitar duplicatas
      
      const agora = new Date();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split('T')[0];
      const horaAtual = agora.getHours();
      
      console.log('=== PROCESSANDO ENSAIOS PÚBLICOS ===');
      console.log('Data de hoje:', hojeStr);
      console.log('Hora atual:', horaAtual);
      console.log('Total de ensaios aprovados:', ensaios.length);
      
      // Calcular início e fim do mês atual (usar a variável 'hoje' já declarada acima)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
      const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
      const fimProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0, 23, 59, 59);
      
      console.log('Período de busca:', {
        inicioMes: inicioMes.toISOString().split('T')[0],
        fimMes: fimMes.toISOString().split('T')[0],
        inicioProximoMes: inicioProximoMes.toISOString().split('T')[0],
        fimProximoMes: fimProximoMes.toISOString().split('T')[0]
      });
      
      ensaios.forEach(ensaio => {
        console.log(`\nEnsaio ID ${ensaio.id}:`, {
          dia_semana: ensaio.dia_semana,
          semana_mes: ensaio.semana_mes,
          proxima_data: ensaio.proxima_data,
          status: ensaio.status
        });
        
        if (ensaio.dia_semana && ensaio.semana_mes !== null && ensaio.semana_mes !== undefined) {
          // Ensaio recorrente: calcular ocorrências para o mês atual e próximo mês
          // Buscar até 2 meses à frente (sem limite de dias, apenas limite de meses)
          const ocorrencias = calcularOcorrenciasFuturas(ensaio.dia_semana, ensaio.semana_mes, 2, 999);
          console.log(`  Ocorrências calculadas:`, ocorrencias);
          
          // Primeiro, coletar todas as ocorrências do mês atual e próximo mês
          const ocorrenciasMesAtual = [];
          const ocorrenciasProximoMes = [];
          
          ocorrencias.forEach((dataOcorrencia, index) => {
            const chaveUnica = `${ensaio.id}_${dataOcorrencia}`;
            if (chavesUnicas.has(chaveUnica)) {
              return;
            }
            
            const dataOcorrenciaObj = new Date(dataOcorrencia + 'T00:00:00');
            const estaNoMesAtual = dataOcorrenciaObj >= inicioMes && dataOcorrenciaObj <= fimMes;
            const estaNoProximoMes = dataOcorrenciaObj >= inicioProximoMes && dataOcorrenciaObj <= fimProximoMes;
            
            if (estaNoMesAtual) {
              ocorrenciasMesAtual.push({ data: dataOcorrencia, index, chaveUnica });
            } else if (estaNoProximoMes) {
              ocorrenciasProximoMes.push({ data: dataOcorrencia, index, chaveUnica });
            }
          });
          
          // Verificar se há ocorrências no mês atual que ainda não passaram
          const hojeComHora = new Date();
          const horaAtual = hojeComHora.getHours();
          const hojeNormalizado = new Date();
          hojeNormalizado.setHours(0, 0, 0, 0);
          
          const ocorrenciasFuturasMesAtual = ocorrenciasMesAtual.filter(occ => {
            const dataObj = new Date(occ.data + 'T00:00:00');
            const diffDays = Math.floor((dataObj - hojeNormalizado) / (1000 * 60 * 60 * 24));
            // Se for hoje, verificar horário (só incluir se ainda não passou das 20h)
            if (diffDays === 0) {
              return horaAtual <= 20;
            }
            return diffDays > 0;
          });
          
          // Se há ocorrências futuras no mês atual, usar essas
          // Se não há, usar as do próximo mês
          const ocorrenciasParaUsar = ocorrenciasFuturasMesAtual.length > 0 
            ? ocorrenciasFuturasMesAtual 
            : ocorrenciasProximoMes;
          
          ocorrenciasParaUsar.forEach(({ data: dataOcorrencia, index, chaveUnica }) => {
            chavesUnicas.add(chaveUnica);
            
            const ensaioOcorrencia = {
              ...ensaio,
              id: `${ensaio.id}_${index}`,
              id_original: ensaio.id,
              proxima_data: dataOcorrencia
            };
            
            console.log(`  Data ${dataOcorrencia}: incluindo`);
            ensaiosExpandidos.push(ensaioOcorrencia);
          });
        } else {
          // Ensaio não recorrente: usar data única
          if (ensaio.proxima_data) {
            const chaveUnica = `${ensaio.id}_${ensaio.proxima_data}`;
            
            // Verificar se já existe esta combinação
            if (!chavesUnicas.has(chaveUnica)) {
              const dataEnsaioObj = new Date(ensaio.proxima_data + 'T00:00:00');
              const estaNoMesAtual = dataEnsaioObj >= inicioMes && dataEnsaioObj <= fimMes;
              const estaNoProximoMes = dataEnsaioObj >= inicioProximoMes && dataEnsaioObj <= fimProximoMes;
              
              // Se a data já passou (antes do início do mês atual), pular
              if (dataEnsaioObj < inicioMes) {
                console.log(`  Ensaio não recorrente - Data ${ensaio.proxima_data}: já passou, pulando`);
                return;
              }
              
              // Verificar se a data já passou (considerando horário de 20h)
              const hojeComHora = new Date();
              const horaAtual = hojeComHora.getHours();
              const hojeNormalizado = new Date();
              hojeNormalizado.setHours(0, 0, 0, 0);
              const diffDays = Math.floor((dataEnsaioObj - hojeNormalizado) / (1000 * 60 * 60 * 24));
              
              // Se está no mês atual
              if (estaNoMesAtual) {
                // Incluir se ainda não passou (ou se passou hoje mas ainda não são 20h)
                const aindaNaoPassou = diffDays > 0 || (diffDays === 0 && horaAtual <= 20);
                if (aindaNaoPassou) {
                  chavesUnicas.add(chaveUnica);
                  console.log(`  Ensaio não recorrente - Data ${ensaio.proxima_data}: mês atual, ainda não passou - incluindo`);
                  ensaiosExpandidos.push(ensaio);
                } else {
                  console.log(`  Ensaio não recorrente - Data ${ensaio.proxima_data}: mês atual, já passou - pulando`);
                }
              } 
              // Se está no próximo mês, incluir apenas se não há ensaios futuros no mês atual
              else if (estaNoProximoMes) {
                // Verificar se há outros ensaios no mês atual que ainda não passaram
                const temEnsaioFuturoMesAtual = ensaios.some(e => {
                  if (!e.proxima_data || e.id === ensaio.id) return false;
                  try {
                    const dataE = new Date(e.proxima_data + 'T00:00:00');
                    const estaNoMesAtualE = dataE >= inicioMes && dataE <= fimMes;
                    if (!estaNoMesAtualE) return false;
                    const diffDaysE = Math.floor((dataE - hojeNormalizado) / (1000 * 60 * 60 * 24));
                    return diffDaysE > 0 || (diffDaysE === 0 && horaAtual <= 20);
                  } catch {
                    return false;
                  }
                });
                
                if (!temEnsaioFuturoMesAtual) {
                  chavesUnicas.add(chaveUnica);
                  console.log(`  Ensaio não recorrente - Data ${ensaio.proxima_data}: próximo mês, sem ensaios futuros no mês atual - incluindo`);
                  ensaiosExpandidos.push(ensaio);
                } else {
                  console.log(`  Ensaio não recorrente - Data ${ensaio.proxima_data}: próximo mês, mas há ensaios futuros no mês atual - pulando`);
                }
              } else {
                console.log(`  Ensaio não recorrente - Data ${ensaio.proxima_data}: fora do período, pulando`);
              }
            }
          } else {
            console.log(`  Ensaio não recorrente sem proxima_data`);
          }
        }
      });
      
      console.log(`\nTotal de ensaios expandidos: ${ensaiosExpandidos.length}`);
      
      // Ordenar por data
      ensaiosExpandidos.sort((a, b) => {
        if (!a.proxima_data) return 1;
        if (!b.proxima_data) return -1;
        return new Date(a.proxima_data) - new Date(b.proxima_data);
      });
      
      // Remover campos sensíveis (celular e email) antes de enviar
      const ensaiosSeguros = ensaiosExpandidos.map(ensaio => {
        const { celular, ...ensaioSemCelular } = ensaio;
        return ensaioSemCelular;
      });
      
      res.json(ensaiosSeguros);
    }
  );
});

// Listar ensaios do usuário logado (encarregado)
router.get('/meus', authenticate, requireEncarregado, (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT * FROM ensaios WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, ensaios) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar ensaios' });
      }
      
      // Garantir que ensaios com dia_semana e semana_mes tenham proxima_data calculada
      // Sempre recalcular para garantir que está atualizada
      console.log(`[ROUTE /meus] Processando ${ensaios.length} ensaios`);
      
      const ensaiosComData = ensaios.map(ensaio => {
        console.log(`[ROUTE /meus] Ensaio ${ensaio.id} ANTES:`, {
          dia_semana: ensaio.dia_semana,
          semana_mes: ensaio.semana_mes,
          proxima_data: ensaio.proxima_data,
          tipo_proxima_data: typeof ensaio.proxima_data,
          isDate: ensaio.proxima_data instanceof Date
        });
        
        // Se o ensaio tem dia_semana e semana_mes, sempre recalcular a próxima data
        if (ensaio.dia_semana && ensaio.semana_mes !== null && ensaio.semana_mes !== undefined) {
          // Normalizar dia_semana para minúsculas (pode vir com capitalização diferente)
          const diaSemanaNormalizado = ensaio.dia_semana.toLowerCase();
          const novaProximaData = calcularProximaData(diaSemanaNormalizado, parseInt(ensaio.semana_mes));
          
          console.log(`[ROUTE /meus] Ensaio ${ensaio.id}: dia_semana="${ensaio.dia_semana}" -> "${diaSemanaNormalizado}", semana_mes=${ensaio.semana_mes}, calculado="${novaProximaData}"`);
          
          if (novaProximaData) {
            // Atualizar no banco de dados (assíncrono, mas não bloqueia a resposta)
            db.run(
              'UPDATE ensaios SET proxima_data = ? WHERE id = ?',
              [novaProximaData, ensaio.id],
              (updateErr) => {
                if (updateErr) {
                  console.error('Erro ao atualizar proxima_data:', updateErr);
                } else {
                  console.log(`✅ Próxima data atualizada para ensaio ${ensaio.id}: ${novaProximaData}`);
                }
              }
            );
            // Atualizar o objeto que será retornado (garantir formato string YYYY-MM-DD)
            ensaio.proxima_data = novaProximaData;
          } else {
            console.warn(`⚠️ Não foi possível calcular proxima_data para ensaio ${ensaio.id} (dia_semana: "${ensaio.dia_semana}", semana_mes: ${ensaio.semana_mes})`);
          }
        } else {
          console.log(`[ROUTE /meus] Ensaio ${ensaio.id}: sem dia_semana ou semana_mes (dia_semana: ${ensaio.dia_semana}, semana_mes: ${ensaio.semana_mes})`);
        }
        
        // Garantir que proxima_data seja sempre string YYYY-MM-DD se existir
        if (ensaio.proxima_data) {
          if (ensaio.proxima_data instanceof Date) {
            const ano = ensaio.proxima_data.getFullYear();
            const mes = String(ensaio.proxima_data.getMonth() + 1).padStart(2, '0');
            const dia = String(ensaio.proxima_data.getDate()).padStart(2, '0');
            ensaio.proxima_data = `${ano}-${mes}-${dia}`;
            console.log(`[ROUTE /meus] Normalizado Date para string no ensaio ${ensaio.id}: ${ensaio.proxima_data}`);
          } else if (typeof ensaio.proxima_data === 'string' && (ensaio.proxima_data.includes('T') || ensaio.proxima_data.includes(' '))) {
            const dataObj = new Date(ensaio.proxima_data);
            if (!isNaN(dataObj.getTime())) {
              const ano = dataObj.getFullYear();
              const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
              const dia = String(dataObj.getDate()).padStart(2, '0');
              ensaio.proxima_data = `${ano}-${mes}-${dia}`;
              console.log(`[ROUTE /meus] Normalizado ISO string para YYYY-MM-DD no ensaio ${ensaio.id}: ${ensaio.proxima_data}`);
            }
          }
        }
        
        console.log(`[ROUTE /meus] Ensaio ${ensaio.id} DEPOIS:`, {
          dia_semana: ensaio.dia_semana,
          semana_mes: ensaio.semana_mes,
          proxima_data: ensaio.proxima_data,
          tipo_proxima_data: typeof ensaio.proxima_data
        });
        
        return ensaio;
      });
      
      console.log(`[ROUTE /meus] Retornando ${ensaiosComData.length} ensaios. Proximas datas:`, ensaiosComData.map(e => ({ id: e.id, nome_igreja: e.nome_igreja, proxima_data: e.proxima_data, tipo: typeof e.proxima_data })));
      
      res.json(ensaiosComData);
    }
  );
});

// Listar todos os ensaios pendentes (admin)
router.get('/pendentes', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT e.*, u.name as encarregado_name, u.email as encarregado_email FROM ensaios e JOIN users u ON e.user_id = u.id WHERE e.status = ? ORDER BY e.created_at DESC',
    ['pendente'],
    (err, ensaios) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar ensaios pendentes' });
      }
      res.json(ensaios);
    }
  );
});

// Listar todos os ensaios (admin - dashboard completo)
router.get('/todos', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  
  db.all(
    'SELECT e.*, u.name as encarregado_name, u.email as encarregado_email FROM ensaios e JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC',
    [],
    (err, ensaios) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar ensaios' });
      }
      res.json(ensaios);
    }
  );
});

// Estatísticas de igrejas por localidade e estado (admin)
router.get('/estatisticas', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  
  // Estatísticas por cidade
  db.all(
    `SELECT cidade, COUNT(*) as total, 
     ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ensaios WHERE cidade IS NOT NULL AND cidade != ''), 2) as porcentagem
     FROM ensaios 
     WHERE cidade IS NOT NULL AND cidade != '' 
     GROUP BY cidade 
     ORDER BY total DESC`,
    [],
    (err, porCidade) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar estatísticas por cidade' });
      }
      
      // Estatísticas por estado
      db.all(
        `SELECT estado, COUNT(*) as total, 
         ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ensaios WHERE estado IS NOT NULL AND estado != ''), 2) as porcentagem
         FROM ensaios 
         WHERE estado IS NOT NULL AND estado != '' 
         GROUP BY estado 
         ORDER BY total DESC`,
        [],
        (err, porEstado) => {
          if (err) {
            return res.status(500).json({ error: 'Erro ao buscar estatísticas por estado' });
          }
          
          // Estatísticas por categoria de instrumento (naipes) - sem duplicar (dedupe por celular; fallback user_id)
          // Regra: se a mesma pessoa aparecer como músico/encarregado e/ou em múltiplos ensaios, conta 1x.
          db.all(
            `SELECT categoria_instrumento as naipe,
                    COUNT(*) as total,
                    ROUND(COUNT(*) * 100.0 / (
                      SELECT COUNT(*) FROM (
                        SELECT pessoa_key, categoria_instrumento
                        FROM (
                          SELECT
                            pessoa_key,
                            COALESCE(
                              MAX(CASE WHEN fonte = 'user' THEN categoria_instrumento END),
                              MAX(CASE WHEN fonte = 'ensaio' THEN categoria_instrumento END)
                            ) AS categoria_instrumento
                          FROM (
                            SELECT
                              CASE
                                WHEN u.celular IS NOT NULL AND u.celular != ''
                                  THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                                ELSE CONCAT('user:', u.id)
                              END AS pessoa_key,
                              u.categoria_instrumento,
                              'user' AS fonte
                            FROM users u
                            WHERE u.role IN ('musico','encarregado')
                              AND u.categoria_instrumento IS NOT NULL AND u.categoria_instrumento != ''

                            UNION ALL

                            SELECT
                              CASE
                                WHEN e.celular IS NOT NULL AND e.celular != ''
                                  THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(e.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                                ELSE CONCAT('user:', e.user_id)
                              END AS pessoa_key,
                              e.categoria_instrumento,
                              'ensaio' AS fonte
                            FROM ensaios e
                            WHERE e.categoria_instrumento IS NOT NULL AND e.categoria_instrumento != ''
                          ) src
                          GROUP BY pessoa_key
                        ) picked
                        WHERE categoria_instrumento IS NOT NULL AND categoria_instrumento != ''
                      ) y
                    ), 2) AS porcentagem
             FROM (
               SELECT pessoa_key,
                      COALESCE(
                        MAX(CASE WHEN fonte = 'user' THEN categoria_instrumento END),
                        MAX(CASE WHEN fonte = 'ensaio' THEN categoria_instrumento END)
                      ) AS categoria_instrumento
               FROM (
                 SELECT
                   CASE
                     WHEN u.celular IS NOT NULL AND u.celular != ''
                       THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                     ELSE CONCAT('user:', u.id)
                   END AS pessoa_key,
                   u.categoria_instrumento,
                   'user' AS fonte
                 FROM users u
                 WHERE u.role IN ('musico','encarregado')
                   AND u.categoria_instrumento IS NOT NULL AND u.categoria_instrumento != ''

                 UNION ALL

                 SELECT
                   CASE
                     WHEN e.celular IS NOT NULL AND e.celular != ''
                       THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(e.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                     ELSE CONCAT('user:', e.user_id)
                   END AS pessoa_key,
                   e.categoria_instrumento,
                   'ensaio' AS fonte
                 FROM ensaios e
                 WHERE e.categoria_instrumento IS NOT NULL AND e.categoria_instrumento != ''
               ) src
               GROUP BY pessoa_key
             ) t
             WHERE categoria_instrumento IS NOT NULL AND categoria_instrumento != ''
             GROUP BY categoria_instrumento
             ORDER BY total DESC`,
            [],
            (err, porNaipe) => {
              if (err) {
                return res.status(500).json({ error: 'Erro ao buscar estatísticas por naipes' });
              }
              
              // Estatísticas por instrumento específico - sem duplicar (dedupe por celular; fallback user_id)
              db.all(
                `SELECT instrumento,
                        categoria_instrumento,
                        COUNT(*) as total,
                        ROUND(COUNT(*) * 100.0 / (
                          SELECT COUNT(*) FROM (
                            SELECT pessoa_key,
                                   COALESCE(
                                     MAX(CASE WHEN fonte = 'user' THEN instrumento END),
                                     MAX(CASE WHEN fonte = 'ensaio' THEN instrumento END)
                                   ) AS instrumento
                            FROM (
                              SELECT
                                CASE
                                  WHEN u.celular IS NOT NULL AND u.celular != ''
                                    THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                                  ELSE CONCAT('user:', u.id)
                                END AS pessoa_key,
                                u.instrumento,
                                'user' AS fonte
                              FROM users u
                              WHERE u.role IN ('musico','encarregado')
                                AND u.instrumento IS NOT NULL AND u.instrumento != ''

                              UNION ALL

                              SELECT
                                CASE
                                  WHEN e.celular IS NOT NULL AND e.celular != ''
                                    THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(e.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                                  ELSE CONCAT('user:', e.user_id)
                                END AS pessoa_key,
                                e.instrumento,
                                'ensaio' AS fonte
                              FROM ensaios e
                              WHERE e.instrumento IS NOT NULL AND e.instrumento != ''
                            ) src
                            GROUP BY pessoa_key
                          ) y
                          WHERE instrumento IS NOT NULL AND instrumento != ''
                        ), 2) AS porcentagem
                 FROM (
                   SELECT
                     pessoa_key,
                     COALESCE(
                       MAX(CASE WHEN fonte = 'user' THEN instrumento END),
                       MAX(CASE WHEN fonte = 'ensaio' THEN instrumento END)
                     ) AS instrumento,
                     COALESCE(
                       MAX(CASE WHEN fonte = 'user' THEN categoria_instrumento END),
                       MAX(CASE WHEN fonte = 'ensaio' THEN categoria_instrumento END)
                     ) AS categoria_instrumento
                   FROM (
                     SELECT
                       CASE
                         WHEN u.celular IS NOT NULL AND u.celular != ''
                           THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(u.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                         ELSE CONCAT('user:', u.id)
                       END AS pessoa_key,
                       u.instrumento,
                       u.categoria_instrumento,
                       'user' AS fonte
                     FROM users u
                     WHERE u.role IN ('musico','encarregado')
                       AND u.instrumento IS NOT NULL AND u.instrumento != ''

                     UNION ALL

                     SELECT
                       CASE
                         WHEN e.celular IS NOT NULL AND e.celular != ''
                           THEN REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(e.celular,'(',''),')',''),' ',''),'-',''),'+',''),'.','')
                         ELSE CONCAT('user:', e.user_id)
                       END AS pessoa_key,
                       e.instrumento,
                       e.categoria_instrumento,
                       'ensaio' AS fonte
                     FROM ensaios e
                     WHERE e.instrumento IS NOT NULL AND e.instrumento != ''
                   ) src
                   GROUP BY pessoa_key
                 ) t
                 WHERE instrumento IS NOT NULL AND instrumento != ''
                 GROUP BY instrumento, categoria_instrumento
                 ORDER BY total DESC`,
                [],
                (err, porInstrumento) => {
                  if (err) {
                    return res.status(500).json({ error: 'Erro ao buscar estatísticas por instrumentos' });
                  }
                  
                  // Estatísticas de usuários e ensaios (totais e por status)
                  db.get(`SELECT COUNT(*) as total FROM users WHERE role = 'musico'`, [], (err, musicosTotalRow) => {
                    const totalMusicos = err ? 0 : (musicosTotalRow?.total || 0);

                    db.get(`SELECT COUNT(*) as total FROM users WHERE role = 'musico' AND aprovado = 1`, [], (err, musicosAprovRow) => {
                      const musicosAprovados = err ? 0 : (musicosAprovRow?.total || 0);
                      const musicosPendentes = Math.max(0, totalMusicos - musicosAprovados);

                      db.get(`SELECT COUNT(*) as total FROM users WHERE role = 'encarregado'`, [], (err, encTotalRow) => {
                        const totalEncarregados = err ? 0 : (encTotalRow?.total || 0);

                        db.get(`SELECT COUNT(*) as total FROM users WHERE role = 'encarregado' AND aprovado = 1`, [], (err, encAprovRow) => {
                          const encarregadosAprovados = err ? 0 : (encAprovRow?.total || 0);
                          const encarregadosPendentes = Math.max(0, totalEncarregados - encarregadosAprovados);

                          db.get(`SELECT COUNT(*) as total FROM users WHERE role = 'encarregado' AND tipo = 'local'`, [], (err, encLocRow) => {
                            const encarregadosLocais = err ? 0 : (encLocRow?.total || 0);

                            db.get(`SELECT COUNT(*) as total FROM users WHERE role = 'encarregado' AND tipo = 'regional'`, [], (err, encRegRow) => {
                              const encarregadosRegionais = err ? 0 : (encRegRow?.total || 0);

                              // Ensaios
                              db.get(`SELECT COUNT(*) as total FROM ensaios`, [], (err, ensTotalRow) => {
                                const totalEnsaios = err ? 0 : (ensTotalRow?.total || 0);

                                db.get(`SELECT COUNT(*) as total FROM ensaios WHERE status = 'aprovado'`, [], (err, ensAprovRow) => {
                                  const ensaiosAprovados = err ? 0 : (ensAprovRow?.total || 0);

                                  db.get(`SELECT COUNT(*) as total FROM ensaios WHERE status = 'pendente'`, [], (err, ensPendRow) => {
                                    const ensaiosPendentes = err ? 0 : (ensPendRow?.total || 0);

                                    res.json({
                                      porCidade: porCidade || [],
                                      porEstado: porEstado || [],
                                      porNaipe: porNaipe || [],
                                      porInstrumento: porInstrumento || [],
                                      usuarios: {
                                        // Mantém compatibilidade: agora total inclui pendentes também (corrige “recentes”)
                                        totalMusicos,
                                        totalEncarregados,
                                        encarregadosLocais,
                                        encarregadosRegionais,
                                        // Novos detalhamentos
                                        musicosAprovados,
                                        musicosPendentes,
                                        encarregadosAprovados,
                                        encarregadosPendentes
                                      },
                                      ensaios: {
                                        total: totalEnsaios,
                                        aprovados: ensaiosAprovados,
                                        pendentes: ensaiosPendentes
                                      }
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Cancelar ensaio (mudar status para cancelado)
router.patch('/:id/cancelar', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  db.run(
    'UPDATE ensaios SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['cancelado', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao cancelar ensaio' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ensaio não encontrado' });
      }

      res.json({ message: 'Ensaio cancelado com sucesso' });
    }
  );
});

// Aprovar ou rejeitar ensaio (admin)
router.patch('/:id/status', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDb();

  if (!status || !['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ error: 'Status deve ser "aprovado" ou "rejeitado"' });
  }

  db.run(
    'UPDATE ensaios SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Ensaio não encontrado' });
      }

      db.get('SELECT * FROM ensaios WHERE id = ?', [id], async (err, ensaio) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao buscar ensaio atualizado' });
        }
        
        // Enviar webhook de aprovação/rejeição apenas se for aprovação
        if (status === 'aprovado') {
          try {
            // Buscar dados do encarregado
            db.get('SELECT * FROM users WHERE id = ?', [ensaio.user_id], async (err, encarregado) => {
              if (err) {
                console.error('Erro ao buscar encarregado para webhook:', err);
              }
              
              const webhookData = {
                tipo: 'aprovacao_ensaio',
                id: ensaio.id,
                nome_encarregado: ensaio.nome_encarregado || encarregado?.name || null,
                tipo: ensaio.tipo || null,
                celular: ensaio.celular || encarregado?.celular || null,
                dia_semana: ensaio.dia_semana || null,
                semana_mes: ensaio.semana_mes || null,
                horario: ensaio.horario || null,
                nome_igreja: ensaio.nome_igreja || null,
                endereco: ensaio.endereco || null,
                cidade: ensaio.cidade || null,
                estado: ensaio.estado || null,
                instrumento: ensaio.instrumento || null,
                categoria_instrumento: ensaio.categoria_instrumento || null,
                foto_local: ensaio.foto_local || null,
                status: 'aprovado',
                aprovado_em: new Date().toISOString(),
                created_at: ensaio.created_at,
                user_id: ensaio.user_id,
                encarregado_email: encarregado?.email || null
              };

              console.log('=== ENVIANDO WEBHOOK - APROVAÇÃO DE ENSAIO ===');
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
                
                console.log('✅ Webhook de aprovação de ensaio enviado com SUCESSO via POST!');
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
                    
                    console.log('✅ Webhook de aprovação de ensaio enviado com SUCESSO via GET!');
                    webhookEnviado = true;
                  } catch (getError) {
                    console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
                  }
                }
              }
            });
          } catch (webhookErr) {
            // Não bloquear a resposta se o webhook falhar
            console.error('❌ Erro ao processar webhook de aprovação de ensaio:', webhookErr.message);
          }
        }
        
        res.json(ensaio);
      });
    }
  );
});

// Atualizar ensaio (apenas o dono)
router.put('/:id', authenticate, requireEncarregado, upload.single('foto'), (req, res) => {
  const { id } = req.params;
    const { nome_encarregado, tipo, celular, dia_semana, semana_mes, horario, nome_igreja, endereco, cidade, estado, instrumento, categoria_instrumento } = req.body;
    const db = getDb();

    // Verificar se o ensaio pertence ao usuário
    db.get('SELECT * FROM ensaios WHERE id = ?', [id], (err, ensaio) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao buscar ensaio' });
      }

      if (!ensaio) {
        return res.status(404).json({ error: 'Ensaio não encontrado' });
      }

      if (ensaio.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Você não tem permissão para editar este ensaio' });
      }

      const foto_local = req.file ? `/uploads/${req.file.filename}` : ensaio.foto_local;
      const semanaMesNum = semana_mes ? parseInt(semana_mes) : null;
      const proxima_data = calcularProximaData(dia_semana, semanaMesNum);

      // Verificar se a coluna 'local' existe (compatibilidade com banco antigo)
      checkLocalColumn(db).then((hasLocalColumn) => {
        let updateQuery, updateValues;
        
        if (hasLocalColumn) {
          // Se a coluna 'local' existir, incluir ela na atualização
          updateQuery = 'UPDATE ensaios SET nome_encarregado = ?, tipo = ?, celular = ?, dia_semana = ?, semana_mes = ?, proxima_data = ?, horario = ?, nome_igreja = ?, endereco = ?, cidade = ?, estado = ?, instrumento = ?, categoria_instrumento = ?, local = ?, foto_local = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          updateValues = [nome_encarregado, tipo, celular, dia_semana || null, semanaMesNum, proxima_data, horario, nome_igreja, endereco, cidade || null, estado || null, instrumento || null, categoria_instrumento || null, nome_igreja, foto_local, 'pendente', id];
        } else {
          // Se não tiver a coluna 'local', usar a query normal
          updateQuery = 'UPDATE ensaios SET nome_encarregado = ?, tipo = ?, celular = ?, dia_semana = ?, semana_mes = ?, proxima_data = ?, horario = ?, nome_igreja = ?, endereco = ?, cidade = ?, estado = ?, instrumento = ?, categoria_instrumento = ?, foto_local = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
          updateValues = [nome_encarregado, tipo, celular, dia_semana || null, semanaMesNum, proxima_data, horario, nome_igreja, endereco, cidade || null, estado || null, instrumento || null, categoria_instrumento || null, foto_local, 'pendente', id];
        }

        db.run(updateQuery, updateValues, function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar ensaio: ' + err.message });
          }

          db.get('SELECT * FROM ensaios WHERE id = ?', [id], (err, updatedEnsaio) => {
            if (err) {
              return res.status(500).json({ error: 'Erro ao buscar ensaio atualizado' });
            }
            res.json(updatedEnsaio);
          });
        });
      });
    });
});

// Deletar ensaio (apenas o dono ou admin)
router.delete('/:id', authenticate, requireEncarregado, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  db.get('SELECT * FROM ensaios WHERE id = ?', [id], (err, ensaio) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar ensaio' });
    }

    if (!ensaio) {
      return res.status(404).json({ error: 'Ensaio não encontrado' });
    }

    if (ensaio.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Você não tem permissão para deletar este ensaio' });
    }

    // Deletar foto se existir
    if (ensaio.foto_local) {
      const fotoPath = path.join(__dirname, '..', ensaio.foto_local);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    db.run('DELETE FROM ensaios WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar ensaio' });
      }
      res.json({ message: 'Ensaio deletado com sucesso' });
    });
  });
});

// =====================================================
// ENDPOINT: Buscar ensaio do dia atual por telefone
// =====================================================
// GET /api/ensaio/por-telefone/:telefone
// 
// Descrição:
// Endpoint para integração com n8n + WhatsApp que identifica
// automaticamente se um músico possui ensaio no dia atual,
// baseado no número de telefone.
//
// Funciona em ambiente local e produção:
// - LOCAL: http://localhost:5000/api/ensaio/por-telefone/{telefone}
// - PRODUÇÃO: https://partiuensaio.automatizeonline.com.br/api/ensaio/por-telefone/{telefone}
//
// Parâmetros:
// - telefone: Número de telefone (qualquer formato aceito)
//   Exemplos: "5511974605594", "(11) 97460-5594", "11974605594"
//
// Resposta de sucesso (200):
// {
//   "ensaio_id": 123,
//   "titulo": "Igreja Central",
//   "horario": "20:00",
//   "data": "2024-01-15"
// }
//
// Resposta quando não houver ensaio (404):
// {
//   "message": "Nenhum ensaio encontrado para hoje"
// }
//
// Observação:
// Este endpoint será consumido por fluxos n8n para confirmação
// de presença via WhatsApp. Não altera lógica de presença.
// =====================================================
router.get('/por-telefone/:telefone', async (req, res) => {
  try {
    const { telefone } = req.params;
    const ensaiosController = require('../controllers/ensaiosController');

    // Buscar ensaio do dia atual pelo telefone
    const ensaio = await ensaiosController.buscarEnsaioPorTelefone(telefone);

    if (!ensaio) {
      // Retornar objeto vazio (não erro 404) para facilitar integração n8n
      return res.status(200).json({});
    }

    // Retornar ensaio encontrado
    res.status(200).json(ensaio);
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Erro no endpoint /por-telefone:', error);
    
    // Retornar objeto vazio (não erro 500) para facilitar integração n8n
    return res.status(200).json({});
  }
});

module.exports = router;
