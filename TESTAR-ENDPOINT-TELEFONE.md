# 🧪 Como Testar o Endpoint por Telefone

## ⚠️ Situação Atual

O projeto usa **Express** (não Next.js), então o endpoint está em:
- **Express**: `GET /api/ensaio/por-telefone/:telefone` (porta 5000)
- **Next.js**: `GET /api/ensaios/por-telefone/:telefone` (porta 3000) - criado mas precisa Next.js configurado

## 🔧 Passo 1: Verificar se o servidor está rodando

```powershell
# Verificar se a porta 5000 está em uso
netstat -ano | findstr :5000
```

Se não estiver rodando, inicie o servidor:

```powershell
# Opção 1: Usar o script de inicialização
.\iniciar-servidor.bat

# Opção 2: Manualmente
cd server
npm start
```

## 🧪 Passo 2: Testar o endpoint Express

### Teste Local (PowerShell)

```powershell
# Método 1: Usando Invoke-WebRequest (PowerShell nativo)
Invoke-WebRequest -Uri "http://localhost:5000/api/ensaio/por-telefone/5511974605594" -Method GET | Select-Object -ExpandProperty Content

# Método 2: Usando curl (se disponível)
curl.exe http://localhost:5000/api/ensaio/por-telefone/5511974605594

# Método 3: Usando Invoke-RestMethod (retorna objeto JSON)
Invoke-RestMethod -Uri "http://localhost:5000/api/ensaio/por-telefone/5511974605594" -Method GET
```

### Teste com Telefone Formatado

```powershell
# Telefone sem DDI (será normalizado automaticamente)
Invoke-RestMethod -Uri "http://localhost:5000/api/ensaio/por-telefone/11974605594" -Method GET

# Telefone formatado (será normalizado automaticamente)
Invoke-RestMethod -Uri "http://localhost:5000/api/ensaio/por-telefone/%2811%29%2097460-5594" -Method GET
```

## 📋 Respostas Esperadas

### ✅ Ensaio Encontrado (200)
```json
{
  "ensaio_id": 123,
  "titulo": "Igreja Central",
  "horario": "20:00",
  "data": "2024-01-15"
}
```

### ❌ Nenhum Ensaio (200 - objeto vazio)
```json
{}
```

## 🔍 Debug

Se o endpoint retornar erro, verifique:

1. **Servidor rodando?**
```powershell
netstat -ano | findstr :5000
```

2. **Logs do servidor**
   - Verifique o console onde o servidor está rodando
   - Procure por erros de conexão com banco

3. **Banco de dados**
   - Verifique se o MySQL está rodando
   - Verifique se as variáveis de ambiente estão configuradas

4. **Rota registrada?**
   - Verifique `server/index.js` linha 86: `app.use('/api/ensaio', ensaioRoutes);`

## 🚀 Teste Produção

```powershell
Invoke-RestMethod -Uri "https://partiuensaio.automatizeonline.com.br/api/ensaio/por-telefone/5511974605594" -Method GET
```

## 📝 Nota sobre Next.js

O endpoint Next.js foi criado em `src/app/api/ensaios/por-telefone/[telefone]/route.ts`, mas:
- Requer Next.js configurado no projeto
- Porta padrão: 3000
- Veja `NEXTJS-API-SETUP.md` para configuração

**Recomendação:** Use o endpoint Express que já está funcionando.
