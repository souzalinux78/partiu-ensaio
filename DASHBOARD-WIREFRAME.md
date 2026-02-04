# 📊 Wireframe Textual - Dashboard Administrativo
## Alinhado com Fluxo: Interesse → WhatsApp → Presença

---

## 🎯 VISÃO GERAL DO FLUXO

```
Músico vê ensaio → Marca "Tenho Interesse" → Recebe lembrete WhatsApp (10h do dia) → Comparece ao ensaio
```

---

## 📐 ESTRUTURA DO DASHBOARD

### SEÇÃO 1: KPIs PRINCIPAIS (4 Cards Grandes)
**Objetivo: Leitura em 3 segundos - Decisão rápida**

```
┌─────────────────────────────────────────────────────────────┐
│  📊 VISÃO GERAL DO MÊS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     150      │  │      12      │  │      45      │     │
│  │              │  │              │  │              │     │
│  │ Comunidade   │  │ Ensaios      │  │ Receberão    │     │
│  │ Ativa        │  │ Agendados    │  │ Lembrete      │     │
│  │              │  │              │  │              │     │
│  │ 120 músicos  │  │ Este mês     │  │ Hoje (10h)   │     │
│  │ 30 encarreg. │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                          │
│  │     78%      │                                          │
│  │              │                                          │
│  │ Taxa de      │                                          │
│  │ Engajamento  │                                          │
│  │              │                                          │
│  │ 35 de 45     │                                          │
│  │ compareceram │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

**Microtextos Sugeridos:**

1. **Card 1: Comunidade Ativa**
   - Valor: `(musicosAprovados + encarregadosAprovados)`
   - Label: "Comunidade Ativa"
   - Subtitle: "`{X} músicos • {Y} encarregados`"
   - Cor: Cinza neutro (#4a5568)

2. **Card 2: Ensaios Agendados**
   - Valor: `totalEnsaiosMes`
   - Label: "Ensaios Agendados"
   - Subtitle: "Este mês"
   - Cor: Dourado (#D4AF37) - destaque principal

3. **Card 3: Receberão Lembrete**
   - Valor: `totalMusicosInteressados`
   - Label: "Receberão Lembrete"
   - Subtitle: "Hoje às 10h" (se houver ensaios hoje) ou "Este mês"
   - Cor: Verde (#48bb78) - ação positiva

4. **Card 4: Taxa de Engajamento**
   - Valor: `taxaComparecimento%`
   - Label: "Taxa de Engajamento"
   - Subtitle: "`{X} de {Y} compareceram`" (interesses em ensaios realizados / total interesses)
   - Cor: Azul (#4299e1) - métrica de performance

---

### SEÇÃO 2: JORNADA DO MÚSICO (Timeline Visual)
**Objetivo: Mostrar o funil completo**

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 JORNADA DO MÚSICO                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Viram o ensaio  →  Marcaram interesse  →  Receberam       │
│      {X}              {Y}                    WhatsApp       │
│                                                              │
│  ────────────────────────────────────────────────────────    │
│                                                              │
│  Compareceram ao ensaio                                      │
│      {Z}                                                     │
│                                                              │
│  Taxa de conversão: {Z/Y * 100}%                            │
└─────────────────────────────────────────────────────────────┘
```

**Microtextos Sugeridos:**
- "Viram o ensaio" → Total de visualizações únicas (se disponível) ou "Ensaios visualizados"
- "Marcaram interesse" → `totalMusicosInteressados`
- "Receberam WhatsApp" → Interesses com `webhook_enviado = 1`
- "Compareceram" → Interesses em ensaios realizados (data_ensaio < hoje)

---

### SEÇÃO 3: ENSAIOS HOJE (Card de Ação)
**Objetivo: Ação imediata para admin**

```
┌─────────────────────────────────────────────────────────────┐
│  📅 ENSAIOS HOJE                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Hoje, {data}                                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 🎵 Ensaio: {nome_igreja}                           │     │
│  │ ⏰ Horário: {horario}                              │     │
│  │ 👥 {X} músicos receberão lembrete às 10h          │     │
│  │ ✅ {Y} já receberam                                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  [Ver todos os ensaios de hoje]                              │
└─────────────────────────────────────────────────────────────┘
```

**Microtextos Sugeridos:**
- "Hoje, {data formatada}"
- "{X} músicos receberão lembrete às 10h" → Interesses com `webhook_enviado = 0` e `data_ensaio = hoje`
- "{Y} já receberam" → Interesses com `webhook_enviado = 1`

