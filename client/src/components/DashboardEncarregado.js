import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import { instrumentos, getCategoriaInstrumento } from '../utils/instrumentos';
import AlterarSenha from './AlterarSenha';
import ReportarProblema from './ReportarProblema';
import './Dashboard.css';

const DashboardEncarregado = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('meus');
  const [ensaios, setEnsaios] = useState([]);
  const [ensaiosPublicos, setEnsaiosPublicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublicos, setLoadingPublicos] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [interessesModal, setInteressesModal] = useState({ ensaioId: null, interesses: [], loading: false });
  const [interesses, setInteresses] = useState({}); // { ensaioId_data: true/false }
  const [processandoInteresse, setProcessandoInteresse] = useState({});
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [formData, setFormData] = useState({
    nome_encarregado: '',
    tipo: '',
    celular: '',
    instrumento: '',
    categoria_instrumento: '',
    dia_semana: '',
    semana_mes: '',
    horario: '',
    nome_igreja: '',
    endereco: '',
    cidade: '',
    estado: '',
    foto: null,
  });
  const [proximaData, setProximaData] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEnsaios();
  }, []);

  useEffect(() => {
    if (activeTab === 'todos') {
      loadEnsaiosPublicos();
      loadInteressesPublicos();
    }
  }, [activeTab]);

  const loadEnsaios = async () => {
    try {
      const response = await api.get('/ensaio/meus');
      console.log('[FRONTEND] Resposta da API /ensaio/meus:', response.data);
      
      // Garantir que ensaios com dia_semana e semana_mes tenham proxima_data calculada
      const ensaiosComData = response.data.map(ensaio => {
        console.log(`[FRONTEND] Ensaio ${ensaio.id}:`, {
          dia_semana: ensaio.dia_semana,
          semana_mes: ensaio.semana_mes,
          proxima_data: ensaio.proxima_data,
          tipo_proxima_data: typeof ensaio.proxima_data
        });
        
        // Se o ensaio tem dia_semana e semana_mes mas não tem proxima_data, calcular
        if (ensaio.dia_semana && ensaio.semana_mes && !ensaio.proxima_data) {
          console.warn(`[FRONTEND] Ensaio ${ensaio.id} não tem proxima_data!`);
        }
        return ensaio;
      });
      
      console.log('[FRONTEND] Ensaios processados:', ensaiosComData);
      setEnsaios(ensaiosComData);
    } catch (err) {
      console.error('Erro ao carregar ensaios:', err);
    } finally {
      setLoading(false);
    }
  };

  const calcularProximaData = (diaSemana, semanaMes) => {
    if (!diaSemana || !semanaMes) {
      setProximaData(null);
      return;
    }

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
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
      setProximaData(null);
      return;
    }
    
    const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
    const diaSemanaPrimeiro = primeiroDiaMes.getDay();
    
    let diasAtePrimeiro = (diaSemanaNum - diaSemanaPrimeiro + 7) % 7;
    if (diasAtePrimeiro === 0 && diaSemanaNum !== diaSemanaPrimeiro) {
      diasAtePrimeiro = 7;
    }
    
    let data;
    const semanaMesNum = parseInt(semanaMes);
    
    if (semanaMesNum === -1) {
      const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);
      const diaSemanaUltimo = ultimoDiaMes.getDay();
      let diasAteUltimo = (diaSemanaNum - diaSemanaUltimo + 7) % 7;
      if (diasAteUltimo === 0 && diaSemanaNum !== diaSemanaUltimo) {
        diasAteUltimo = 7;
      }
      data = new Date(anoAtual, mesAtual, ultimoDiaMes.getDate() - diasAteUltimo);
    } else {
      const dia = 1 + diasAtePrimeiro + (semanaMesNum - 1) * 7;
      data = new Date(anoAtual, mesAtual, dia);
    }
    
    // Normalizar datas para comparar apenas o dia (sem hora)
    const dataNormalizada = new Date(data);
    dataNormalizada.setHours(0, 0, 0, 0);
    const hojeNormalizado = new Date(hoje);
    hojeNormalizado.setHours(0, 0, 0, 0);
    
    // Se a data já passou neste mês (não inclui hoje), calcular para o próximo mês
    if (dataNormalizada < hojeNormalizado) {
      if (semanaMesNum === -1) {
        const proximoMes = mesAtual + 1;
        const ultimoDiaProximoMes = new Date(anoAtual, proximoMes + 1, 0);
        const diaSemanaUltimo = ultimoDiaProximoMes.getDay();
        let diasAteUltimo = (diaSemanaNum - diaSemanaUltimo + 7) % 7;
        if (diasAteUltimo === 0 && diaSemanaNum !== diaSemanaUltimo) {
          diasAteUltimo = 7;
        }
        data = new Date(anoAtual, proximoMes, ultimoDiaProximoMes.getDate() - diasAteUltimo);
      } else {
        const proximoMes = mesAtual + 1;
        const primeiroDiaProximoMes = new Date(anoAtual, proximoMes, 1);
        const diaSemanaPrimeiroProximo = primeiroDiaProximoMes.getDay();
        let diasAtePrimeiroProximo = (diaSemanaNum - diaSemanaPrimeiroProximo + 7) % 7;
        if (diasAtePrimeiroProximo === 0 && diaSemanaNum !== diaSemanaPrimeiroProximo) {
          diasAtePrimeiroProximo = 7;
        }
        const diaProximo = 1 + diasAtePrimeiroProximo + (semanaMesNum - 1) * 7;
        data = new Date(anoAtual, proximoMes, diaProximo);
      }
    }
    
    setProximaData(data.toLocaleDateString('pt-BR'));
  };

  const handleChange = (e) => {
    if (e.target.name === 'foto') {
      setFormData({
        ...formData,
        foto: e.target.files[0],
      });
    } else {
      const newFormData = {
        ...formData,
        [e.target.name]: e.target.value,
      };
      
      // Se o campo mudado for instrumento, preencher automaticamente a categoria
      if (e.target.name === 'instrumento') {
        const categoria = getCategoriaInstrumento(e.target.value);
        newFormData.categoria_instrumento = categoria || '';
      }
      
      setFormData(newFormData);
      
      // Calcular próxima data quando dia_semana ou semana_mes mudarem
      if (e.target.name === 'dia_semana' || e.target.name === 'semana_mes') {
        const diaSemana = e.target.name === 'dia_semana' ? e.target.value : newFormData.dia_semana;
        const semanaMes = e.target.name === 'semana_mes' ? e.target.value : newFormData.semana_mes;
        calcularProximaData(diaSemana, semanaMes);
      }
    }
  };

  const handleEdit = (ensaio) => {
    setEditingId(ensaio.id);
    // Normalizar dia_semana para minúsculas se existir
    const diaSemanaNormalizado = ensaio.dia_semana ? ensaio.dia_semana.toLowerCase() : '';
    setFormData({
      nome_encarregado: ensaio.nome_encarregado || '',
      tipo: ensaio.tipo || '',
      celular: ensaio.celular || '',
      instrumento: ensaio.instrumento || '',
      categoria_instrumento: ensaio.categoria_instrumento || '',
      dia_semana: diaSemanaNormalizado,
      semana_mes: ensaio.semana_mes ? String(ensaio.semana_mes) : '',
      horario: ensaio.horario || '',
      nome_igreja: ensaio.nome_igreja || ensaio.local || '',
      endereco: ensaio.endereco || '',
      cidade: ensaio.cidade || '',
      estado: ensaio.estado || '',
      foto: null,
    });
    if (diaSemanaNormalizado && ensaio.semana_mes) {
      calcularProximaData(diaSemanaNormalizado, String(ensaio.semana_mes));
    }
    setShowForm(true);
    setError('');
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      nome_encarregado: '',
      tipo: '',
      celular: '',
      instrumento: '',
      categoria_instrumento: '',
      dia_semana: '',
      semana_mes: '',
      horario: '',
      nome_igreja: '',
      endereco: '',
      cidade: '',
      estado: '',
      foto: null,
    });
    setProximaData(null);
    setError('');
  };

  const loadInteresses = async (ensaioId) => {
    setInteressesModal({ ensaioId, interesses: [], loading: true });
    try {
      const response = await api.get(`/interesse/ensaio/${ensaioId}`);
      setInteressesModal({ ensaioId, interesses: response.data, loading: false });
    } catch (err) {
      console.error('Erro ao carregar interesses:', err);
      setInteressesModal({ ensaioId, interesses: [], loading: false });
    }
  };

  const handleRemoverInteresse = async (interesseId, musicoId) => {
    if (!window.confirm('Deseja remover o interesse deste músico?')) {
      return;
    }

    try {
      await api.delete(`/interesse/${interessesModal.ensaioId}`, {
        data: { musico_id: musicoId }
      });
      // Recarregar interesses
      loadInteresses(interessesModal.ensaioId);
    } catch (err) {
      console.error('Erro ao remover interesse:', err);
      alert(err.response?.data?.error || 'Erro ao remover interesse');
    }
  };

  const loadEnsaiosPublicos = async () => {
    setLoadingPublicos(true);
    try {
      const response = await api.get('/ensaio/public');
      setEnsaiosPublicos(response.data);
    } catch (err) {
      console.error('Erro ao carregar ensaios públicos:', err);
    } finally {
      setLoadingPublicos(false);
    }
  };

  const loadInteressesPublicos = React.useCallback(async () => {
    const interessesMap = {};
    for (const ensaio of ensaiosPublicos) {
      if (ensaio.proxima_data) {
        const ensaioId = ensaio.id_original || ensaio.id;
        try {
          const response = await api.get(`/interesse/verificar/${ensaioId}?data_ensaio=${ensaio.proxima_data}`);
          const chave = `${ensaioId}_${ensaio.proxima_data}`;
          interessesMap[chave] = response.data.temInteresse;
        } catch (err) {
          console.error('Erro ao verificar interesse:', err);
        }
      }
    }
    setInteresses(interessesMap);
  }, [ensaiosPublicos]);

  useEffect(() => {
    if (activeTab === 'todos' && ensaiosPublicos.length > 0) {
      loadInteressesPublicos();
    }
  }, [ensaiosPublicos, activeTab, loadInteressesPublicos]);

  const handleInteresse = async (ensaio) => {
    const ensaioId = ensaio.id_original || ensaio.id;
    const dataEnsaio = ensaio.proxima_data;
    const chave = `${ensaioId}_${dataEnsaio}`;
    
    if (!dataEnsaio) {
      alert('Data do ensaio não disponível');
      return;
    }

    setProcessandoInteresse({ ...processandoInteresse, [chave]: true });

    try {
      const temInteresse = interesses[chave];
      
      if (temInteresse) {
        // Remover interesse
        await api.delete(`/interesse/${ensaioId}`, { data: { data_ensaio: dataEnsaio } });
        setInteresses({ ...interesses, [chave]: false });
      } else {
        // Adicionar interesse
        await api.post(`/interesse/${ensaioId}`, { data_ensaio: dataEnsaio });
        setInteresses({ ...interesses, [chave]: true });
      }
    } catch (err) {
      console.error('Erro ao processar interesse:', err);
      alert(err.response?.data?.error || 'Erro ao processar interesse');
    } finally {
      setProcessandoInteresse({ ...processandoInteresse, [chave]: false });
    }
  };

  const adicionarAgenda = (ensaio) => {
    try {
      const dataEnsaio = ensaio.proxima_data;
      if (!dataEnsaio) return;

      // Parse da data e horário
      const [ano, mes, dia] = dataEnsaio.split('-');
      let horaInicio = '19:00';
      let horaFim = '21:00';
      
      if (ensaio.horario) {
        const partesHorario = ensaio.horario.split(':');
        const h = partesHorario[0] || '19';
        const m = partesHorario[1] || '00';
        horaInicio = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const horaFimObj = new Date(`2000-01-01T${horaInicio}:00`);
        horaFimObj.setHours(horaFimObj.getHours() + 2);
        horaFim = `${String(horaFimObj.getHours()).padStart(2, '0')}:${String(horaFimObj.getMinutes()).padStart(2, '0')}`;
      }

      const nomeIgreja = ensaio.nome_igreja || ensaio.local || 'Ensaio Musical';
      const descricaoTexto = `Ensaio musical${ensaio.nome_encarregado ? `\nEncarregado: ${ensaio.nome_encarregado}` : ''}${ensaio.endereco ? `\nLocal: ${ensaio.endereco}` : ''}`;
      const localTexto = ensaio.endereco ? 
        `${ensaio.endereco}${ensaio.cidade ? `, ${ensaio.cidade}` : ''}${ensaio.estado ? ` - ${ensaio.estado}` : ''}` :
        'Local a confirmar';

      const formatarDataHora = (data, hora) => {
        const [h, m] = hora.split(':');
        return `${data.replace(/-/g, '')}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
      };

      const dataInicio = formatarDataHora(dataEnsaio, horaInicio);
      const dataFim = formatarDataHora(dataEnsaio, horaFim);

      const titulo = encodeURIComponent(`Ensaio - ${nomeIgreja}`);
      const descricao = encodeURIComponent(descricaoTexto);
      const local = encodeURIComponent(localTexto);

      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${dataInicio}/${dataFim}&details=${descricao}&location=${local}`;

      window.open(googleCalendarUrl, '_blank');
    } catch (e) {
      console.error('Erro ao adicionar à agenda:', e);
      alert('Não foi possível adicionar à agenda. Tente novamente.');
    }
  };

  const ensaiosPublicosOrdenados = [...ensaiosPublicos].sort((a, b) => {
    if (!a.proxima_data) return 1;
    if (!b.proxima_data) return -1;
    return new Date(a.proxima_data) - new Date(b.proxima_data);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const data = new FormData();
    data.append('nome_encarregado', formData.nome_encarregado);
    data.append('tipo', formData.tipo);
    data.append('celular', formData.celular);
    data.append('instrumento', formData.instrumento);
    data.append('categoria_instrumento', formData.categoria_instrumento);
    data.append('dia_semana', formData.dia_semana);
    data.append('semana_mes', formData.semana_mes);
    data.append('horario', formData.horario);
    data.append('nome_igreja', formData.nome_igreja);
    data.append('endereco', formData.endereco);
    data.append('cidade', formData.cidade);
    data.append('estado', formData.estado);
    if (formData.foto) {
      data.append('foto', formData.foto);
    }

    try {
      if (editingId) {
        // Editar ensaio existente
        await api.put(`/ensaio/${editingId}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Criar novo ensaio
        await api.post('/ensaio', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      handleCancelEdit();
      loadEnsaios();
    } catch (err) {
      setError(err.response?.data?.error || (editingId ? 'Erro ao atualizar ensaio' : 'Erro ao criar ensaio'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pendente: { text: 'Pendente', class: 'status-pendente' },
      aprovado: { text: 'Aprovado', class: 'status-aprovado' },
      rejeitado: { text: 'Rejeitado', class: 'status-rejeitado' },
    };
    const statusInfo = statusMap[status] || statusMap.pendente;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-container">
            <img 
              src="/logo.png" 
              alt="Partiu Ensaio" 
              className="logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="logo-text">
              <span className="partiu">Partiu</span>
              <span className="ensaio">Ensaio</span>
            </div>
          </div>
          <div className="header-actions">
            <span className="user-name">Olá, {user.name}</span>
            <Link to="/" className="btn-link">Ver Público</Link>
            <button onClick={() => setShowReport(true)} className="btn-link">Reportar problema</button>
            <button onClick={() => setShowAlterarSenha(true)} className="btn-link">Alterar Senha</button>
            <button onClick={onLogout} className="btn-secondary">Sair</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="page-header">
            <h2>Dashboard Encarregado</h2>
            {!showForm && activeTab === 'meus' && (
              <button onClick={() => {
                setEditingId(null);
                setShowForm(true);
                setFormData({
                  nome_encarregado: '',
                  tipo: '',
                  celular: '',
                  instrumento: '',
                  categoria_instrumento: '',
                  dia_semana: '',
                  semana_mes: '',
                  horario: '',
                  nome_igreja: '',
                  endereco: '',
                  cidade: '',
                  estado: '',
                  foto: null,
                });
                setProximaData(null);
                setError('');
              }} className="btn-primary">
                + Novo Ensaio
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'meus' ? 'active' : ''}`}
              onClick={() => setActiveTab('meus')}
            >
              Meus Ensaios ({ensaios.length})
            </button>
            <button
              className={`tab ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              Todos os Ensaios ({ensaiosPublicos.length})
            </button>
          </div>

          {/* Conteúdo da aba Meus Ensaios */}
          {activeTab === 'meus' && (
            <>
              {showForm && (
            <div className="form-card">
              <h3>{editingId ? 'Editar Ensaio' : 'Cadastrar Novo Ensaio'}</h3>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="nome_encarregado">Nome do Encarregado *</label>
                  <input
                    type="text"
                    id="nome_encarregado"
                    name="nome_encarregado"
                    value={formData.nome_encarregado}
                    onChange={handleChange}
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tipo">Tipo *</label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="local">Local</option>
                      <option value="regional">Regional</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="celular">Celular *</label>
                    <input
                      type="tel"
                      id="celular"
                      name="celular"
                      value={formData.celular}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dia_semana">Dia da Semana</label>
                    <select
                      id="dia_semana"
                      name="dia_semana"
                      value={formData.dia_semana}
                      onChange={handleChange}
                    >
                      <option value="">Selecione...</option>
                      <option value="segunda-feira">Segunda-feira</option>
                      <option value="terça-feira">Terça-feira</option>
                      <option value="quarta-feira">Quarta-feira</option>
                      <option value="quinta-feira">Quinta-feira</option>
                      <option value="sexta-feira">Sexta-feira</option>
                      <option value="sábado">Sábado</option>
                      <option value="domingo">Domingo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="semana_mes">Semana do Mês</label>
                    <select
                      id="semana_mes"
                      name="semana_mes"
                      value={formData.semana_mes}
                      onChange={handleChange}
                      disabled={!formData.dia_semana}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">1ª Semana</option>
                      <option value="2">2ª Semana</option>
                      <option value="3">3ª Semana</option>
                      <option value="4">4ª Semana</option>
                      <option value="-1">Última Semana</option>
                    </select>
                  </div>
                </div>
                {proximaData && (
                  <div className="form-group info-box">
                    <strong>📅 Próxima data do ensaio: {proximaData}</strong>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="horario">Horário *</label>
                    <input
                      type="time"
                      id="horario"
                      name="horario"
                      value={formData.horario}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="instrumento">Instrumento que Toca</label>
                    <select
                      id="instrumento"
                      name="instrumento"
                      value={formData.instrumento}
                      onChange={handleChange}
                    >
                      <option value="">Selecione um instrumento...</option>
                      {instrumentos.map((inst, index) => (
                        <option key={index} value={inst.nome}>
                          {inst.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="categoria_instrumento">Categoria</label>
                    <input
                      type="text"
                      id="categoria_instrumento"
                      name="categoria_instrumento"
                      value={formData.categoria_instrumento}
                      readOnly
                      placeholder="Preenchido automaticamente"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="nome_igreja">Nome da Igreja *</label>
                  <input
                    type="text"
                    id="nome_igreja"
                    name="nome_igreja"
                    value={formData.nome_igreja}
                    onChange={handleChange}
                    placeholder="Ex: CCB Bairro"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endereco">Endereço *</label>
                  <input
                    type="text"
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Rua, número, bairro"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cidade">Cidade</label>
                    <input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="estado">Estado</label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                    >
                      <option value="">Selecione...</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="foto">Foto do Local</label>
                  <input
                    type="file"
                    id="foto"
                    name="foto"
                    accept="image/*"
                    onChange={handleChange}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Salvando...' : editingId ? 'Atualizar Ensaio' : 'Salvar Ensaio'}
                  </button>
                  <button type="button" onClick={handleCancelEdit} className="btn-secondary" disabled={submitting}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Carregando ensaios...</div>
          ) : ensaios.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não cadastrou nenhum ensaio.</p>
              <p>Clique em "Novo Ensaio" para começar!</p>
            </div>
          ) : (
            <div className="ensaios-grid">
              {ensaios.map((ensaio) => (
                <div key={ensaio.id} className="ensaio-card">
                  {ensaio.foto_local && (
                    <div className="ensaio-image">
                      <img
                        src={`${getBaseUrl()}${ensaio.foto_local}`}
                        alt={ensaio.nome_igreja || ensaio.local || 'Local do ensaio'}
                        loading="lazy"
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', `${getBaseUrl()}${ensaio.foto_local}`);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Imagem carregada com sucesso:', `${getBaseUrl()}${ensaio.foto_local}`);
                        }}
                      />
                    </div>
                  )}
                  <div className="ensaio-content">
                    <div className="ensaio-header">
                      <h3>{ensaio.nome_igreja || ensaio.local || 'Igreja não informada'}</h3>
                      {getStatusBadge(ensaio.status)}
                    </div>
                    <div className="ensaio-info">
                      <p><strong>Encarregado:</strong> {ensaio.nome_encarregado || 'N/A'}</p>
                      {ensaio.instrumento && (
                        <p>
                          <strong>Instrumento:</strong> {ensaio.instrumento}
                          {ensaio.categoria_instrumento && (
                            <span> ({ensaio.categoria_instrumento})</span>
                          )}
                        </p>
                      )}
                      <p><strong>Tipo:</strong> {ensaio.tipo ? ensaio.tipo.charAt(0).toUpperCase() + ensaio.tipo.slice(1) : 'N/A'}</p>
                      <p><strong>Celular:</strong> {ensaio.celular || 'N/A'}</p>
                      {ensaio.dia_semana && (
                        <p>
                          <strong>Dia:</strong> {ensaio.dia_semana}
                          {ensaio.semana_mes && (
                            <span> - {ensaio.semana_mes === -1 ? 'Última' : `${ensaio.semana_mes}ª`} semana do mês</span>
                          )}
                        </p>
                      )}
                      {(() => {
                        // Sempre tentar exibir a próxima data se existir
                        if (ensaio.proxima_data) {
                          try {
                            // Normalizar a data (pode vir como string YYYY-MM-DD ou Date)
                            let dataStr = ensaio.proxima_data;
                            if (ensaio.proxima_data instanceof Date) {
                              const ano = ensaio.proxima_data.getFullYear();
                              const mes = String(ensaio.proxima_data.getMonth() + 1).padStart(2, '0');
                              const dia = String(ensaio.proxima_data.getDate()).padStart(2, '0');
                              dataStr = `${ano}-${mes}-${dia}`;
                            } else if (typeof ensaio.proxima_data === 'string' && ensaio.proxima_data.includes('T')) {
                              // Se vier como ISO string, converter para YYYY-MM-DD
                              const dataObj = new Date(ensaio.proxima_data);
                              if (!isNaN(dataObj.getTime())) {
                                const ano = dataObj.getFullYear();
                                const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
                                const dia = String(dataObj.getDate()).padStart(2, '0');
                                dataStr = `${ano}-${mes}-${dia}`;
                              }
                            }
                            
                            const dataObj = new Date(dataStr + 'T00:00:00');
                            if (isNaN(dataObj.getTime())) {
                              console.warn(`[FRONTEND] Data inválida para ensaio ${ensaio.id}:`, ensaio.proxima_data);
                              return null;
                            }
                            
                            return (
                              <p><strong>📅 Próxima data:</strong> {dataObj.toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                timeZone: 'America/Sao_Paulo'
                              })}
                              {ensaio.horario && (
                                <span> às {ensaio.horario}</span>
                              )}
                              </p>
                            );
                          } catch (e) {
                            console.error(`[FRONTEND] Erro ao formatar data do ensaio ${ensaio.id}:`, e, ensaio.proxima_data);
                            return null;
                          }
                        }
                        return null;
                      })()}
                      {ensaio.horario && !ensaio.proxima_data && (
                        <p><strong>Horário:</strong> {ensaio.horario}</p>
                      )}
                      <p><strong>Igreja:</strong> {ensaio.nome_igreja || ensaio.local || 'N/A'}</p>
                      <p>
                        <strong>Endereço:</strong> {ensaio.endereco || 'N/A'}
                        {ensaio.endereco && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ensaio.endereco + (ensaio.cidade ? `, ${ensaio.cidade}` : '') + (ensaio.estado ? `, ${ensaio.estado}` : ''))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="maps-link"
                            title="Abrir no Google Maps"
                          >
                            {' '}📍 Ver no Maps
                          </a>
                        )}
                      </p>
                      {ensaio.cidade && <p><strong>Cidade:</strong> {ensaio.cidade}</p>}
                      {ensaio.estado && <p><strong>Estado:</strong> {ensaio.estado}</p>}
                    </div>
                    <div className="ensaio-footer">
                      <div className="ensaio-footer-content">
                        <small>
                          Criado em: {new Date(ensaio.created_at).toLocaleDateString('pt-BR')}
                        </small>
                        <div className="ensaio-footer-buttons">
                          <button 
                            onClick={() => loadInteresses(ensaio.id)} 
                            className="btn-interesses"
                            title="Ver músicos interessados"
                          >
                            👥 Interessados
                          </button>
                          <button 
                            onClick={() => handleEdit(ensaio)} 
                            className="btn-edit"
                            title="Editar ensaio"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {/* Conteúdo da aba Todos os Ensaios */}
          {activeTab === 'todos' && (
            <div>
              {loadingPublicos ? (
                <div className="loading">Carregando ensaios...</div>
              ) : ensaiosPublicosOrdenados.length === 0 ? (
                <div className="empty-state">
                  <p>Não há ensaios públicos disponíveis no momento.</p>
                </div>
              ) : (
                <div className="ensaios-publicos">
                  <div className="ensaios-grid">
                    {ensaiosPublicosOrdenados.map((ensaio) => (
                      <div key={ensaio.id} className="ensaio-card">
                        {ensaio.foto_local && (
                          <div className="ensaio-image">
                            <img
                              key={`img-${ensaio.id}`}
                              src={`${getBaseUrl()}${ensaio.foto_local}`}
                              alt={ensaio.nome_igreja || ensaio.local || 'Local do ensaio'}
                              loading="lazy"
                              onError={(e) => {
                                const retryCount = parseInt(e.target.dataset.retryCount || '0', 10);
                                if (retryCount >= 1) {
                                  console.error('❌ Imagem não carregou após tentativas:', `${getBaseUrl()}${ensaio.foto_local}`);
                                  e.target.style.display = 'none';
                                  return;
                                }
                                const baseUrl = getBaseUrl();
                                const retryUrl = `${baseUrl}${ensaio.foto_local}?t=${Date.now()}&retry=1`;
                                console.warn('⚠️ Erro ao carregar imagem, tentando novamente:', retryUrl);
                                e.target.dataset.retryCount = '1';
                                e.target.src = retryUrl;
                              }}
                              onLoad={(e) => {
                                e.target.dataset.retryCount = '0';
                                console.log('✅ Imagem carregada:', `${getBaseUrl()}${ensaio.foto_local}`);
                              }}
                            />
                          </div>
                        )}
                        <div className="ensaio-content">
                          <div className="ensaio-header">
                            <h3>{ensaio.nome_igreja || ensaio.local || 'Sem nome'}</h3>
                            <span className="status-badge status-aprovado">Aprovado</span>
                          </div>
                          <div className="ensaio-info">
                            {ensaio.proxima_data && (() => {
                              try {
                                const dataObj = new Date(ensaio.proxima_data + 'T00:00:00');
                                if (isNaN(dataObj.getTime())) {
                                  return null;
                                }
                                return (
                                  <p className="data-destaque">
                                    📅 {dataObj.toLocaleDateString('pt-BR', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric',
                                      timeZone: 'America/Sao_Paulo'
                                    })}
                                    {ensaio.horario && (
                                      <span> às {ensaio.horario}</span>
                                    )}
                                  </p>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}
                            <p><strong>Encarregado:</strong> {ensaio.nome_encarregado || ensaio.encarregado_name || 'N/A'}</p>
                            {ensaio.instrumento && (
                              <p>
                                <strong>Instrumento do Encarregado:</strong> {ensaio.instrumento}
                                {ensaio.categoria_instrumento && (
                                  <span> ({ensaio.categoria_instrumento})</span>
                                )}
                              </p>
                            )}
                            <p><strong>Tipo:</strong> {ensaio.tipo ? ensaio.tipo.charAt(0).toUpperCase() + ensaio.tipo.slice(1) : 'N/A'}</p>
                            {ensaio.dia_semana && (
                              <p>
                                <strong>Dia:</strong> {ensaio.dia_semana}
                                {ensaio.semana_mes && (
                                  <span> - {ensaio.semana_mes === -1 ? 'Última' : `${ensaio.semana_mes}ª`} semana do mês</span>
                                )}
                              </p>
                            )}
                            {ensaio.horario && (
                              <p><strong>Horário:</strong> {ensaio.horario}</p>
                            )}
                            <p>
                              <strong>Endereço:</strong> {ensaio.endereco || 'N/A'}
                              {ensaio.endereco && (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ensaio.endereco + (ensaio.cidade ? `, ${ensaio.cidade}` : '') + (ensaio.estado ? `, ${ensaio.estado}` : ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="maps-link"
                                  title="Abrir no Google Maps"
                                >
                                  {' '}📍 Ver no Maps
                                </a>
                              )}
                            </p>
                            {ensaio.cidade && <p><strong>Cidade:</strong> {ensaio.cidade}</p>}
                            {ensaio.estado && <p><strong>Estado:</strong> {ensaio.estado}</p>}
                          </div>
                          <div className="ensaio-actions">
                            {ensaio.proxima_data && (ensaio.id_original || ensaio.id) && (
                              <button
                                onClick={() => handleInteresse(ensaio)}
                                disabled={processandoInteresse[`${ensaio.id_original || ensaio.id}_${ensaio.proxima_data}`]}
                                className={`btn-interesse ${interesses[`${ensaio.id_original || ensaio.id}_${ensaio.proxima_data}`] ? 'interesse-ativo' : ''}`}
                              >
                                {processandoInteresse[`${ensaio.id_original || ensaio.id}_${ensaio.proxima_data}`] 
                                  ? 'Processando...' 
                                  : interesses[`${ensaio.id_original || ensaio.id}_${ensaio.proxima_data}`]
                                  ? '✓ Tenho Interesse'
                                  : 'Tenho Interesse'}
                              </button>
                            )}
                            {interesses[`${ensaio.id_original || ensaio.id}_${ensaio.proxima_data}`] && ensaio.proxima_data && (
                              <button
                                onClick={() => adicionarAgenda(ensaio)}
                                className="btn-link"
                                style={{ marginLeft: '10px' }}
                                title="Adicionar evento ao calendário"
                              >
                                📅 Adicionar à Agenda
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Interessados */}
      {interessesModal.ensaioId && (
        <div className="modal-overlay" onClick={() => setInteressesModal({ ensaioId: null, interesses: [], loading: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Músicos Interessados</h3>
              <button 
                className="modal-close"
                onClick={() => setInteressesModal({ ensaioId: null, interesses: [], loading: false })}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {interessesModal.loading ? (
                <div className="loading">Carregando...</div>
              ) : interessesModal.interesses.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum músico demonstrou interesse ainda.</p>
                </div>
              ) : (
                <div className="interesses-list">
                  {interessesModal.interesses.map((interesse) => (
                    <div key={interesse.id} className="interesse-item">
                      <div className="interesse-info">
                        <h4>{interesse.musico_name}</h4>
                        <p><strong>Email:</strong> {interesse.musico_email}</p>
                        {interesse.instrumento && (
                          <p><strong>Instrumento:</strong> {interesse.instrumento} {interesse.categoria_instrumento && `(${interesse.categoria_instrumento})`}</p>
                        )}
                        {interesse.celular && <p><strong>Celular:</strong> {interesse.celular}</p>}
                        {interesse.cidade && <p><strong>Cidade:</strong> {interesse.cidade}, {interesse.estado}</p>}
                        <p><strong>Data do Ensaio:</strong> {(() => {
                          try {
                            const dataObj = new Date(interesse.data_ensaio + 'T00:00:00');
                            if (isNaN(dataObj.getTime())) {
                              return interesse.data_ensaio || 'Data inválida';
                            }
                            return dataObj.toLocaleDateString('pt-BR');
                          } catch (e) {
                            return interesse.data_ensaio || 'Data inválida';
                          }
                        })()}</p>
                        <p><small>Interesse registrado em: {new Date(interesse.created_at).toLocaleDateString('pt-BR')}</small></p>
                      </div>
                      <button
                        onClick={() => handleRemoverInteresse(interesse.id, interesse.musico_id)}
                        className="btn-remover-interesse"
                        title="Remover interesse"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <AlterarSenha 
        isOpen={showAlterarSenha}
        onClose={() => setShowAlterarSenha(false)}
      />
      <ReportarProblema
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        userRole="encarregado"
      />
    </div>
  );
};

export default DashboardEncarregado;
