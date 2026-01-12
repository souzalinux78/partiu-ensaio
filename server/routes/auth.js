const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { getDb } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'seu_secret_key_aqui_mude_em_producao';
const WEBHOOK_URL = 'https://webhook.automatizeonline.com.br/webhook/cadastro-ensaio';

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  console.log('=== TENTATIVA DE LOGIN ===');
  console.log('Email:', email);
  console.log('Senha recebida:', password ? '***' : 'VAZIA');

  if (!email || !password) {
    console.error('❌ Email ou senha não fornecidos');
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      console.error('❌ Erro ao buscar usuário:', err);
      return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }

    if (!user) {
      console.error('❌ Usuário não encontrado:', email);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      aprovado: user.aprovado
    });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('❌ Erro ao verificar senha:', err);
        return res.status(500).json({ error: 'Erro ao verificar senha' });
      }

      if (!isMatch) {
        console.error('❌ Senha incorreta para:', email);
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      console.log('✅ Senha correta!');

      // Verificar se músico ou encarregado está aprovado (admin sempre pode fazer login)
      if ((user.role === 'musico' || user.role === 'encarregado') && user.aprovado !== 1) {
        console.error('❌ Usuário não aprovado:', email, 'Role:', user.role, 'Aprovado:', user.aprovado);
        return res.status(403).json({ 
          error: 'Sua conta ainda não foi aprovada pelo administrador. Aguarde a aprovação.' 
        });
      }

      console.log('✅ Login autorizado, gerando token...');

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('✅ Login realizado com sucesso para:', email, 'Role:', user.role);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          aprovado: user.aprovado
        }
      });
    });
  });
});

// Registrar novo usuário (encarregado - requer aprovação)
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  const db = getDb();

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar usuário' });
    }

    // Só considerar email duplicado se o usuário existir E estiver aprovado
    // Usuários rejeitados ou pendentes podem se cadastrar novamente
    if (existingUser && existingUser.aprovado === 1) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Se o usuário existe mas não está aprovado, deletar para permitir novo cadastro
    if (existingUser && existingUser.aprovado !== 1) {
      console.log(`Usuário ${email} existe mas não está aprovado. Deletando para permitir novo cadastro...`);
      db.run('DELETE FROM users WHERE email = ? AND aprovado != 1', [email], (deleteErr) => {
        if (deleteErr) {
          console.error('Erro ao deletar usuário não aprovado:', deleteErr);
          return res.status(500).json({ error: 'Erro ao processar cadastro' });
        }
        console.log(`Usuário ${email} não aprovado foi deletado para permitir novo cadastro`);
        // Continuar com o cadastro após deletar
        continueRegistration();
      });
      return; // Aguardar a deleção antes de continuar
    }
    
    // Se não existe usuário, continuar com o cadastro normalmente
    continueRegistration();
    
    function continueRegistration() {
      bcrypt.hash(password, 10, async (err, hash) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao criar senha' });
        }

      // Encarregados começam com aprovado = 0 (pendente)
      db.run(
        'INSERT INTO users (email, password, name, role, aprovado) VALUES (?, ?, ?, ?, ?)',
        [email, hash, name, 'encarregado', 0],
        async function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao criar usuário' });
          }

          const userId = this.lastID;

          // Preparar dados para o webhook
          const webhookData = {
            tipo: 'cadastro_encarregado',
            id: userId,
            email: email,
            name: name,
            role: 'encarregado',
            aprovado: false,
            created_at: new Date().toISOString()
          };

          // Enviar dados para o webhook - AGUARDAR antes de retornar resposta
          let webhookEnviado = false;
          
          // Tentar POST primeiro
          try {
            console.log('=== ENVIANDO WEBHOOK - CADASTRO ENCARREGADO ===');
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

          res.status(201).json({
            message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.',
            user: {
              id: this.lastID,
              email,
              name,
              role: 'encarregado',
              aprovado: 0
            }
          });
        }
      );
      });
    }
  });
});

