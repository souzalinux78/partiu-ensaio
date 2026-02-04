import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import AlterarSenha from './AlterarSenha';
import EditarUsuario from './EditarUsuario';
import ImageWithFallback from './ImageWithFallback';
import './Dashboard.css';

const formatIgrejas = (u) => {
  const raw = u?.igrejas ?? u?.nome_igreja;
  if (!raw) return '—';
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ') || '—';
  return String(raw).trim() || '—';
};

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
    porInstrumento: [],
    usuarios: {
      totalMusicos: 0,
      totalEncarregados: 0,
      encarregadosLocais: 0,
      encarregadosRegionais: 0
    }
  });
  const [kpis, setKpis] = useState({
    totalEnsaiosMes: 0,
    totalMusicosInteressados: 0,
    ensaiosRealizados: 0,
    taxaComparecimento: 0,
    locaisMaisEnsaios: []
  });
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [usuariosFiltro, setUsuariosFiltro] = useState('');
  const [showEditarUsuario, setShowEditarUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [showAlterarSenhaUsuario, setShowAlterarSenhaUsuario] = useState(false);
  const [usuarioSenha, setUsuarioSenha] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Carregar todos os dados necessários para os contadores ao montar o componente
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const syncIsMobile = () => setIsMobile(!!mql.matches);
    syncIsMobile();
    if (mql.addEventListener) {
      mql.addEventListener('change', syncIsMobile);
    } else {
      // Safari antigo
      mql.addListener(syncIsMobile);
    }

    const loadAllData = async () => {
      setLoading(true);
      try {
        // Carregar todos os dados em paralelo para mostrar os contadores corretos
        await Promise.all([
          loadEnsaiosPendentes(),
          loadTodosEnsaios(),
          loadTodosPendentes(),
          loadTodosUsuarios(),
          loadEstatisticas(),
          loadKpis()
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
      loadTodosUsuarios();
      loadEstatisticas();
      loadKpis();
    }, 30000);
    
    return () => {
      clearInterval(interval);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', syncIsMobile);
      } else {
        mql.removeListener(syncIsMobile);
      }
    };
  }, []);

  const filteredUsuarios = useMemo(() => {
    const q = (usuariosFiltro || '').trim().toLowerCase();
    if (!q) return todosUsuarios || [];
    return (todosUsuarios || []).filter((u) => {
      const hay = [
        u.name,
        u.email,
        u.celular,
        u.igrejas,
        u.nome_igreja,
        u.role,
        u.instrumento,
        u.categoria_instrumento,
        u.cidade,
        u.estado,
        u.tipo
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [todosUsuarios, usuariosFiltro]);

  // Carregar dados específicos da aba quando ela mudar
  useEffect(() => {
    if (activeTab === 'todos') {
      loadTodosEnsaios();
    } else if (activeTab === 'estatisticas') {
      loadEstatisticas();
      loadKpis();
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
      loadKpis();
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

  const loadTodosUsuarios = async () => {
    try {
      const response = await api.get('/user/todos');
      setTodosUsuarios(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
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

  const loadKpis = async () => {
    setLoadingKpis(true);
    try {
      const response = await api.get('/admin/kpis');
      
      // Validar se a resposta contém dados válidos
      if (response && response.data) {
        setKpis(response.data);
      } else {
        console.warn('[DashboardAdmin] Resposta de KPIs vazia ou inválida:', response);
        // Manter valores padrão (já inicializados como 0)
      }
    } catch (err) {
      console.error('[DashboardAdmin] Erro ao carregar KPIs:', err);
      
      // Verificar se é erro de autenticação
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('[DashboardAdmin] Erro de autenticação:', err.response?.status);
        // O interceptor do api.js já trata redirecionamento
        // Aqui apenas logamos para debug
      } else {
        // Para outros erros, manter valores padrão (0)
        console.warn('[DashboardAdmin] Mantendo valores padrão de KPIs devido ao erro');
      }
    } finally {
      setLoadingKpis(false);
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
              <span style={{fontSize: '0.9rem', color: 'var(--color-gold-primary)', marginTop: '2px'}}>Administração</span>
            </div>
          </div>
          <div className="header-actions">
            <span className="user-name">Admin: {user.name}</span>
            <Link to="/" className="btn-link">Ver Público</Link>
            <button onClick={() => setShowAlterarSenha(true)} className="btn-link">Alterar Senha</button>
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
            <button
              className={`tab ${activeTab === 'usuarios-todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('usuarios-todos')}
            >
              Usuários (Todos) ({todosUsuarios.length})
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

          {activeTab === 'usuarios-todos' && (
            <div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <input
                  value={usuariosFiltro}
                  onChange={(e) => setUsuariosFiltro(e.target.value)}
                  placeholder="Buscar por nome, igreja ou celular..."
                  style={{
                    flex: '1 1 320px',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.18)',
                    background: '#fff',
                    color: '#111',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                  }}
                />
                <button onClick={loadTodosUsuarios} className="btn-secondary">
                  Recarregar
                </button>
              </div>

              {loading ? (
                <div className="loading">Carregando usuários...</div>
              ) : todosUsuarios.length === 0 ? (
                <div className="empty-state">
                  <p>Não há usuários cadastrados.</p>
                </div>
              ) : (
                <>
                  {isMobile ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {filteredUsuarios.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            background: '#fff',
                            border: '1px solid rgba(0,0,0,0.10)',
                            borderRadius: 12,
                            padding: 12
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 800, color: '#111', wordBreak: 'break-word' }}>{u.name}</div>
                              <div style={{ fontSize: 12, color: '#555', wordBreak: 'break-word' }}>{u.email}</div>
                            </div>
                            <span className={`status-badge ${u.aprovado ? 'status-aprovado' : 'status-pendente'}`}>
                              {u.aprovado ? 'Aprovado' : 'Pendente'}
                            </span>
                          </div>

                          <div style={{ marginTop: 8, display: 'grid', gap: 6, color: '#111' }}>
                            <div><strong>Celular:</strong> {u.celular || '—'}</div>
                            <div><strong>Igreja(s):</strong> {formatIgrejas(u)}</div>
                            <div>
                              <strong>Perfil:</strong> {u.role}{u.role === 'encarregado' && u.tipo ? ` (${u.tipo})` : ''}
                            </div>
                          </div>

                          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              className="btn-secondary"
                              style={{
                                background: 'linear-gradient(135deg, var(--color-gold-primary) 0%, var(--color-gold-dark) 100%)',
                                color: '#111',
                                border: 'none',
                                flex: '1 1 140px'
                              }}
                              onClick={() => {
                                setUsuarioEditando(u);
                                setShowEditarUsuario(true);
                              }}
                            >
                              ✎ Editar
                            </button>
                            <button
                              className="btn-secondary"
                              style={{
                                background: '#111',
                                color: '#fff',
                                border: 'none',
                                flex: '1 1 160px'
                              }}
                              onClick={() => {
                                setUsuarioSenha(u);
                                setShowAlterarSenhaUsuario(true);
                              }}
                            >
                              Alterar Senha
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                      <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                            <th style={{ padding: '10px 10px', color: '#111', background: 'rgba(212,175,55,0.10)' }}>Nome</th>
                            <th style={{ padding: '10px 10px', color: '#111', background: 'rgba(212,175,55,0.10)' }}>Celular</th>
                            <th style={{ padding: '10px 10px', color: '#111', background: 'rgba(212,175,55,0.10)' }}>Igreja(s)</th>
                            <th style={{ padding: '10px 10px', color: '#111', background: 'rgba(212,175,55,0.10)' }}>Perfil</th>
                            <th style={{ padding: '10px 10px', color: '#111', background: 'rgba(212,175,55,0.10)' }}>Status</th>
                            <th style={{ padding: '10px 10px', color: '#111', background: 'rgba(212,175,55,0.10)' }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsuarios.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                              <td style={{ padding: '10px 10px' }}>
                                <div style={{ fontWeight: 700, color: '#111' }}>{u.name}</div>
                                <div style={{ fontSize: 12, color: '#555' }}>{u.email}</div>
                              </td>
                              <td style={{ padding: '10px 10px', color: '#111' }}>
                                {u.celular || '—'}
                              </td>
                              <td style={{ padding: '10px 10px', color: '#111' }}>
                                {formatIgrejas(u)}
                              </td>
                              <td style={{ padding: '10px 10px', color: '#111' }}>
                                {u.role}
                                {u.role === 'encarregado' && u.tipo ? ` (${u.tipo})` : ''}
                              </td>
                              <td style={{ padding: '10px 10px' }}>
                                <span className={`status-badge ${u.aprovado ? 'status-aprovado' : 'status-pendente'}`}>
                                  {u.aprovado ? 'Aprovado' : 'Pendente'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 10px' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <button
                                    className="btn-secondary"
                                    style={{
                                      background: 'linear-gradient(135deg, var(--color-gold-primary) 0%, var(--color-gold-dark) 100%)',
                                      color: '#111',
                                      border: 'none'
                                    }}
                                    onClick={() => {
                                      setUsuarioEditando(u);
                                      setShowEditarUsuario(true);
                                    }}
                                  >
                                    ✎ Editar
                                  </button>
                                  <button
                                    className="btn-link"
                                    onClick={() => {
                                      setUsuarioSenha(u);
                                      setShowAlterarSenhaUsuario(true);
                                    }}
                                  >
                                    Alterar Senha
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'estatisticas' && (
            <div>
              {/* KPIs Principais - Cards Grandes */}
              <div className="kpis-main-grid">
                {/* Comunidade Ativa */}
                <div className="kpi-main-card kpi-primary">
                  <div className="kpi-main-value">
                    {loading ? '...' : (estatisticas.usuarios?.musicosAprovados || 0) + (estatisticas.usuarios?.encarregadosAprovados || 0)}
                  </div>
                  <div className="kpi-main-label">Comunidade Ativa</div>
                  <div className="kpi-main-subtitle">
                    {(estatisticas.usuarios?.musicosAprovados || 0)} músicos • {(estatisticas.usuarios?.encarregadosAprovados || 0)} encarregados
                  </div>
                </div>

                {/* Ensaios Agendados */}
                <div className="kpi-main-card kpi-highlight">
                  <div className="kpi-main-value">
                    {loadingKpis ? '...' : kpis.totalEnsaiosMes}
                  </div>
                  <div className="kpi-main-label">Ensaios Agendados</div>
                  <div className="kpi-main-subtitle">
                    Este mês
                  </div>
                </div>

                {/* Receberão Lembrete */}
                <div className="kpi-main-card kpi-success">
                  <div className="kpi-main-value">
                    {loadingKpis ? '...' : kpis.totalMusicosInteressados}
                  </div>
                  <div className="kpi-main-label">Receberão Lembrete</div>
                  <div className="kpi-main-subtitle">
                    Este mês via WhatsApp
                  </div>
                </div>

                {/* Taxa de Engajamento */}
                <div className="kpi-main-card kpi-info">
                  <div className="kpi-main-value">
                    {loadingKpis ? '...' : `${kpis.taxaComparecimento}%`}
                  </div>
                  <div className="kpi-main-label">Taxa de Engajamento</div>
                  <div className="kpi-main-subtitle">
                    {kpis.ensaiosRealizados > 0 
                      ? `${kpis.ensaiosRealizados} ensaios com presença confirmada`
                      : 'Aguardando ensaios realizados'}
                  </div>
                </div>
              </div>

              {/* Locais Mais Ativos - Ranking Simples */}
              {kpis.locaisMaisEnsaios && kpis.locaisMaisEnsaios.length > 0 && (
                <div className="kpi-secondary-card">
                  <h3 className="kpi-secondary-title">📍 Locais Mais Ativos</h3>
                  <div className="kpi-ranking-list">
                    {kpis.locaisMaisEnsaios.map((local, index) => (
                      <div key={index} className="kpi-ranking-item">
                        <span className="kpi-ranking-position">{index + 1}º</span>
                        <span className="kpi-ranking-name">{local.local}</span>
                        <span className="kpi-ranking-value">{local.total} ensaios</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações Secundárias - Grid 2 Colunas */}
              <div className="kpi-secondary-grid">
                {/* Dados Geográficos */}
                <div className="kpi-secondary-card">
                  <h3 className="kpi-secondary-title">🌍 Distribuição Geográfica</h3>
                  
                  {estatisticas.porCidade && estatisticas.porCidade.length > 0 && (
                    <div className="kpi-secondary-section">
                      <h4 className="kpi-secondary-subtitle">Por Cidade</h4>
                      <div className="kpi-simple-list">
                        {estatisticas.porCidade.slice(0, 5).map((item, index) => (
                          <div key={index} className="kpi-simple-item">
                            <span>{item.cidade || 'Não informado'}</span>
                            <span className="kpi-simple-value">{item.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {estatisticas.porEstado && estatisticas.porEstado.length > 0 && (
                    <div className="kpi-secondary-section" style={{ marginTop: '20px' }}>
                      <h4 className="kpi-secondary-subtitle">Por Estado</h4>
                      <div className="kpi-simple-list">
                        {estatisticas.porEstado.slice(0, 5).map((item, index) => (
                          <div key={index} className="kpi-simple-item">
                            <span>{item.estado || 'Não informado'}</span>
                            <span className="kpi-simple-value">{item.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Instrumentos e Naipes - Informação Secundária */}
                <div className="kpi-secondary-card">
                  <h3 className="kpi-secondary-title">🎵 Instrumentos e Naipes</h3>
                  
                  {estatisticas.porNaipe && estatisticas.porNaipe.length > 0 && (
                    <div className="kpi-secondary-section">
                      <h4 className="kpi-secondary-subtitle">Por Naipe</h4>
                      <div className="kpi-simple-list">
                        {estatisticas.porNaipe.slice(0, 5).map((item, index) => (
                          <div key={index} className="kpi-simple-item">
                            <span>{item.naipe || 'Não informado'}</span>
                            <span className="kpi-simple-value">{item.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {estatisticas.porInstrumento && estatisticas.porInstrumento.length > 0 && (
                    <div className="kpi-secondary-section" style={{ marginTop: '20px' }}>
                      <h4 className="kpi-secondary-subtitle">Top Instrumentos</h4>
                      <div className="kpi-simple-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {estatisticas.porInstrumento.slice(0, 8).map((item, index) => (
                          <div key={index} className="kpi-simple-item">
                            <span>{item.instrumento || 'Não informado'}</span>
                            <span className="kpi-simple-value">{item.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      
      <AlterarSenha 
        isOpen={showAlterarSenha}
        onClose={() => setShowAlterarSenha(false)}
      />

      <EditarUsuario
        isOpen={showEditarUsuario}
        user={usuarioEditando}
        onClose={() => {
          setShowEditarUsuario(false);
          setUsuarioEditando(null);
        }}
        onSaved={(updated) => {
          setTodosUsuarios((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        }}
      />

      <AlterarSenha
        isOpen={showAlterarSenhaUsuario}
        onClose={() => {
          setShowAlterarSenhaUsuario(false);
          setUsuarioSenha(null);
        }}
        userId={usuarioSenha?.id || null}
        userName={usuarioSenha?.name || null}
      />
    </div>
  );
};

export default DashboardAdmin;
