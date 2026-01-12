// Função para calcular a próxima data do ensaio baseado no dia da semana e semana do mês
function calcularProximaData(diaSemana, semanaMes) {
  if (!diaSemana || !semanaMes) {
    return null;
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  // Mapear dias da semana (normalizar acentos)
  const diasSemana = {
    'domingo': 0,
    'segunda-feira': 1,
    'terça-feira': 2,
    'terca-feira': 2,
    'quarta-feira': 3,
    'quinta-feira': 4,
    'sexta-feira': 5,
    'sábado': 6,
    'sabado': 6
  };
  
  const diaSemanaLower = diaSemana.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const diaSemanaNum = diasSemana[diaSemanaLower] || diasSemana[diaSemana.toLowerCase()];
  if (diaSemanaNum === undefined) {
    return null;
  }
  
  // Calcular a primeira ocorrência do dia no mês atual
  const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
  const diaSemanaPrimeiro = primeiroDiaMes.getDay();
  
  // Calcular quantos dias até o primeiro dia da semana desejado
  let diasAtePrimeiro = (diaSemanaNum - diaSemanaPrimeiro + 7) % 7;
  if (diasAtePrimeiro === 0 && diaSemanaNum !== diaSemanaPrimeiro) {
    diasAtePrimeiro = 7;
  }
  
  // Calcular a data baseada na semana do mês (1, 2, 3, 4 ou -1 para última)
  let data;
  if (semanaMes === -1) {
    // Última semana do mês
    const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);
    const diaSemanaUltimo = ultimoDiaMes.getDay();
    let diasAteUltimo = (diaSemanaNum - diaSemanaUltimo + 7) % 7;
    if (diasAteUltimo === 0 && diaSemanaNum !== diaSemanaUltimo) {
      diasAteUltimo = 7;
    }
    data = new Date(anoAtual, mesAtual, ultimoDiaMes.getDate() - diasAteUltimo);
  } else {
    // Semana específica (1, 2, 3, 4)
    const dia = 1 + diasAtePrimeiro + (semanaMes - 1) * 7;
    data = new Date(anoAtual, mesAtual, dia);
  }
  
  // Normalizar datas para comparar apenas o dia (sem hora)
  const dataNormalizada = new Date(data);
  dataNormalizada.setHours(0, 0, 0, 0);
  const hojeNormalizado = new Date(hoje);
  hojeNormalizado.setHours(0, 0, 0, 0);
  
  // Se a data já passou neste mês (não inclui hoje), calcular para o próximo mês
  if (dataNormalizada < hojeNormalizado) {
    if (semanaMes === -1) {
      // Última semana do próximo mês
      const proximoMes = mesAtual + 1;
      const ultimoDiaProximoMes = new Date(anoAtual, proximoMes + 1, 0);
      const diaSemanaUltimo = ultimoDiaProximoMes.getDay();
      let diasAteUltimo = (diaSemanaNum - diaSemanaUltimo + 7) % 7;
      if (diasAteUltimo === 0 && diaSemanaNum !== diaSemanaUltimo) {
        diasAteUltimo = 7;
      }
      data = new Date(anoAtual, proximoMes, ultimoDiaProximoMes.getDate() - diasAteUltimo);
    } else {
      // Próxima semana do próximo mês
      const proximoMes = mesAtual + 1;
      const primeiroDiaProximoMes = new Date(anoAtual, proximoMes, 1);
      const diaSemanaPrimeiroProximo = primeiroDiaProximoMes.getDay();
      let diasAtePrimeiroProximo = (diaSemanaNum - diaSemanaPrimeiroProximo + 7) % 7;
      if (diasAtePrimeiroProximo === 0 && diaSemanaNum !== diaSemanaPrimeiroProximo) {
        diasAtePrimeiroProximo = 7;
      }
      const diaProximo = 1 + diasAtePrimeiroProximo + (semanaMes - 1) * 7;
      data = new Date(anoAtual, proximoMes, diaProximo);
    }
  }
  
  // Formatar data como YYYY-MM-DD
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}`;
}

// Função para verificar se uma data deve aparecer (considerando horário de 20h e limite de 7 dias)
// Ensaios de hoje aparecem até 20h, depois das 20h só aparecem ensaios futuros
// Apenas ensaios dentro de 7 dias (incluindo hoje) são exibidos
function deveAparecer(dataString, horario, limiteDias = 7) {
  if (!dataString) return false;
  
  const agora = new Date();
  const horaAtual = agora.getHours();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Criar data do ensaio
  const dataEnsaio = new Date(dataString + 'T00:00:00');
  const dataEnsaioNormalizada = new Date(dataEnsaio);
  dataEnsaioNormalizada.setHours(0, 0, 0, 0);
  
  // Calcular diferença em dias
  const diffTime = dataEnsaioNormalizada - hoje;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Verificar se está dentro do limite de dias (0 a limiteDias)
  if (diffDays < 0) {
    return false; // Data no passado
  }
  
  if (diffDays > limiteDias) {
    return false; // Fora do limite de 7 dias
  }
  
  // Se for hoje, verificar horário (só mostrar se ainda não passou das 20h)
  if (diffDays === 0) {
    // Sempre mostrar se for hoje, independente da hora (ou ajustar para <= 20)
    return horaAtual <= 20;
  }
  
  // Se for futuro dentro do limite, mostrar
  return diffDays > 0 && diffDays <= limiteDias;
}

// Função para calcular múltiplas ocorrências futuras de um ensaio recorrente (limitado a 7 dias)
function calcularOcorrenciasFuturas(diaSemana, semanaMes, limiteMeses = 12, limiteDias = 7) {
  if (!diaSemana || semanaMes === undefined || semanaMes === null) {
    return [];
  }
  
  const ocorrencias = [];
  const ocorrenciasSet = new Set(); // Para evitar datas duplicadas
  const agora = new Date();
  const horaAtual = agora.getHours();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Mapear dias da semana
  const diasSemana = {
    'domingo': 0,
    'segunda-feira': 1,
    'terça-feira': 2,
    'terca-feira': 2,
    'quarta-feira': 3,
    'quinta-feira': 4,
    'sexta-feira': 5,
    'sábado': 6,
    'sabado': 6
  };
  
  const diaSemanaLower = diaSemana.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const diaSemanaNum = diasSemana[diaSemanaLower] || diasSemana[diaSemana.toLowerCase()];
  if (diaSemanaNum === undefined) {
    return [];
  }
  
  const semanaMesNum = parseInt(semanaMes);
  
  // Calcular ocorrências para os próximos N meses
  for (let mesOffset = 0; mesOffset < limiteMeses; mesOffset++) {
    const dataBase = new Date(agora.getFullYear(), agora.getMonth() + mesOffset, 1);
    const ano = dataBase.getFullYear();
    const mes = dataBase.getMonth();
    
    let data;
    
    if (semanaMesNum === -1) {
      // Última semana do mês
      const ultimoDiaMes = new Date(ano, mes + 1, 0);
      const diaSemanaUltimo = ultimoDiaMes.getDay();
      let diasAteUltimo = (diaSemanaNum - diaSemanaUltimo + 7) % 7;
      if (diasAteUltimo === 0 && diaSemanaNum !== diaSemanaUltimo) {
        diasAteUltimo = 7;
      }
      data = new Date(ano, mes, ultimoDiaMes.getDate() - diasAteUltimo);
    } else {
      // Semana específica
      const primeiroDiaMes = new Date(ano, mes, 1);
      const diaSemanaPrimeiro = primeiroDiaMes.getDay();
      let diasAtePrimeiro = (diaSemanaNum - diaSemanaPrimeiro + 7) % 7;
      if (diasAtePrimeiro === 0 && diaSemanaNum !== diaSemanaPrimeiro) {
        diasAtePrimeiro = 7;
      }
      const dia = 1 + diasAtePrimeiro + (semanaMesNum - 1) * 7;
      data = new Date(ano, mes, dia);
    }
    
    // Verificar se a data é válida (dentro do mês)
    if (data.getMonth() !== mes) {
      continue; // Data inválida (fora do mês)
    }
    
    // Verificar se a data está no futuro (ou hoje)
    const dataNormalizada = new Date(data);
    dataNormalizada.setHours(0, 0, 0, 0);
    
    // Calcular diferença em dias
    const diffTime = dataNormalizada - hoje;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Formatar data como string primeiro
    const anoStr = String(data.getFullYear());
    const mesStr = String(data.getMonth() + 1).padStart(2, '0');
    const diaStr = String(data.getDate()).padStart(2, '0');
    const dataStr = `${anoStr}-${mesStr}-${diaStr}`;
    
    // Verificar se já existe esta data (evitar duplicatas)
    if (ocorrenciasSet.has(dataStr)) {
      continue; // Pular se já existe
    }
    
    // Verificar se está dentro do limite de dias (0 a limiteDias)
    // Incluir hoje (diffDays === 0) e futuros dentro do limite
    if (diffDays >= 0 && diffDays <= limiteDias) {
      ocorrenciasSet.add(dataStr);
      ocorrencias.push(dataStr);
    }
  }
  
  return ocorrencias;
}

// Função para verificar se uma data está dentro dos próximos 7 dias (inclui hoje)
// Mantida para compatibilidade, mas não será mais usada
function estaDentroDe7Dias(dataString) {
  if (!dataString) return false;
  
  const dataEnsaio = new Date(dataString + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const diffTime = dataEnsaio - hoje;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Inclui hoje (0) até 7 dias à frente
  return diffDays >= 0 && diffDays <= 7;
}

module.exports = {
  calcularProximaData,
  estaDentroDe7Dias,
  deveAparecer,
  calcularOcorrenciasFuturas
};
