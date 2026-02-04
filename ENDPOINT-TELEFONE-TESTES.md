# 📞 Endpoint: Buscar Ensaio por Telefone
## Documentação de Testes

---

## 🔗 Endpoint

```
GET /api/ensaio/por-telefone/:telefone
```

---

## 📋 Descrição

Endpoint para integração com n8n + WhatsApp que identifica automaticamente se um músico possui ensaio no dia atual, baseado no número de telefone.

**Funciona em ambiente local e produção:**
- **LOCAL**: `http://localhost:5000/api/ensaio/por-telefone/{telefone}`
- **PRODUÇÃO**: `https://partiuensaio.automatizeonline.com.br/api/ensaio/por-telefone/{telefone}`

---

## 📥 Parâmetros

### Path Parameter
- **telefone** (string, obrigatório): Número de telefone em qualquer formato
  - Exemplos aceitos:
    - `5511974605594` (formato completo com DDI)
    - `(11) 97460-5594` (formato brasileiro)
    - `11974605594` (sem DDI, será adicionado automaticamente)
    - `+55 11 97460-5594` (formato internacional)

---

## 📤 Respostas

### ✅ Sucesso (200 OK)

Quando o músico possui ensaio no dia atual:

```json
{
  "ensaio_id": 123,
  "titulo": "Igreja Central",
  "horario": "20:00",
  "data": "2024-01-15"
}
```

**Campos:**
- `ensaio_id` (number): ID do ensaio
- `titulo` (string): Nome da igreja/local do ensaio
- `horario` (string): Horário no formato HH:mm (24h)
- `data` (string): Data no formato YYYY-MM-DD

### ❌ Não Encontrado (404 Not Found)

Quando não há ensaio para o músico no dia atual:

```json
{
  "message": "Nenhum ensaio encontrado para hoje"
}
```

**Cenários que retornam 404:**
- Músico não encontrado pelo telefone
- Músico não possui interesse registrado em ensaio do dia atual
- Ensaio não está aprovado
- Data do ensaio não é hoje

### ⚠️ Erro do Servidor (500 Internal Server Error)

```json
{
  "error": "Erro interno do servidor ao buscar ensaio"
}
```

---

## 🧪 Testes

### Teste Local (cURL)

```bash
# Exemplo 1: Telefone completo com DDI
curl http://localhost:5000/api/ensaio/por-telefone/5511974605594

# Exemplo 2: Telefone sem DDI (será normalizado)
curl http://localhost:5000/api/ensaio/por-telefone/11974605594

# Exemplo 3: Telefone formatado (será normalizado)
curl http://localhost:5000/api/ensaio/por-telefone/%2811%29%2097460-5594
```

### Teste Produção (cURL)

```bash
# Exemplo 1: Telefone completo com DDI
curl https://partiuensaio.automatizeonline.com.br/api/ensaio/por-telefone/5511974605594

# Exemplo 2: Telefone sem DDI
curl https://partiuensaio.automatizeonline.com.br/api/ensaio/por-telefone/11974605594
```

### Teste com Postman/Insomnia

**Método:** `GET`

**URL:**
```
http://localhost:5000/api/ensaio/por-telefone/5511974605594
```

**Headers:**
```
Nenhum header necessário (endpoint público)
```

---

## 🔍 Lógica de Busca

1. **Normalização do Telefone:**
   - Remove todos os caracteres não numéricos
   - Garante DDI 55 (Brasil)
   - Exemplo: `(11) 97460-5594` → `5511974605594`

2. **Busca do Usuário:**
   - Busca na tabela `users` pelo celular normalizado
   - Filtra apenas músicos aprovados (`role = 'musico'` e `aprovado = 1`)

3. **Busca do Ensaio:**
   - Busca na tabela `interesses_ensaios` relacionada com `ensaios`
   - Filtros aplicados:
     - `musico_id` = ID do usuário encontrado
     - `data_ensaio` = `CURDATE()` (dia atual)
     - `status` = `'aprovado'`
   - Ordenação: `ORDER BY horario ASC` (mais próximo primeiro)
   - Limite: `LIMIT 1` (apenas 1 resultado)

---

## 📊 Estrutura de Dados

### Tabelas Envolvidas

1. **users**
   - Campo: `celular` (VARCHAR(20))
   - Filtros: `role = 'musico'`, `aprovado = 1`

2. **interesses_ensaios**
   - Relaciona: `musico_id` ↔ `ensaio_id`
   - Campo: `data_ensaio` (DATE)

3. **ensaios**
   - Campos: `id`, `nome_igreja`, `horario`, `status`
   - Filtro: `status = 'aprovado'`

---

## ⚠️ Observações Importantes

1. **Não altera dados:** Este endpoint é apenas de leitura, não modifica nenhum dado no banco.

2. **Compatibilidade de ambiente:** O endpoint funciona corretamente em local e produção sem hardcoding de domínio.

3. **Integração n8n:** Este endpoint será consumido por fluxos n8n para confirmação de presença via WhatsApp.

4. **Lógica de presença:** Não altera a lógica de presença existente, apenas identifica corretamente o ensaio do dia.

5. **Normalização automática:** Aceita telefone em qualquer formato e normaliza automaticamente.

---

## 🐛 Troubleshooting

### Problema: Retorna 404 mesmo com ensaio cadastrado

**Possíveis causas:**
1. Telefone não está cadastrado no sistema
2. Usuário não é músico ou não está aprovado
3. Músico não marcou interesse no ensaio
4. Data do ensaio não é hoje
5. Ensaio não está aprovado

**Solução:**
- Verificar se o telefone está correto no banco de dados
- Verificar se há interesse registrado em `interesses_ensaios` para hoje
- Verificar se o ensaio está com `status = 'aprovado'`
- Verificar se `data_ensaio` corresponde ao dia atual

### Problema: Erro 500

**Possíveis causas:**
1. Erro de conexão com banco de dados
2. Erro na query SQL

**Solução:**
- Verificar logs do servidor
- Verificar conexão com MySQL
- Verificar estrutura das tabelas

---

## 📝 Exemplos de Uso

### Exemplo 1: Músico com ensaio hoje

**Request:**
```bash
curl http://localhost:5000/api/ensaio/por-telefone/5511974605594
```

**Response (200):**
```json
{
  "ensaio_id": 45,
  "titulo": "Igreja Central de São Paulo",
  "horario": "20:00",
  "data": "2024-01-15"
}
```

### Exemplo 2: Músico sem ensaio hoje

**Request:**
```bash
curl http://localhost:5000/api/ensaio/por-telefone/5511999999999
```

**Response (404):**
```json
{
  "message": "Nenhum ensaio encontrado para hoje"
}
```

---

## ✅ Checklist de Validação

- [x] Endpoint criado em `/api/ensaio/por-telefone/:telefone`
- [x] Normalização de telefone implementada
- [x] Busca por CURDATE() implementada
- [x] Filtro por status 'aprovado' implementado
- [x] ORDER BY horario ASC implementado
- [x] LIMIT 1 implementado
- [x] Resposta 200 com dados do ensaio
- [x] Resposta 404 quando não encontrado
- [x] Tratamento de erros 500
- [x] Comentários explicativos no código
- [x] Funciona em local e produção
- [x] Não altera dados existentes
