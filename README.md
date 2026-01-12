# Partiu Ensaio - Agenda Musical

Aplicativo de agenda musical para gerenciamento de ensaios de orquestra, com funcionalidades para administradores e encarregados de orquestra.

## 🎯 Funcionalidades

### Para Encarregados de Orquestra
- **Dashboard pessoal** para gerenciar seus ensaios
- **Cadastro de ensaios** com informações detalhadas:
  - Dia da semana (ex: toda segunda-feira)
  - Horário
  - Local (nome da igreja)
  - Foto do local
  - Observações adicionais
- Visualização do status dos ensaios (Pendente, Aprovado, Rejeitado)

### Para Administradores
- **Dashboard administrativo** para gerenciar aprovações
- **Aprovar ou rejeitar** ensaios cadastrados pelos encarregados
- Visualização de todos os ensaios pendentes com informações do encarregado

### Para Usuários Públicos
- **Visualização de ensaios aprovados** organizados por dia da semana
- Interface pública sem necessidade de login
- Acesso fácil à programação dos ensaios

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** com Express
- **SQLite** para banco de dados
- **JWT** para autenticação
- **Multer** para upload de imagens
- **bcryptjs** para hash de senhas

### Frontend
- **React** com React Router
- **Axios** para requisições HTTP
- CSS puro para estilização

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos para instalação

1. **Clone o repositório ou navegue até a pasta do projeto**

2. **Instale as dependências de todos os módulos:**
   ```bash
   npm run install-all
   ```

   Ou instale manualmente:
   ```bash
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

3. **Configure as variáveis de ambiente (opcional):**
   
   Crie um arquivo `.env` na pasta `server/`:
   ```
   PORT=5000
   JWT_SECRET=seu_secret_key_aqui_mude_em_producao
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

   Isso iniciará:
   - Backend na porta 5000 (http://localhost:5000)
   - Frontend na porta 3000 (http://localhost:3000)

   Ou inicie separadamente:
   ```bash
   # Terminal 1 - Backend
   npm run server

   # Terminal 2 - Frontend
   npm run client
   ```

## 👤 Credenciais Padrão

Após a primeira execução, um usuário administrador é criado automaticamente:

- **Email:** admin@partiuensaio.com
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere essas credenciais em produção!

## 📱 Como Usar

### Para Encarregados

1. Acesse a aplicação e clique em "Cadastrar"
2. Crie sua conta com email e senha
3. Faça login no sistema
4. No dashboard, clique em "Novo Ensaio"
5. Preencha as informações:
   - Selecione o dia da semana
   - Informe o horário
   - Digite o nome do local (igreja)
   - (Opcional) Faça upload de uma foto do local
   - (Opcional) Adicione observações
6. Clique em "Salvar Ensaio"
7. Aguarde a aprovação do administrador

### Para Administradores

1. Faça login com as credenciais de administrador
2. No dashboard administrativo, visualize todos os ensaios pendentes
3. Para cada ensaio, você pode:
   - **Aprovar:** O ensaio ficará visível para todos os usuários
   - **Rejeitar:** O ensaio será marcado como rejeitado
4. Os ensaios aprovados aparecerão na página pública

### Para Usuários Públicos

1. Acesse a página inicial (sem necessidade de login)
2. Visualize todos os ensaios aprovados organizados por dia da semana
3. Veja informações como local, horário, encarregado e foto do local

## 📁 Estrutura do Projeto

```
PartiuEnsaio/
├── server/                 # Backend API
│   ├── routes/            # Rotas da API
│   │   ├── auth.js       # Autenticação
│   │   ├── ensaio.js     # CRUD de ensaios
│   │   └── user.js       # Perfil de usuário
│   ├── middleware/       # Middlewares
│   │   └── auth.js       # Autenticação e autorização
│   ├── uploads/          # Fotos dos locais (criado automaticamente)
│   ├── database.js       # Configuração do banco de dados
│   ├── index.js          # Servidor principal
│   └── package.json
├── client/                # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── DashboardEncarregado.js
│   │   │   ├── DashboardAdmin.js
│   │   │   └── EnsaiosPublicos.js
│   │   ├── utils/        # Utilitários
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Segurança

- Senhas são hasheadas usando bcrypt
- Autenticação via JWT tokens
- Middleware de autenticação protege rotas sensíveis
- Validação de permissões por role (admin/encarregado)
- Upload de imagens validado (apenas tipos permitidos)

## 🛠️ Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Inicia backend e frontend simultaneamente
- `npm run server` - Inicia apenas o backend
- `npm run client` - Inicia apenas o frontend
- `npm run install-all` - Instala dependências de todos os módulos

### Banco de Dados

O banco de dados SQLite é criado automaticamente na primeira execução. O arquivo `database.sqlite` será gerado na pasta `server/`.

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro de novo usuário

### Ensaios
- `GET /api/ensaio/public` - Listar ensaios aprovados (público)
- `GET /api/ensaio/meus` - Listar meus ensaios (autenticado)
- `GET /api/ensaio/pendentes` - Listar ensaios pendentes (admin)
- `POST /api/ensaio` - Criar novo ensaio (encarregado)
- `PATCH /api/ensaio/:id/status` - Aprovar/rejeitar ensaio (admin)
- `PUT /api/ensaio/:id` - Atualizar ensaio (dono ou admin)
- `DELETE /api/ensaio/:id` - Deletar ensaio (dono ou admin)

### Usuário
- `GET /api/user/me` - Obter perfil do usuário logado

## 🚢 Deploy

### Guia Completo de Deploy

📖 **Consulte o arquivo [DEPLOY.md](./DEPLOY.md) para instruções detalhadas de deploy em servidor.**

O guia inclui:
- ✅ Configuração completa do servidor (Ubuntu/Linux)
- ✅ Instalação de Node.js, PM2, Nginx
- ✅ Configuração de SSL/HTTPS (Let's Encrypt)
- ✅ Build e deploy da aplicação
- ✅ Configuração de backup automático
- ✅ Processo de atualização
- ✅ Troubleshooting

### Resumo Rápido

1. **Preparar servidor**: Instalar Node.js, PM2, Nginx
2. **Configurar aplicação**: Build do cliente, variáveis de ambiente
3. **Configurar Nginx**: Proxy reverso e SSL
4. **Iniciar com PM2**: Gerenciamento de processos
5. **Configurar backup**: Script automático incluído

Para mais detalhes, veja [DEPLOY.md](./DEPLOY.md).

## 📄 Licença

MIT

## 👥 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