---

### SEÇÃO 4: LOCAIS MAIS ATIVOS (Ranking)
**Objetivo: Identificar locais com mais engajamento**

```
┌─────────────────────────────────────────────────────────────┐
│  📍 LOCAIS MAIS ATIVOS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1º  {local}                    {X} ensaios • {Y} interesses│
│  2º  {local}                    {X} ensaios • {Y} interesses│
│  3º  {local}                    {X} ensaios • {Y} interesses│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Microtextos Sugeridos:**
- "Locais Mais Ativos" (ao invés de "Locais com Mais Ensaios")
- Mostrar: `{X} ensaios • {Y} interesses` (mais informativo)

---

### SEÇÃO 5: MÉTRICAS SECUNDÁRIAS (Grid 2 Colunas)
**Objetivo: Contexto adicional**

```
┌─────────────────────────────────────────────────────────────┐
│  📊 CONTEXTO ADICIONAL                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ 🌍 Distribuição      │  │ 🎵 Perfil Musical    │        │
│  │                      │  │                      │        │
│  │ Top 5 Cidades        │  │ Top 5 Naipes         │        │
│  │ Top 5 Estados        │  │ Top 8 Instrumentos   │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 HIERARQUIA DE CORES

- **Dourado (#D4AF37)**: Ações principais, ensaios agendados
- **Verde (#48bb78)**: Sucesso, interesses confirmados, presença
- **Azul (#4299e1)**: Métricas, taxa de engajamento
- **Cinza (#4a5568)**: Informação neutra, comunidade ativa
- **Laranja (#f6ad55)**: Avisos, pendências

---

## 📝 MICROTEXTOS MELHORADOS

### Labels Principais:
- ❌ "Usuários Ativos" → ✅ "Comunidade Ativa"
- ❌ "Ensaios no Mês" → ✅ "Ensaios Agendados"
- ❌ "Interesses Confirmados" → ✅ "Receberão Lembrete"
- ❌ "Taxa de Comparecimento" → ✅ "Taxa de Engajamento"

### Subtítulos Contextuais:
- ❌ "Músicos interessados este mês" → ✅ "Hoje às 10h" (se houver ensaios hoje) ou "Este mês"
- ❌ "Ensaios aprovados este mês" → ✅ "Este mês"
- ❌ "{X} ensaios realizados" → ✅ "{X} de {Y} compareceram"

### Ações:
- ❌ "Ver detalhes" → ✅ "Ver todos os ensaios de hoje"
- ❌ "Mais informações" → ✅ "Ver jornada completa"

---

## 🔄 ALINHAMENTO COM FLUXO

### Fluxo Completo Rastreado:

1. **Visualização** (se disponível)
   - Quantos músicos viram os ensaios

2. **Interesse**
   - Quantos marcaram "Tenho Interesse"
   - Quando marcaram

3. **Lembrete WhatsApp**
   - Quantos receberão hoje às 10h
   - Quantos já receberam
   - Status do webhook

4. **Presença**
   - Quantos compareceram (baseado em interesses em ensaios realizados)
   - Taxa de conversão: Interesse → Presença

---

## 💡 SUGESTÕES DE MELHORIAS FUTURAS

1. **Card de "Próximos Lembretes"**
   - Mostrar ensaios dos próximos 7 dias
   - Quantos receberão lembrete em cada dia

2. **Gráfico de Funil**
   - Visualização da jornada: Visualização → Interesse → Lembrete → Presença

3. **Alertas**
   - "⚠️ {X} músicos ainda não receberam lembrete" (se passou das 10h)
   - "✅ Todos os lembretes enviados com sucesso"

4. **Comparativo Mensal**
   - "Este mês vs. mês anterior"
   - Tendências de engajamento

---

## 📱 RESPONSIVIDADE

- **Desktop**: Grid 4 colunas para KPIs principais
- **Tablet**: Grid 2 colunas
- **Mobile**: 1 coluna, valores ajustados, cards empilhados

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar labels dos KPIs principais
- [ ] Adicionar card "Ensaio Hoje" (se houver)
- [ ] Melhorar subtítulos com contexto temporal
- [ ] Adicionar métrica "Receberão Lembrete" vs "Já Receberam"
- [ ] Atualizar "Locais Mais Ativos" com interesses
- [ ] Ajustar cores conforme hierarquia
- [ ] Testar responsividade
- [ ] Validar microtextos com usuários
