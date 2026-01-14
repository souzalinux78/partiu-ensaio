import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import './Dashboard.css';

const DashboardAdmin = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('estatisticas');
  const [ensaiosPendentes, setEnsaiosPendentes] = useState([]);
  const [todosEnsaios, setTodosEnsaios] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [musicosPendentes, setMusicosPendentes] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [encarregadosPendentes, setEncarregadosPendentes] = useState([]);
  const [todosPendentes, setTodosPendentes] = useState([]);
  const [estatisticas, setEstatisticas] = useState({ 
    porCidade: [], 
    porEstado: [],
    porNaipe: [],
    porInstrumento: []
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Carregar todos os dados necessários para os contadores ao montar o componente
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Carregar todos os dados em paralelo para mostrar os contadores corretos
        await Promise.all([
          loadEnsaiosPendentes(),
          loadTodosEnsaios(),
          loadTodosPendentes(),
          loadEstatisticas()
        ]);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(() => {
      loadEnsaiosPendentes();
      loadTodosEnsaios();
      loadTodosPendentes();
      loadEstatisticas();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Carregar dados específicos da aba quando ela mudar
  useEffect(() => {
    if (activeTab === 'todos') {
      loadTodosEnsaios();
    } else if (activeTab === 'estatisticas') {
      loadEstatisticas();
    } else if (activeTab === 'musicos') {
      loadMusicosPendentes();
    } else if (activeTab === 'encarregados') {
      loadEncarregadosPendentes();
    } else if (activeTab === 'usuarios') {
      loadTodosPendentes();
    } else {
      loadEnsaiosPendentes();
    }
  }, [activeTab]);

  const loadData = () => {
    // Recarregar todos os dados para atualizar contadores
    loadEnsaiosPendentes();
    loadTodosEnsaios();
    loadTodosPendentes();
    if (activeTab === 'estatisticas') {
      loadEstatisticas();
    }
  };

  const loadMusicosPendentes = async () => {
    try {
      const response = await api.get('/user/musicos-pendentes');
      setMusicosPendentes(response.data);
    } catch (err) {
      console.error('Erro ao carregar músicos pendentes:', err);
    }
  };

  const loadEncarregadosPendentes = async () => {
    try {
      const response = await api.get('/user/encarregados-pendentes');
      setEncarregadosPendentes(response.data);
    } catch (err) {
      console.error('Erro ao carregar encarregados pendentes:', err);
    }
  };

  const loadTodosPendentes = async () => {
    try {
      const response = await api.get('/user/pendentes');
      setTodosPendentes(response.data);
    } catch (err) {
      console.error('Erro ao carregar usuários pendentes:', err);
    }
  };

  const loadEnsaiosPendentes = async () => {
    try {
      const response = await api.get('/ensaio/pendentes');
      setEnsaiosPendentes(response.data);
    } catch (err) {
      console.error('Erro ao carregar ensaios pendentes:', err);
    }
  };

  const loadTodosEnsaios = async () => {
    try {
      const response = await api.get('/ensaio/todos');
      setTodosEnsaios(response.data);
    } catch (err) {
      console.error('Erro ao carregar todos os ensaios:', err);
    }
  };

  const loadEstatisticas = async () => {
    try {
      const response = await api.get('/ensaio/estatisticas');
      setEstatisticas(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleStatusChange = async (ensaioId, status) => {
    setProcessing(ensaioId);
    try {
      await api.patch(`/ensaio/${ensaioId}/status`, { status });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar status');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelar = async (ensaioId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este ensaio?')) {
      return;
    }
    setProcessing(ensaioId);
    try {
      await api.patch(`/ensaio/${ensaioId}/cancelar`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao cancelar ensaio');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeletar = async (ensaioId) => {
    if (!window.confirm('Tem certeza que deseja deletar este ensaio? Esta ação não pode ser desfeita.')) {
      return;
    }
    setProcessing(ensaioId);
    try {
      await api.delete(`/ensaio/${ensaioId}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao deletar ensaio');
    } finally {
      setProcessing(null);
    }
  };

  const handleAprovarMusico = async (usuarioId, aprovado) => {
    setProcessing(usuarioId);
    try {
      const response = await api.patch(`/user/${usuarioId}/aprovar`, { aprovado: aprovado ? 1 : 0 });
      
      // Recarregar a lista apropriada imediatamente
      if (activeTab === 'usuarios') {
        await loadTodosPendentes();
      } else if (activeTab === 'musicos') {
        await loadMusicosPendentes();
      } else if (activeTab === 'encarregados') {
        await loadEncarregadosPendentes();
      }
      
      // Mostrar mensagem após recarregar
      if (!aprovado && response.data?.deleted) {
        alert('Usuário rejeitado e removido com sucesso!');
      } else if (aprovado) {
        alert('Usuário aprovado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao atualizar aprovação:', err);
      alert(err.response?.data?.error || 'Erro ao atualizar aprovação');
      
      // Recarregar mesmo em caso de erro para garantir que a lista está atualizada
      if (activeTab === 'usuarios') {
        loadTodosPendentes();
      } else if (activeTab === 'musicos') {
        loadMusicosPendentes();
      } else if (activeTab === 'encarregados') {
        loadEncarregadosPendentes();
      }
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pendente: { text: 'Pendente', class: 'status-pendente' },
      aprovado: { text: 'Aprovado', class: 'status-aprovado' },
      rejeitado: { text: 'Rejeitado', class: 'status-rejeitado' },
      cancelado: { text: 'Cancelado', class: 'status-rejeitado' },
    };
    const statusInfo = statusMap[status] || statusMap.pendente;
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getNaipeColor = (naipe) => {
    const colors = {
      'METAIS': '#ff9800',
      'MADEIRAS': '#4caf50',
      'CORDAS': '#2196f3',
      'TECLAS': '#9c27b0',
    };
    return colors[naipe] || '#667eea';
  };

  const renderEnsaioCard = (ensaio, showActions = true) => (
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
          <h3>{ensaio.nome_igreja || ensaio.local || 'Sem nome'}</h3>
          {getStatusBadge(ensaio.status)}
        </div>
        <div className="ensaio-info">
          <p><strong>Nome do Encarregado:</strong> {ensaio.nome_encarregado || ensaio.encarregado_name || 'N/A'}</p>
          {ensaio.instrumento && (
            <p>
              <strong>Instrumento:</strong> {ensaio.instrumento}
              {ensaio.categoria_instrumento && (
                <span> ({ensaio.categoria_instrumento})</span>
              )}
            </p>
          )}
          <p><strong>Email:</strong> {ensaio.encarregado_email || 'N/A'}</p>
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
          {ensaio.proxima_data && (() => {
            try {
              const dataObj = new Date(ensaio.proxima_data + 'T00:00:00');
              if (isNaN(dataObj.getTime())) {
                return null;
              }
              return <p><strong>📅 Próxima data:</strong> {dataObj.toLocaleDateString('pt-BR')}</p>;
            } catch (e) {
              return null;
            }
          })()}
          <p><strong>Horário:</strong> {ensaio.horario}</p>
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
          <small>
            Criado em: {new Date(ensaio.created_at).toLocaleDateString('pt-BR')}
          </small>
        </div>
        {showActions && (
          <div className="admin-actions">
            {ensaio.status === 'pendente' && (
              <>
                <button
                  onClick={() => handleStatusChange(ensaio.id, 'aprovado')}
                  disabled={processing === ensaio.id}
                  className="btn-success"
                >
                  {processing === ensaio.id ? 'Processando...' : '✓ Aprovar'}
                </button>
                <button
                  onClick={() => handleStatusChange(ensaio.id, 'rejeitado')}
                  disabled={processing === ensaio.id}
                  className="btn-danger"
                >
                  {processing === ensaio.id ? 'Processando...' : '✗ Rejeitar'}
                </button>
              </>
            )}
            {ensaio.status === 'aprovado' && (
              <button
                onClick={() => handleCancelar(ensaio.id)}
                disabled={processing === ensaio.id}
                className="btn-warning"
              >
                {processing === ensaio.id ? 'Processando...' : '🚫 Cancelar'}
              </button>
            )}
            <button
              onClick={() => handleDeletar(ensaio.id)}
              disabled={processing === ensaio.id}
              className="btn-danger"
            >
              {processing === ensaio.id ? 'Processando...' : '🗑️ Deletar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

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
              <span style={{fontSize: '0.9rem', color: '#D4AF37', marginTop: '2px'}}>Administração</span>
            </div>
          </div>
          <div className="header-actions">
            <span className="user-name">Admin: {user.name}</span>
            <Link to="/" className="btn-link">Ver Público</Link>
            <button onClick={onLogout} className="btn-secondary">Sair</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="page-header">
            <h2>Dashboard Administrativo</h2>
            <button onClick={loadData} className="btn-secondary">
              Atualizar
            </button>
          </div>

          {/* Tabs - Ordem Alfabética */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'estatisticas' ? 'active' : ''}`}
              onClick={() => setActiveTab('estatisticas')}
            >
              Estatísticas
            </button>
            <button
              className={`tab ${activeTab === 'pendentes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendentes')}
            >
              Pendentes ({ensaiosPendentes.length})
            </button>
            <button
              className={`tab ${activeTab === 'todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('todos')}
            >
              Todos os Ensaios ({todosEnsaios.length})
            </button>
            <button
              className={`tab ${activeTab === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              Usuários Pendentes ({todosPendentes.length})
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === 'pendentes' && (
            <div>
              {loading ? (
                <div className="loading">Carregando ensaios pendentes...</div>
              ) : ensaiosPendentes.length === 0 ? (
                <div className="empty-state">
                  <p>Não há ensaios pendentes de aprovação no momento.</p>
                </div>
              ) : (
                <div className="ensaios-grid">
                  {ensaiosPendentes.map((ensaio) => renderEnsaioCard(ensaio, true))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'todos' && (
            <div>
              {loading ? (
                <div className="loading">Carregando todos os ensaios...</div>
              ) : todosEnsaios.length === 0 ? (
                <div className="empty-state">
                  <p>Não há ensaios cadastrados.</p>
                </div>
              ) : (
                <div className="ensaios-grid">
                  {todosEnsaios.map((ensaio) => renderEnsaioCard(ensaio, true))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div>
              {loading ? (
                <div className="loading">Carregando usuários pendentes...</div>
              ) : todosPendentes.length === 0 ? (
                <div className="empty-state">
                  <p>Não há usuários pendentes de aprovação no momento.</p>
                </div>
              ) : (
                <div className="ensaios-grid">
                  {todosPendentes.map((usuario) => (
                    <div key={usuario.id} className="ensaio-card">
                      <div className="ensaio-content">
                        <div className="ensaio-header">
                          <h3>{usuario.name}</h3>
                          <span className="status-badge status-pendente">Pendente</span>
                        </div>
                        <div className="ensaio-info">
                          <p><strong>Email:</strong> {usuario.email}</p>
                          <p><strong>Tipo:</strong> {usuario.role === 'musico' ? 'Músico' : 'Encarregado'}</p>
                          <p><strong>Cadastrado em:</strong> {new Date(usuario.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="admin-actions">
                          <button
                            onClick={() => handleAprovarMusico(usuario.id, true)}
                            disabled={processing === usuario.id}
                            className="btn-success"
                          >
                            {processing === usuario.id ? 'Processando...' : '✓ Aprovar'}
                          </button>
                          <button
                            onClick={() => handleAprovarMusico(usuario.id, false)}
                            disabled={processing === usuario.id}
                            className="btn-danger"
                          >
                            {processing === usuario.id ? 'Processando...' : '✗ Rejeitar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'estatisticas' && (
            <div>
              <div className="stats-container">
                <div className="stats-section">
                  <h3>Igrejas por Cidade</h3>
                  {estatisticas.porCidade.length === 0 ? (
                    <p className="empty-state">Nenhum dado disponível</p>
                  ) : (
                    <div className="stats-list">
                      {estatisticas.porCidade.map((item, index) => (
                        <div key={index} className="stat-item">
                          <div className="stat-label">{item.cidade || 'Não informado'}</div>
                          <div className="stat-bar">
                            <div
                              className="stat-bar-fill"
                              style={{ width: `${item.porcentagem}%` }}
                            ></div>
                          </div>
                          <div className="stat-value">
                            {item.total} igrejas ({item.porcentagem}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="stats-section">
                  <h3>Igrejas por Estado</h3>
                  {estatisticas.porEstado.length === 0 ? (
                    <p className="empty-state">Nenhum dado disponível</p>
                  ) : (
                    <div className="stats-list">
                      {estatisticas.porEstado.map((item, index) => (
                        <div key={index} className="stat-item">
                          <div className="stat-label">{item.estado || 'Não informado'}</div>
                          <div className="stat-bar">
                            <div
                              className="stat-bar-fill"
                              style={{ width: `${item.porcentagem}%` }}
                            ></div>
                          </div>
                          <div className="stat-value">
                            {item.total} igrejas ({item.porcentagem}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="stats-container" style={{ marginTop: '30px' }}>
                <div className="stats-section">
                  <h3>Instrumentos por Naipes (Categorias)</h3>
                  {estatisticas.porNaipe.length === 0 ? (
                    <p className="empty-state">Nenhum dado disponível</p>
                  ) : (
                    <div className="stats-list">
                      {estatisticas.porNaipe.map((item, index) => (
                        <div key={index} className="stat-item">
                          <div className="stat-label">{item.naipe || 'Não informado'}</div>
                          <div className="stat-bar">
                            <div
                              className="stat-bar-fill"
                              style={{ 
                                width: `${item.porcentagem}%`,
                                background: getNaipeColor(item.naipe)
                              }}
                            ></div>
                          </div>
                          <div className="stat-value">
                            {item.total} instrumentos ({item.porcentagem}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="stats-section">
                  <h3>Instrumentos Mais Utilizados</h3>
                  {estatisticas.porInstrumento.length === 0 ? (
                    <p className="empty-state">Nenhum dado disponível</p>
                  ) : (
                    <div className="stats-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {estatisticas.porInstrumento.slice(0, 20).map((item, index) => (
                        <div key={index} className="stat-item">
                          <div className="stat-label">
                            {item.instrumento || 'Não informado'}
                            {item.categoria_instrumento && (
                              <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>
                                ({item.categoria_instrumento})
                              </span>
                            )}
                          </div>
                          <div className="stat-bar">
                            <div
                              className="stat-bar-fill"
                              style={{ 
                                width: `${item.porcentagem}%`,
                                background: getNaipeColor(item.categoria_instrumento)
                              }}
                            ></div>
                          </div>
                          <div className="stat-value">
                            {item.total} ({item.porcentagem}%)
                          </div>
                        </div>
                      ))}
                      {estatisticas.porInstrumento.length > 20 && (
                        <p style={{ textAlign: 'center', color: '#666', marginTop: '10px' }}>
                          Mostrando os 20 mais utilizados de {estatisticas.porInstrumento.length} instrumentos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardAdmin;
