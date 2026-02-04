import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import ImageWithFallback from './ImageWithFallback';
import { getAuthToken, getUser } from '../utils/auth';
import CalendarioAgenda from './CalendarioAgenda';
import './Dashboard.css';

const EnsaiosPublicos = () => {
  const [ensaios, setEnsaios] = useState([]);
  const [ensaiosFiltrados, setEnsaiosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [interesses, setInteresses] = useState({});
  const [processandoInteresse, setProcessandoInteresse] = useState({});
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [visualizacao, setVisualizacao] = useState('lista'); // 'lista' ou 'calendario'
  const navigate = useNavigate();
  const loadEnsaiosRef = useRef(null);

  const loadEnsaios = useCallback(async () => {
    try {
      const response = await api.get('/ensaio/public');
      setEnsaios(response.data || []);
      setEnsaiosFiltrados(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar ensaios:', err);
      // Garantir que o estado seja definido mesmo em caso de erro
      setEnsaios([]);
      setEnsaiosFiltrados([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verificar se há usuário logado
    const token = getAuthToken();
    const userData = getUser();
    if (token && userData) {
      setUser(userData);
    }
    loadEnsaios();
    
    // Recarregar ensaios periodicamente para pegar atualizações
    const interval = setInterval(() => {
      if (loadEnsaiosRef.current) {
        loadEnsaiosRef.current();
      }
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, [loadEnsaios]);

  const loadInteresses = useCallback(async () => {
    if (!user || (user.role !== 'musico' && user.role !== 'encarregado')) return;
    
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

  // Carregar interesses se o usuário for músico ou encarregado
  useEffect(() => {
    if (user && (user.role === 'musico' || user.role === 'encarregado') && ensaios.length > 0) {
      loadInteresses();
    }
  }, [ensaios, user, loadInteresses]);

  // Atualizar referência
  useEffect(() => {
    loadEnsaiosRef.current = loadEnsaios;
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
      const confirmar = window.confirm('Para demonstrar interesse, você precisa estar logado. Deseja fazer login ou se cadastrar?');
      if (confirmar) {
        navigate('/login');
      }
      return;
    }

    // Permitir que músicos e encarregados possam demonstrar interesse
    if (user.role !== 'musico' && user.role !== 'encarregado') {
      alert('Apenas músicos e encarregados podem demonstrar interesse em ensaios. Faça login com uma conta válida para continuar.');
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
      
      // Usar mensagem do interceptor se disponível
      const errorMessage = err.userMessage || err.response?.data?.error || 'Erro ao processar interesse';
      
      // Não mostrar alert se já foi redirecionado pelo interceptor
      if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        navigate('/login');
      } else if (err.response?.status !== 401) {
        // Não mostrar alert para 401 se já foi tratado pelo interceptor
        alert(errorMessage);
      }
    } finally {
      setProcessandoInteresse({ ...processandoInteresse, [chave]: false });
    }
  };

  // Sempre mostrar todos os ensaios cadastrados (sem filtro por mês)
  // Ordenar ensaios filtrados por data
  const ensaiosOrdenados = [...ensaiosFiltrados].sort((a, b) => {
    if (!a.proxima_data) return 1;
    if (!b.proxima_data) return -1;
    return new Date(a.proxima_data) - new Date(b.proxima_data);
  });

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
                // Se o logo não existir, ocultar a imagem mas manter o texto
                e.target.style.display = 'none';
              }}
            />
            <div className="logo-text">
              <span className="partiu">Partiu</span>
              <span className="ensaio">Ensaio</span>
            </div>
          </div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h2>Agenda de Ensaios</h2>
                  <p className="subtitle">
                    {ensaiosOrdenados.length > 0 
                      ? `Ensaios cadastrados (${ensaiosOrdenados.length})`
                      : 'Nenhum ensaio cadastrado no momento'
                    }
                  </p>
                </div>
                <div className="toggle-visualizacao">
                  <button
                    className={`toggle-btn ${visualizacao === 'lista' ? 'active' : ''}`}
                    onClick={() => setVisualizacao('lista')}
                    type="button"
                  >
                    📋 Lista
                  </button>
                  <button
                    className={`toggle-btn ${visualizacao === 'calendario' ? 'active' : ''}`}
                    onClick={() => setVisualizacao('calendario')}
                    type="button"
                  >
                    📅 Calendário
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Pesquisa - apenas na visualização de lista */}
          {visualizacao === 'lista' && (
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
          )}

          {/* Renderização condicional: Lista ou Calendário */}
          {loading ? (
            <div className="loading">Carregando ensaios...</div>
          ) : visualizacao === 'calendario' ? (
            <CalendarioAgenda ensaios={ensaios} loading={loading} />
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
                        <ImageWithFallback
                          src={ensaio.foto_local}
                          alt={ensaio.nome_igreja || ensaio.local || 'Local do ensaio'}
                          className="ensaio-img"
                        />
                      </div>
                    )}
                    <div className="ensaio-content">
                      <div className="ensaio-header">
                        <h3>{ensaio.nome_igreja || ensaio.local || 'Sem nome'}</h3>
                        <span className="status-badge status-aprovado">Aprovado</span>
                      </div>
                      <div className="ensaio-info">
                        {/* Data e Horário em destaque */}
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
                        
                        {/* Encarregado */}
                        <p className="ensaio-encarregado">
                          <strong>👤 Encarregado:</strong> {ensaio.nome_encarregado || ensaio.encarregado_name || 'N/A'}
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