// Registrar novo músico (requer aprovação)
router.post('/register-musico', async (req, res) => {
  console.log('=== RECEBENDO CADASTRO DE MÚSICO ===');
  console.log('Body recebido:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  const { email, password, name, instrumento, categoria_instrumento, celular, cidade, estado } = req.body;
  const db = getDb();

  console.log('Campos extraídos:', { email, name, instrumento, categoria_instrumento, celular, cidade, estado });

  if (!email || !password || !name) {
    console.error('❌ Validação falhou: campos obrigatórios ausentes');
    console.error('Email:', email ? 'OK' : 'FALTANDO');
    console.error('Password:', password ? 'OK' : 'FALTANDO');
    console.error('Name:', name ? 'OK' : 'FALTANDO');
    return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
  }

  console.log('✅ Validação passou, verificando email existente...');

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar usuário' });
    }

    // Só considerar email duplicado se o usuário existir E estiver aprovado
    // Usuários rejeitados ou pendentes podem se cadastrar novamente
    if (existingUser && existingUser.aprovado === 1) {
      console.error('❌ Email já cadastrado e aprovado:', email);
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Se o usuário existe mas não está aprovado, deletar para permitir novo cadastro
    if (existingUser && existingUser.aprovado !== 1) {
      console.log(`Usuário ${email} existe mas não está aprovado. Deletando para permitir novo cadastro...`);
      db.run('DELETE FROM users WHERE email = ? AND aprovado != 1', [email], (deleteErr) => {
        if (deleteErr) {
          console.error('Erro ao deletar usuário não aprovado:', deleteErr);
          return res.status(500).json({ error: 'Erro ao processar cadastro' });
        }
        console.log(`Usuário ${email} não aprovado foi deletado para permitir novo cadastro`);
        // Continuar com o cadastro após deletar
        continueRegistration();
      });
      return; // Aguardar a deleção antes de continuar
    }
    
    // Se não existe usuário, continuar com o cadastro normalmente
    continueRegistration();
    
    function continueRegistration() {
      console.log('✅ Email disponível, criando hash da senha...');
      bcrypt.hash(password, 10, async (err, hash) => {
      if (err) {
        console.error('❌ Erro ao criar hash da senha:', err);
        return res.status(500).json({ error: 'Erro ao criar senha' });
      }

      // Músicos começam com aprovado = 0 (pendente)
      // MySQL já tem todas as colunas no schema, não precisa verificar
      console.log('✅ Hash criado, preparando INSERT...');
      
      // MySQL tem todas as colunas, usar INSERT completo
      const insertQuery = 'INSERT INTO users (email, password, name, role, aprovado, instrumento, categoria_instrumento, celular, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const insertValues = [
        email, 
        hash, 
        name, 
        'musico', 
        0,
        instrumento || null,
        categoria_instrumento || null,
        celular || null,
        cidade || null,
        estado || null
      ];
      
      db.run(insertQuery, insertValues, async function(err) {
        if (err) {
          console.error('❌ Erro ao inserir usuário músico:', err);
          return res.status(500).json({ error: 'Erro ao criar usuário: ' + err.message });
        }
        
        // Buscar usuário criado
        db.get('SELECT id, email, name, role, aprovado, instrumento, categoria_instrumento, celular, cidade, estado FROM users WHERE id = ?', [this.lastID], async (err, newUser) => {
          if (err) {
            console.error('❌ Erro ao buscar usuário criado:', err);
            return res.status(500).json({ error: 'Erro ao buscar usuário criado' });
          }
          
          // Preparar dados para webhook
          const webhookData = {
            tipo: 'cadastro_musico',
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            instrumento: newUser.instrumento,
            categoria_instrumento: newUser.categoria_instrumento,
            celular: newUser.celular,
            cidade: newUser.cidade,
            estado: newUser.estado,
            role: 'musico',
            aprovado: false,
            created_at: new Date().toISOString()
          };
          
          // Enviar webhook
          let webhookEnviado = false;
          try {
            console.log('=== INICIANDO ENVIO WEBHOOK - CADASTRO MÚSICO ===');
            console.log('URL:', WEBHOOK_URL);
            console.log('Dados:', JSON.stringify(webhookData, null, 2));
            
            const response = await axios.post(WEBHOOK_URL, webhookData, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 15000
            });
            
            console.log('✅ Webhook enviado com SUCESSO via POST!');
            webhookEnviado = true;
          } catch (webhookError) {
            console.error('❌ ERRO ao enviar webhook via POST:', webhookError.message);
            
            if (webhookError.response?.status === 404 && 
                webhookError.response?.data?.message?.includes('GET')) {
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
                console.log('✅ Webhook enviado com SUCESSO via GET!');
                webhookEnviado = true;
              } catch (getError) {
                console.error('❌ ERRO ao enviar webhook via GET:', getError.message);
              }
            }
          }
          
          res.status(201).json({
            message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.',
            user: {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: 'musico',
              aprovado: 0
            }
          });
        });
      });
    }
  });
});

module.exports = router;
