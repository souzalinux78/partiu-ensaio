# Guia de Sincronização com GitHub

## 📋 Pré-requisitos

1. **Conta no GitHub**: Crie em [github.com](https://github.com)
2. **Git instalado**: Verifique com `git --version`
   - Se não tiver: [Baixar Git](https://git-scm.com/downloads)

---

## 🚀 Passo 1: Inicializar Git no Projeto

### 1.1 Abrir terminal na pasta do projeto
```bash
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
```

### 1.2 Verificar se já existe repositório Git
```bash
git status
```

Se aparecer erro, significa que não há repositório Git ainda.

### 1.3 Inicializar repositório Git
```bash
git init
```

### 1.4 Configurar Git (se ainda não configurou)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

---

## 📦 Passo 2: Criar Repositório no GitHub

### 2.1 Acessar GitHub
1. Vá para [github.com](https://github.com)
2. Faça login na sua conta

### 2.2 Criar novo repositório
1. Clique no botão **"+"** no canto superior direito
2. Selecione **"New repository"**
3. Preencha:
   - **Repository name**: `partiu-ensaio` (ou outro nome)
   - **Description**: "Agenda musical para ensaios de orquestra"
   - **Visibility**: Escolha **Public** ou **Private**
   - **NÃO marque** "Initialize with README" (já temos arquivos)
4. Clique em **"Create repository"**

### 2.3 Copiar URL do repositório
Após criar, você verá uma página com instruções. Copie a URL do repositório:
- Exemplo: `https://github.com/seu-usuario/partiu-ensaio.git`

---

## 📤 Passo 3: Adicionar Arquivos e Fazer Primeiro Commit

### 3.1 Verificar arquivos que serão adicionados
```bash
git status
```

### 3.2 Adicionar todos os arquivos ao staging
```bash
git add .
```

### 3.3 Fazer primeiro commit
```bash
git commit -m "Versão inicial do projeto Partiu Ensaio"
```

---

## 🔗 Passo 4: Conectar com GitHub

### 4.1 Adicionar repositório remoto
```bash
git remote add origin https://github.com/SEU-USUARIO/partiu-ensaio.git
```

**Substitua `SEU-USUARIO` pelo seu usuário do GitHub e `partiu-ensaio` pelo nome do seu repositório.**

### 4.2 Verificar se foi adicionado corretamente
```bash
git remote -v
```

Deve mostrar:
```
origin  https://github.com/SEU-USUARIO/partiu-ensaio.git (fetch)
origin  https://github.com/SEU-USUARIO/partiu-ensaio.git (push)
```

### 4.3 Renomear branch principal (se necessário)
```bash
git branch -M main
```

### 4.4 Fazer push para GitHub
```bash
git push -u origin main
```

**Se pedir autenticação:**
- **Username**: Seu usuário do GitHub
- **Password**: Use um **Personal Access Token** (não sua senha)
  - Veja como criar abaixo

---

## 🔐 Passo 5: Criar Personal Access Token (Obrigatório)

GitHub não aceita mais senha, precisa de um token:

### 5.1 Criar token
1. Vá para: [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note**: "Partiu Ensaio - Local"
   - **Expiration**: Escolha um prazo (ex: 90 dias)
   - **Scopes**: Marque **`repo`** (acesso completo aos repositórios)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN IMEDIATAMENTE** (não será mostrado novamente!)

### 5.2 Usar token no push
Quando pedir senha, use o token no lugar da senha.

---

## 🔄 Passo 6: Sincronização Contínua

### 6.1 Verificar status
```bash
git status
```

### 6.2 Adicionar mudanças
```bash
git add .
```

Ou adicionar arquivos específicos:
```bash
git add arquivo1.js arquivo2.js
```

### 6.3 Fazer commit
```bash
git commit -m "Descrição das mudanças"
```

**Boas práticas de mensagens:**
- `git commit -m "Adiciona campo de pesquisa na página inicial"`
- `git commit -m "Corrige bug no cálculo de datas"`
- `git commit -m "Melhora responsividade do header"`

### 6.4 Enviar para GitHub
```bash
git push
```

---

## 📥 Passo 7: Baixar Mudanças do GitHub

Se você trabalhar em outro computador ou alguém fizer mudanças:

### 7.1 Buscar mudanças
```bash
git fetch origin
```

### 7.2 Ver diferenças
```bash
git log HEAD..origin/main
```

### 7.3 Baixar e mesclar
```bash
git pull origin main
```

---

## 🌿 Passo 8: Trabalhar com Branches (Opcional)

### 8.1 Criar nova branch
```bash
git checkout -b nome-da-branch
```

Exemplo:
```bash
git checkout -b feature/nova-funcionalidade
```

### 8.2 Trabalhar na branch
Faça suas mudanças, commits normalmente.

### 8.3 Enviar branch para GitHub
```bash
git push -u origin nome-da-branch
```

### 8.4 Voltar para main
```bash
git checkout main
```

### 8.5 Mesclar branch em main
```bash
git merge nome-da-branch
```

---

## 📝 Comandos Úteis

### Ver histórico de commits
```bash
git log
```

### Ver mudanças não commitadas
```bash
git diff
```

### Ver arquivos rastreados
```bash
git ls-files
```

### Desfazer mudanças não commitadas
```bash
git restore arquivo.js
```

### Desfazer último commit (mantendo mudanças)
```bash
git reset --soft HEAD~1
```

### Ver branches
```bash
git branch
```

### Ver repositórios remotos
```bash
git remote -v
```

---

## ⚠️ Resolução de Problemas

### Erro: "fatal: not a git repository"
```bash
# Você não está em um repositório Git
# Execute: git init
```

### Erro: "remote origin already exists"
```bash
# Remover origin existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/SEU-USUARIO/partiu-ensaio.git
```

### Erro: "failed to push some refs"
```bash
# Alguém fez push antes de você
# Primeiro, baixe as mudanças:
git pull origin main --rebase

# Depois, faça push novamente:
git push
```

### Erro de autenticação
- Verifique se está usando Personal Access Token
- Crie um novo token se necessário
- Verifique se o token tem permissão `repo`

### Arquivos grandes não sobem
```bash
# Verificar tamanho dos arquivos
git ls-files | xargs ls -lh | sort -k5 -hr | head -20

# Se houver arquivos muito grandes, adicione ao .gitignore
```

---

## 🔒 Arquivos Sensíveis

**NUNCA faça commit de:**
- Arquivos `.env` com senhas
- `database.sqlite` (banco de dados)
- `node_modules/`
- Chaves privadas

**Já estão no `.gitignore`:**
- ✅ `.env`
- ✅ `*.sqlite`
- ✅ `node_modules/`
- ✅ `uploads/`

---

## 📋 Checklist de Primeira Vez

- [ ] Git instalado e configurado
- [ ] Conta GitHub criada
- [ ] Repositório criado no GitHub
- [ ] Personal Access Token criado
- [ ] `git init` executado
- [ ] `git add .` executado
- [ ] `git commit` feito
- [ ] `git remote add origin` configurado
- [ ] `git push -u origin main` executado com sucesso
- [ ] Arquivos aparecem no GitHub

---

## 🎯 Fluxo de Trabalho Diário

1. **Verificar status**: `git status`
2. **Adicionar mudanças**: `git add .`
3. **Fazer commit**: `git commit -m "Descrição"`
4. **Enviar para GitHub**: `git push`
5. **Repetir quando necessário**

---

## 💡 Dicas

1. **Faça commits frequentes** (não espere muito tempo)
2. **Mensagens de commit claras** (descreva o que mudou)
3. **Sempre faça pull antes de push** se trabalhar em vários lugares
4. **Use branches** para funcionalidades grandes
5. **Mantenha `.gitignore` atualizado**

---

## 📚 Recursos Adicionais

- [Documentação oficial do Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique os erros no terminal
2. Consulte a seção "Resolução de Problemas" acima
3. Use `git status` para ver o estado atual
4. Consulte a documentação do Git/GitHub
