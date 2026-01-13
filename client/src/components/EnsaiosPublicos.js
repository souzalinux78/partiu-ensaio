import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import { getAuthToken, getUser } from '../utils/auth';
import './Dashboard.css';

const EnsaiosPublicos = () => {
  const [ensaios, setEnsaios] = useState([]);
  const [ensaiosFiltrados, setEnsaiosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [interesses, setInteresses] = useState({});
  const [processandoInteresse, setProcessandoInteresse] = useState({});
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  const loadEnsaiosRef = useRef(null);

  useEffect(() => {
    // Verificar se há usuário logado
    const token = getAuthToken();
    const userData = getUser();
    if (token && userData) {
      setUser(userData);
    }
    loadEnsaios();
    
    // Verificar mudança de mês e atualizar ensaios periodicamente
    const interval = setInterval(() => {
      const agora = new Date();
      const mesAtualAgora = agora.getMonth();
      const anoAtualAgora = agora.getFullYear();
      
      // Atualizar estado do mês/ano se mudou
      setMesAtual(prevMes => {
        if (mesAtualAgora !== prevMes) {
          console.log('Mês mudou! Recarregando ensaios...');
          return mesAtualAgora;
        }
        return prevMes;
      });
      
      setAnoAtual(prevAno => {
        if (anoAtualAgora !== prevAno) {
          console.log('Ano mudou! Recarregando ensaios...');
          return anoAtualAgora;
        }
        return prevAno;
      });
      
      // Sempre recarregar ensaios para pegar atualizações (ex: passou das 20h, mudou de mês)
      if (loadEnsaiosRef.current) {
        loadEnsaiosRef.current();
      }
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, []);

  const loadInteresses = useCallback(async () => {
    if (!user || user.role !== 'musico') return;
    
    const interessesMap = {};
    for (const ensaio of ensaios) {
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
  }, [user, ensaios]);

  // Carregar interesses se o usuário for músico
  useEffect(() => {
    if (user && user.role === 'musico' && ensaios.length > 0) {
      loadInteresses();
    }
  }, [ensaios, user, loadInteresses]);

  const loadEnsaios = useCallback(async () => {
    try {
      const response = await api.get('/ensaio/public');
      setEnsaios(response.data);
      setEnsaiosFiltrados(response.data);
    } catch (err) {
      console.error('Erro ao carregar ensaios:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Atualizar referência
  useEffect(() => {
    loadEnsaiosRef.current = loadEnsaios;
  }, [loadEnsaios]);

  // Carregar ensaios ao montar
  useEffect(() => {
    loadEnsaios();
  }, [loadEnsaios]);

  // Função para filtrar ensaios
  const filtrarEnsaios = (termo, listaEnsaios) => {
    const listaParaFiltrar = listaEnsaios || ensaios;
    
    if (!termo || termo.trim() === '') {
      setEnsaiosFiltrados(listaParaFiltrar);
      return;
    }

    const termoLower = termo.toLowerCase().trim();
    const ensaiosFiltrados = listaParaFiltrar.filter(ensaio => {
      // Pesquisar por data
      if (ensaio.proxima_data) {
        try {
          const dataObj = new Date(ensaio.proxima_data + 'T00:00:00');
          if (!isNaN(dataObj.getTime())) {
            const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'America/Sao_Paulo'
            });
            if (dataFormatada.toLowerCase().includes(termoLower)) {
              return true;
            }
          }
        } catch (e) {
          // Ignorar erro de data inválida
        }
        // Também pesquisar pela data no formato YYYY-MM-DD
        if (ensaio.proxima_data.toLowerCase().includes(termoLower)) {
          return true;
        }
      }

      // Pesquisar por nome da igreja
      if (ensaio.nome_igreja && ensaio.nome_igreja.toLowerCase().includes(termoLower)) {
        return true;
      }
      if (ensaio.local && ensaio.local.toLowerCase().includes(termoLower)) {
        return true;
      }

      // Pesquisar por cidade
      if (ensaio.cidade && ensaio.cidade.toLowerCase().includes(termoLower)) {
        return true;
      }

      // Pesquisar por estado
      if (ensaio.estado && ensaio.estado.toLowerCase().includes(termoLower)) {
        return true;
      }

      // Pesquisar por endereço/localidade
      if (ensaio.endereco && ensaio.endereco.toLowerCase().includes(termoLower)) {
        return true;
      }

      // Pesquisar por nome do encarregado
      if (ensaio.nome_encarregado && ensaio.nome_encarregado.toLowerCase().includes(termoLower)) {
        return true;
      }
      if (ensaio.encarregado_name && ensaio.encarregado_name.toLowerCase().includes(termoLower)) {
        return true;
      }

      return false;
    });

    setEnsaiosFiltrados(ensaiosFiltrados);
  };

  // Atualizar filtro quando o termo de pesquisa mudar
  useEffect(() => {
    filtrarEnsaios(termoPesquisa, ensaios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termoPesquisa, ensaios]);


  const handleInteresse = async (ensaio) => {
    // Se não estiver logado, redirecionar para login/cadastro
    if (!user) {
      const confirmar = window.confirm('Para demonstrar interesse, você precisa estar logado como músico. Deseja fazer login ou se cadastrar?');
      if (confirmar) {
        navigate('/login');
      }
      return;
    }

    // Se não for músico, mostrar mensagem
    if (user.role !== 'musico') {
      alert('Apenas músicos podem demonstrar interesse em ensaios. Faça login como músico para continuar.');
      return;
    }

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
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        navigate('/login');
      } else {
        alert(err.response?.data?.error || 'Erro ao processar interesse');
      }
    } finally {
      setProcessandoInteresse({ ...processandoInteresse, [chave]: false });
    }
  };

  // Filtrar e ordenar ensaios do mês atual (ou próximo se todos já passaram)
  const filtrarEnsaiosDoMes = (listaEnsaios) => {
    const hoje = new Date();
    const horaAtual = hoje.getHours();
    const hojeNormalizado = new Date();
    hojeNormalizado.setHours(0, 0, 0, 0);
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
    const inicioProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const fimProximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0, 23, 59, 59);
    
    // Separar ensaios do mês atual e próximo mês
    const ensaiosMesAtual = [];
    const ensaiosProximoMes = [];
    
    listaEnsaios.forEach(ensaio => {
      if (!ensaio.proxima_data) return;
      
      try {
        const dataEnsaio = new Date(ensaio.proxima_data + 'T00:00:00');
        if (isNaN(dataEnsaio.getTime())) return;
        
        const estaNoMesAtual = dataEnsaio >= inicioMes && dataEnsaio <= fimMes;
        const estaNoProximoMes = dataEnsaio >= inicioProximoMes && dataEnsaio <= fimProximoMes;
        
        if (estaNoMesAtual) {
          // Verificar se ainda não passou (considerando horário de 20h)
          const diffDays = Math.floor((dataEnsaio - hojeNormalizado) / (1000 * 60 * 60 * 24));
          const aindaNaoPassou = diffDays > 0 || (diffDays === 0 && horaAtual <= 20);
          
          if (aindaNaoPassou) {
            ensaiosMesAtual.push(ensaio);
          }
        } else if (estaNoProximoMes) {
          ensaiosProximoMes.push(ensaio);
        }
      } catch {
        // Ignorar erros
      }
    });
    
    // Se há ensaios futuros no mês atual, retornar esses
    // Se não há, retornar os do próximo mês
    return ensaiosMesAtual.length > 0 ? ensaiosMesAtual : ensaiosProximoMes;
  };

  // Filtrar ensaios do mês atual (ou próximo se todos já passaram)
  const ensaiosDoMes = filtrarEnsaiosDoMes(ensaiosFiltrados);
  
  // Ordenar ensaios filtrados por data
  const ensaiosOrdenados = [...ensaiosDoMes].sort((a, b) => {
    if (!a.proxima_data) return 1;
    if (!b.proxima_data) return -1;
    return new Date(a.proxima_data) - new Date(b.proxima_data);
  });
  
  // Determinar qual mês está sendo exibido
  const determinarMesExibido = () => {
    if (ensaiosOrdenados.length === 0) {
      return new Date(anoAtual, mesAtual, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    
    // Pegar a primeira data dos ensaios ordenados
    const primeiraData = ensaiosOrdenados[0]?.proxima_data;
    if (primeiraData) {
      try {
        const dataObj = new Date(primeiraData + 'T00:00:00');
        if (!isNaN(dataObj.getTime())) {
          return dataObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }
      } catch {
        // Se der erro, usar mês atual
      }
    }
    
    return new Date(anoAtual, mesAtual, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  const nomeMesExibido = determinarMesExibido();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Partiu Ensaio</h1>
          <div className="header-actions">
            <Link to="/login" className="btn-link">Login</Link>
            <div className="header-buttons-group">
              <Link to="/register" className="btn-secondary">Encarregado</Link>
              <Link to="/register-musico" className="btn-primary">Músico</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <h2>Agenda de Ensaios</h2>
              <p className="subtitle">
                {ensaiosOrdenados.length > 0 
                  ? `Ensaios de ${nomeMesExibido.charAt(0).toUpperCase() + nomeMesExibido.slice(1)}`
                  : 'Nenhum ensaio agendado para este período'
                }
              </p>
            </div>
          </div>

          {/* Campo de Pesquisa */}
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar por data, cidade, estado, igreja ou localidade..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="search-input"
              />
              {termoPesquisa && (
                <button
                  onClick={() => setTermoPesquisa('')}
                  className="search-clear"
                  title="Limpar pesquisa"
                >
                  ×
                </button>
              )}
            </div>
            {termoPesquisa && (
              <p className="search-results">
                {ensaiosOrdenados.length === 0 
                  ? 'Nenhum ensaio encontrado' 
                  : `${ensaiosOrdenados.length} ${ensaiosOrdenados.length === 1 ? 'ensaio encontrado' : 'ensaios encontrados'}`}
              </p>
            )}
          </div>

          {loading ? (
            <div className="loading">Carregando ensaios...</div>
          ) : ensaiosOrdenados.length === 0 ? (
            <div className="empty-state">
              <p>Não há ensaios agendados no momento.</p>
            </div>
          ) : (
            <div className="ensaios-publicos">
              <div className="ensaios-grid">
                {ensaiosOrdenados.map((ensaio) => (
                  <div key={ensaio.id} className="ensaio-card">
                    {ensaio.foto_local && (
                      <div className="ensaio-image">
                        <img
                          key={`img-${ensaio.id}`}
                          src={`${getBaseUrl()}${ensaio.foto_local}`}
                          alt={ensaio.nome_igreja || ensaio.local || 'Local do ensaio'}
                          loading="lazy"
                          onError={(e) => {
                            // Evitar loop infinito: verificar se já tentou recarregar
                            const retryCount = parseInt(e.target.dataset.retryCount || '0', 10);
                            
                            if (retryCount >= 1) {
                              // Já tentou uma vez, esconder imagem e parar
                              console.error('❌ Imagem não carregou após tentativas:', `${getBaseUrl()}${ensaio.foto_local}`);
                              e.target.style.display = 'none';
                              return;
                            }
                            
                            // Primeira tentativa: adicionar timestamp e tentar novamente
                            const baseUrl = getBaseUrl();
                            const imagePath = ensaio.foto_local;
                            const retryUrl = `${baseUrl}${imagePath}?t=${Date.now()}&retry=1`;
                            
                            console.warn('⚠️ Erro ao carregar imagem, tentando novamente:', retryUrl);
                            e.target.dataset.retryCount = '1';
                            e.target.src = retryUrl;
                          }}
                          onLoad={(e) => {
                            // Limpar contador de retry se carregou com sucesso
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EnsaiosPublicos;
