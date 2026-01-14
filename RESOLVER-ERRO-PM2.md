# 🔧 Resolver Erro PM2 - Process Not Found

## ❌ Problema

O PM2 está tentando reiniciar um processo que não existe mais, causando erro:
```
[PM2][ERROR] Process 0 not found
TypeError: Cannot read properties of undefined (reading 'pm2_env')
```

## ✅ Solução Passo a Passo

### PASSO 1: Verificar Status do PM2

```bash
pm2 status
```

**Se aparecer processos órfãos ou erros:**
- Continue para o PASSO 2

**Se não aparecer nada ou estiver vazio:**
- Continue para o PASSO 3

### PASSO 2: Limpar Processos Órfãos

```bash
# Parar todos os processos
pm2 stop all

# Deletar todos os processos
pm2 delete all

# Limpar cache do PM2
pm2 flush

# Verificar se está limpo
pm2 status
```

### PASSO 3: Verificar se o App Existe

```bash
cd /var/www/partiu-ensaio

# Verificar se o arquivo ecosystem.config.js existe
ls -la ecosystem.config.js

# Verificar conteúdo
cat ecosystem.config.js
```

### PASSO 4: Recriar o Processo PM2

**Opção 1: Usando ecosystem.config.js (Recomendado)**

```bash
cd /var/www/partiu-ensaio

# Iniciar usando o arquivo de configuração
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Verificar status
pm2 status
```

**Opção 2: Iniciar Manualmente**

```bash
cd /var/www/partiu-ensaio/server

# Iniciar o servidor Node.js
pm2 start index.js --name partiu-ensaio --env production

# Salvar configuração
pm2 save

# Verificar status
pm2 status
```

### PASSO 5: Configurar Auto-start (Opcional)

```bash
# Gerar script de inicialização automática
pm2 startup

# Seguir as instruções que aparecerem (geralmente um comando sudo)

# Salvar configuração atual
pm2 save
```

### PASSO 6: Verificar Logs

```bash
# Ver logs em tempo real
pm2 logs partiu-ensaio

# Ver últimas 50 linhas
pm2 logs partiu-ensaio --lines 50

# Ver apenas erros
pm2 logs partiu-ensaio --err --lines 50
```

## 🔍 Verificações Adicionais

### Verificar se o Servidor Está Rodando

```bash
# Verificar se a porta 5000 está em uso
netstat -tulpn | grep :5000

# OU
ss -tulpn | grep :5000

# Verificar processos Node.js
ps aux | grep node
```

### Verificar Permissões

```bash
# Verificar permissões do diretório
ls -la /var/www/partiu-ensaio

# Se necessário, ajustar permissões
chown -R www-data:www-data /var/www/partiu-ensaio
chmod -R 755 /var/www/partiu-ensaio
```

### Verificar Variáveis de Ambiente

```bash
cd /var/www/partiu-ensaio/server

# Verificar se o arquivo .env existe
ls -la .env

# Verificar conteúdo (sem mostrar senhas)
cat .env | grep -v PASSWORD
```

## 🚀 Script Completo de Recuperação

Crie um script para facilitar:

```bash
#!/bin/bash
# Salvar como: reiniciar-pm2.sh

echo "🔄 Reiniciando PM2..."

# Parar e deletar todos os processos
pm2 stop all
pm2 delete all
pm2 flush

# Navegar para o diretório
cd /var/www/partiu-ensaio

# Verificar se ecosystem.config.js existe
if [ -f "ecosystem.config.js" ]; then
    echo "✅ Usando ecosystem.config.js"
    pm2 start ecosystem.config.js
else
    echo "⚠️  ecosystem.config.js não encontrado, iniciando manualmente"
    cd server
    pm2 start index.js --name partiu-ensaio --env production
    cd ..
fi

# Salvar configuração
pm2 save

# Verificar status
echo ""
echo "📊 Status do PM2:"
pm2 status

# Mostrar logs
echo ""
echo "📋 Últimas linhas dos logs:"
pm2 logs partiu-ensaio --lines 10 --nostream
```

Torne executável e execute:
```bash
chmod +x reiniciar-pm2.sh
./reiniciar-pm2.sh
```

## 📋 Comandos Úteis do PM2

```bash
# Ver status
pm2 status

# Ver informações detalhadas
pm2 show partiu-ensaio

# Reiniciar
pm2 restart partiu-ensaio

# Parar
pm2 stop partiu-ensaio

# Iniciar
pm2 start partiu-ensaio

# Deletar
pm2 delete partiu-ensaio

# Ver logs
pm2 logs partiu-ensaio

# Monitorar recursos
pm2 monit

# Salvar configuração atual
pm2 save

# Listar todos os processos
pm2 list
```

## ⚠️ Problemas Comuns

### Problema 1: PM2 não encontra o processo

**Solução:**
```bash
pm2 delete all
pm2 flush
pm2 start ecosystem.config.js
pm2 save
```

### Problema 2: Porta já em uso

**Solução:**
```bash
# Encontrar processo usando porta 5000
lsof -i :5000
# OU
netstat -tulpn | grep :5000

# Matar processo (substitua PID pelo número encontrado)
kill -9 <PID>

# Reiniciar PM2
pm2 restart partiu-ensaio
```

### Problema 3: Permissões negadas

**Solução:**
```bash
# Verificar permissões
ls -la /var/www/partiu-ensaio

# Ajustar se necessário
sudo chown -R $USER:$USER /var/www/partiu-ensaio
sudo chmod -R 755 /var/www/partiu-ensaio
```

### Problema 4: Variáveis de ambiente não carregadas

**Solução:**
```bash
# Verificar se .env existe
ls -la /var/www/partiu-ensaio/server/.env

# Verificar ecosystem.config.js
cat /var/www/partiu-ensaio/ecosystem.config.js

# Reiniciar com variáveis explícitas
cd /var/www/partiu-ensaio/server
NODE_ENV=production PORT=5000 pm2 start index.js --name partiu-ensaio
```

## ✅ Checklist de Recuperação

- [ ] `pm2 status` executado
- [ ] Processos órfãos deletados (`pm2 delete all`)
- [ ] Cache limpo (`pm2 flush`)
- [ ] `ecosystem.config.js` verificado
- [ ] Processo recriado (`pm2 start ecosystem.config.js`)
- [ ] Configuração salva (`pm2 save`)
- [ ] Status verificado (`pm2 status`)
- [ ] Logs verificados (`pm2 logs partiu-ensaio`)
- [ ] Servidor respondendo (testar URL)

## 🎯 Comando Rápido (Tudo de Uma Vez)

```bash
pm2 delete all && \
pm2 flush && \
cd /var/www/partiu-ensaio && \
pm2 start ecosystem.config.js && \
pm2 save && \
pm2 status && \
echo "✅ PM2 reiniciado com sucesso!"
```
