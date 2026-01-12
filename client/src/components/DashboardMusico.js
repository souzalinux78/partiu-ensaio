import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Dashboard.css';

const DashboardMusico = ({ user, onLogout }) => {
  const [ensaios, setEnsaios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interesses, setInteresses] = useState({}); // { ensaioId_data: true/false }
  const [processandoInteresse, setProcessandoInteresse] = useState({});

  useEffect(() => {
    loadEnsaios();
  }, []);

  // Carregar interesses do músico
  useEffect(() => {
    if (ensaios.length > 0) {
      loadInteresses();
    }
  }, [ensaios]);

  const loadInteresses = async () => {
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
  };

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
          <h1>Partiu Ensaio</h1>
          <div className="header-actions">
            <span className="user-name">Olá, {user.name}</span>
            <Link to="/" className="btn-link">Ver Público</Link>
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
                          src={`http://localhost:5000${ensaio.foto_local}`}
                          alt={ensaio.nome_igreja || ensaio.local || 'Local do ensaio'}
                          onError={(e) => {
                            e.target.style.display = 'none';
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
                        {ensaio.proxima_data && (
                          <p className="data-destaque">
                            📅 {new Date(ensaio.proxima_data + 'T00:00:00').toLocaleDateString('pt-BR', { 
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
                        )}
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

export default DashboardMusico;
