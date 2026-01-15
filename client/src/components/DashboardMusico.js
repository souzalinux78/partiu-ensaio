import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getBaseUrl } from '../utils/api';
import AlterarSenha from './AlterarSenha';
import { ensurePushSubscription } from '../utils/push';
import ReportarProblema from './ReportarProblema';
import './Dashboard.css';

const DashboardMusico = ({ user, onLogout }) => {
  const [ensaios, setEnsaios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interesses, setInteresses] = useState({}); // { ensaioId_data: true/false }
  const [processandoInteresse, setProcessandoInteresse] = useState({});
  const [showAlterarSenha, setShowAlterarSenha] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [google, setGoogle] = useState({ loading: true, connected: false, email: null });

  useEffect(() => {
    loadEnsaios();
    // Registrar push (somente se o usuário permitir notificações)
    ensurePushSubscription().catch(() => {});
    refreshGoogleStatus();

    // Se voltou do OAuth (callback redireciona para /dashboard?google=connected),
    // atualizar status e limpar a query string para não ficar "travado" em cache.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('google') === 'connected') {
        refreshGoogleStatus();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
  }, []);

  const refreshGoogleStatus = async () => {
    try {
      const r = await api.get('/google/status');
      setGoogle({ loading: false, connected: !!r.data.connected, email: r.data.google_email || null });
    } catch {
      setGoogle({ loading: false, connected: false, email: null });
    }
  };

  const buildGoogleCalendarUrl = (ensaio) => {
    const data = ensaio.proxima_data;
    const horario = ensaio.horario || '20:00:00';
    if (!data) return null;

    const ensaioId = ensaio.id_original || ensaio.id;

    const toGoogleDateTime = (dateStr, timeStr) => {
      const [y, m, d] = dateStr.split('-');
      const [hh, mm, ssRaw] = String(timeStr).split(':');
      const ss = ssRaw ? ssRaw : '00';
      return `${y}${m}${d}T${hh}${mm}${ss}`;
    };

    const addHoursToTime = (timeStr, hoursToAdd) => {
      const [hhRaw, mmRaw, ssRaw] = String(timeStr).split(':');
      const hh = parseInt(hhRaw || '0', 10);
      const mm = parseInt(mmRaw || '0', 10);
      const ss = parseInt(ssRaw || '0', 10);
      const total = hh * 3600 + mm * 60 + ss + hoursToAdd * 3600;
      const hh2 = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
      const mm2 = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      const ss2 = String(total % 60).padStart(2, '0');
      return `${hh2}:${mm2}:${ss2}`;
    };

    const endHorario = addHoursToTime(horario, 2);

    const text = `Ensaio - ${ensaio.nome_igreja || ensaio.local || 'Igreja'}`;
    const location = `${ensaio.endereco || ''}${ensaio.cidade ? ` - ${ensaio.cidade}` : ''}${ensaio.estado ? `/${ensaio.estado}` : ''}`.trim();
    const details = [
      'Partiu Ensaio - Interesse confirmado',
      `Data: ${data}`,
      `Horário: ${horario}`,
      `Igreja: ${ensaio.nome_igreja || ensaio.local || 'N/A'}`,
      `Endereço: ${ensaio.endereco || 'N/A'}`,
      `Cidade/UF: ${ensaio.cidade || 'N/A'}${ensaio.estado ? `/${ensaio.estado}` : ''}`,
      `Encarregado: ${ensaio.nome_encarregado || ensaio.encarregado_name || 'N/A'}`,
      `Contato: ${ensaio.celular || 'N/A'}`,
      ensaioId ? `Ensaio ID: ${ensaioId}` : null
    ].filter(Boolean).join('\n');

    const dates = `${toGoogleDateTime(data, horario)}/${toGoogleDateTime(data, endHorario)}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text,
      dates,
      details,
      location,
      ctz: 'America/Sao_Paulo'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const openGoogleCalendar = (ensaio) => {
    const url = buildGoogleCalendarUrl(ensaio);
    if (!url) return;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    // fallback se o navegador bloquear pop-up
    if (!w) window.location.href = url;
  };

  const connectGoogle = async () => {
    try {
      const r = await api.get('/google/auth');
      if (r.data?.url) window.location.href = r.data.url;
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao conectar Google Agenda');
    }
  };

  const disconnectGoogle = async () => {
    try {
      await api.post('/google/disconnect');
      setGoogle({ loading: false, connected: false, email: null });
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao desconectar Google Agenda');
    }
  };

  const loadInteresses = React.useCallback(async () => {
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
  }, [ensaios]);

  // Carregar interesses quando os ensaios mudarem
  useEffect(() => {
    if (ensaios.length > 0) {
      loadInteresses();
    }
  }, [ensaios, loadInteresses]);

  const loadEnsaios = async () => {
    try {
      const response = await api.get('/ensaio/public');
      setEnsaios(response.data);
    } catch (err) {
      console.error('Erro ao carregar ensaios:', err);
    } finally {
      setLoading(false);
    }
  };

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

        // Se Google Agenda estiver conectado, cria o evento sem sair do PWA.
        // Caso contrário, mantém o botão manual para abrir o link.
        if (google.connected) {
          try {
            await api.post('/google/create-event', { ensaioId, data_ensaio: dataEnsaio });
            // feedback simples sem interromper o fluxo
            console.log('✅ Evento adicionado ao Google Agenda (sem sair do PWA)');
          } catch (e) {
            console.warn('Falha ao criar evento no Google Agenda:', e);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao processar interesse:', err);
      alert(err.response?.data?.error || 'Erro ao processar interesse');
    } finally {
      setProcessandoInteresse({ ...processandoInteresse, [chave]: false });
    }
  };

  // Ordenar ensaios por data
  const ensaiosOrdenados = [...ensaios].sort((a, b) => {
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
            {google.loading ? (
              <button className="btn-link" disabled>Google Agenda...</button>
            ) : google.connected ? (
              <button className="btn-link" onClick={disconnectGoogle} title={google.email || 'Conectado'}>
                Desconectar Google
              </button>
            ) : (
              <button className="btn-link" onClick={connectGoogle}>
                Conectar Google Agenda
              </button>
            )}
            <button onClick={() => setShowReport(true)} className="btn-link">Reportar problema</button>
            <button onClick={() => setShowAlterarSenha(true)} className="btn-link">Alterar Senha</button>
            <button onClick={onLogout} className="btn-secondary">Sair</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="page-header">
            <h2>Agenda de Ensaios</h2>
            <p className="subtitle">Ensaios recorrentes - Agenda completa</p>
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
                            // Mesmo comportamento do público: 1 retry com timestamp para vencer cache/SW
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
                        {/* Só mostrar o botão de abrir o Google Agenda quando NÃO estiver conectado.
                            Se estiver conectado, o evento é criado automaticamente sem sair do PWA. */}
                        {interesses[`${ensaio.id_original || ensaio.id}_${ensaio.proxima_data}`] && !google.connected && (
                          <button
                            onClick={() => openGoogleCalendar(ensaio)}
                            className="btn-link"
                            style={{ marginLeft: '10px' }}
                            title="Abrir Google Agenda já preenchido"
                          >
                            Adicionar no Google Agenda
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
      
      <AlterarSenha 
        isOpen={showAlterarSenha}
        onClose={() => setShowAlterarSenha(false)}
      />
      <ReportarProblema
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        userRole="musico"
      />
    </div>
  );
};

export default DashboardMusico;
