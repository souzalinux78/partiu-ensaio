# Instruções Rápidas - Partiu Ensaio

## 🚀 Início Rápido

1. **Instale as dependências:**
   ```bash
   npm run install-all
   ```

2. **Inicie o aplicativo:**
   ```bash
   npm run dev
   ```

3. **Acesse:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 👤 Login Inicial

**Administrador:**
- Email: `admin@partiuensaio.com`
- Senha: `admin123`

## 📋 Fluxo de Uso

### 1. Encarregado cadastra um ensaio
- Faça login ou cadastre-se como encarregado
- No dashboard, clique em "Novo Ensaio"
- Preencha: dia da semana, horário, local (igreja), foto (opcional), observações (opcional)
- Salve o ensaio (status: Pendente)

### 2. Administrador aprova o ensaio
- Faça login como administrador
- No dashboard admin, veja os ensaios pendentes
- Clique em "Aprovar" ou "Rejeitar"

### 3. Usuários veem os ensaios aprovados
- Acesse a página inicial (sem login)
- Veja todos os ensaios aprovados organizados por dia da semana

## 🔧 Solução de Problemas

**Erro ao iniciar o servidor:**
- Verifique se a porta 5000 está livre
- Verifique se todas as dependências foram instaladas

**Erro ao fazer upload de imagem:**
- Verifique se a pasta `server/uploads` existe
- Verifique o tamanho da imagem (máximo 5MB)

**Erro de autenticação:**
- Verifique se o token está sendo enviado no header
- Faça logout e login novamente

## 📱 Funcionalidades Principais

✅ Cadastro de usuários (encarregados)
✅ Login e autenticação
✅ Dashboard para encarregados
✅ Cadastro de ensaios com foto
✅ Dashboard para administradores
✅ Aprovação/rejeição de ensaios
✅ Visualização pública de ensaios aprovados
✅ Organização por dia da semana
