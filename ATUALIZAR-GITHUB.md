# Como Atualizar Arquivos no GitHub

## 📋 Pré-requisitos

### 1. Verificar se Git está instalado

Abra o **PowerShell** ou **Prompt de Comando** e execute:
```bash
git --version
```

**Se aparecer erro:**
- Baixe e instale o Git: [https://git-scm.com/download/win](https://git-scm.com/download/win)
- Reinicie o terminal após instalar

---

## 🚀 Passo 1: Verificar Status do Repositório

### 1.1 Abrir terminal na pasta do projeto
```bash
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
```

### 1.2 Verificar se já é um repositório Git
```bash
git status
```

**Se aparecer erro "not a git repository":**
- Pule para o Passo 2 (Configurar Repositório)

**Se mostrar arquivos:**
- Continue no Passo 3 (Atualizar Arquivos)

---

## 🔗 Passo 2: Configurar Repositório (Se necessário)

### 2.1 Inicializar Git (se ainda não foi feito)
```bash
git init
```

### 2.2 Configurar Git (se ainda não configurou)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 2.3 Conectar com o repositório GitHub
```bash
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
```

**Se aparecer erro "remote origin already exists":**
```bash
git remote remove origin
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
```

### 2.4 Verificar conexão
```bash
git remote -v
```

Deve mostrar:
```
origin  https://github.com/souzalinux78/partiu-ensaio.git (fetch)
origin  https://github.com/souzalinux78/partiu-ensaio.git (push)
```

---

## 📤 Passo 3: Atualizar Arquivos no GitHub

### 3.1 Ver quais arquivos foram modificados
```bash
git status
```

### 3.2 Adicionar todos os arquivos novos/modificados
```bash
git add .
```

**Ou adicionar arquivos específicos:**
```bash
git add database/
git add DEPLOY.md
git add GITHUB-SETUP.md
git add .gitignore
git add ecosystem.config.js
git add backup.sh
```

### 3.3 Verificar o que será commitado
```bash
git status
```

### 3.4 Fazer commit das mudanças
```bash
git commit -m "Adiciona estrutura MySQL, guias de deploy e configurações"
```

**Mensagens de commit sugeridas:**
- `"Adiciona estrutura completa do banco MySQL"`
- `"Adiciona guias de deploy e GitHub"`
- `"Atualiza configurações PWA e scripts"`
- `"Adiciona documentação de migração MySQL"`

### 3.5 Verificar branch atual
```bash
git branch
```

**Se não estiver na branch main:**
```bash
git branch -M main
```

### 3.6 Enviar para GitHub
```bash
git push -u origin main
```

**Se for a primeira vez ou houver mudanças no GitHub:**
```bash
git pull origin main --rebase
git push -u origin main
```

---

## 🔐 Passo 4: Autenticação no GitHub

### 4.1 Se pedir usuário e senha

**Username:** `souzalinux78`

**Password:** Use um **Personal Access Token** (não sua senha do GitHub)

### 4.2 Criar Personal Access Token

1. Acesse: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note**: "Partiu Ensaio - Atualização"
   - **Expiration**: Escolha um prazo (ex: 90 dias)
   - **Scopes**: Marque **`repo`** (acesso completo)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (não será mostrado novamente!)
6. Use este token como senha quando pedir

---

## 🔄 Passo 5: Atualizações Futuras (Fluxo Rápido)

Sempre que fizer mudanças:

```bash
# 1. Ver mudanças
git status

# 2. Adicionar arquivos
git add .

# 3. Fazer commit
git commit -m "Descrição das mudanças"

# 4. Enviar para GitHub
git push
```

---

## ⚠️ Resolução de Problemas

### Erro: "fatal: not a git repository"
```bash
git init
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
```

### Erro: "failed to push some refs"
```bash
# Alguém fez push antes de você
git pull origin main --rebase
git push
```

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
```

### Erro de autenticação
- Verifique se está usando Personal Access Token
- Crie um novo token se necessário
- Verifique se o token tem permissão `repo`

### Erro: "Git não encontrado"
- Instale o Git: [https://git-scm.com/download/win](https://git-scm.com/download/win)
- Reinicie o terminal após instalar

---

## 📋 Checklist de Atualização

- [ ] Git instalado e funcionando
- [ ] Repositório inicializado ou já configurado
- [ ] Remote origin configurado corretamente
- [ ] Arquivos adicionados (`git add .`)
- [ ] Commit feito (`git commit`)
- [ ] Push realizado (`git push`)
- [ ] Arquivos aparecem no GitHub

---

## 🎯 Comandos Rápidos (Copiar e Colar)

### Primeira vez (configuração completa):
```bash
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
git init
git remote add origin https://github.com/souzalinux78/partiu-ensaio.git
git add .
git commit -m "Versão inicial completa do projeto"
git branch -M main
git push -u origin main
```

### Atualizações futuras:
```bash
cd C:\Users\eduardosouza\OneDrive\Documentos\PartiuEnsaio
git add .
git commit -m "Atualiza arquivos"
git push
```

---

## 💡 Dicas

1. **Faça commits frequentes** - Não espere muito tempo
2. **Mensagens claras** - Descreva o que mudou
3. **Verifique antes de push** - Use `git status` para ver o que será enviado
4. **Mantenha backup** - Sempre tenha backup local antes de push

---

## 🔍 Verificar se Funcionou

Após o push, acesse:
**https://github.com/souzalinux78/partiu-ensaio**

Você deve ver:
- ✅ Todos os arquivos atualizados
- ✅ Último commit mostrando suas mudanças
- ✅ Data/hora da última atualização

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique os erros no terminal
2. Consulte a seção "Resolução de Problemas" acima
3. Use `git status` para ver o estado atual
4. Verifique se o Git está instalado: `git --version`
