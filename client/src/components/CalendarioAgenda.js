import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { getBaseUrl } from '../utils/api';
import api from '../utils/api';
import ImageWithFallback from './ImageWithFallback';
import './CalendarioAgenda.css';

// Componente de calendário inline - recebe ensaios como prop
const CalendarioAgenda = ({ ensaios = [], loading = false }) => {
  const [selectedEnsaio, setSelectedEnsaio] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [temInteresse, setTemInteresse] = useState(false);
  const [processandoInteresse, setProcessandoInteresse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Função para gerar cor baseada no tipo de ensaio (usando paleta refinada)
  const getEventColor = (ensaio) => {
    // Cores por tipo - usando paleta refinada
    if (ensaio.tipo === 'local' || !ensaio.tipo) {
      return '#2E7D32'; // Verde refinado para local
    } else if (ensaio.tipo === 'regional') {
      return '#1565C0'; // Azul refinado para regional
    }
    
    // Fallback: verde (ensaio local padrão)
    return '#2E7D32';
  };

  // Converter ensaios para eventos do FullCalendar
  const eventos = ensaios
    .filter(ensaio => ensaio.proxima_data) // Apenas ensaios com data
    .map(ensaio => {
      const dataObj = new Date(ensaio.proxima_data + 'T00:00:00');
      if (isNaN(dataObj.getTime())) {
        return null;
      }

      // Combinar data e horário
      let dataHora = new Date(ensaio.proxima_data + 'T00:00:00');
      if (ensaio.horario) {
        const [hora, minuto] = ensaio.horario.split(':').map(Number);
        if (!isNaN(hora) && !isNaN(minuto)) {
          dataHora.setHours(hora, minuto || 0, 0, 0);
        }
      }

      // Título compacto: hora + local
      const hora = ensaio.horario ? ensaio.horario.substring(0, 5) : '';
      const local = ensaio.nome_igreja || ensaio.local || 'Ensaio';
      const titulo = hora ? `${hora} - ${local}` : local;
      
      return {
        id: ensaio.id_original || ensaio.id,
        title: titulo,
        start: dataHora.toISOString(),
        backgroundColor: getEventColor(ensaio),
        borderColor: getEventColor(ensaio),
        extendedProps: {
          ensaio: ensaio
        }
      };
    })
    .filter(evento => evento !== null);

  // Verificar interesse do usuário
  const verificarInteresse = async (ensaio) => {
    if (!ensaio || !ensaio.proxima_data || !(ensaio.id_original || ensaio.id)) {
      setTemInteresse(false);
      return;
    }

    try {
      const ensaioId = ensaio.id_original || ensaio.id;
      const response = await api.get(`/interesse/verificar/${ensaioId}?data_ensaio=${ensaio.proxima_data}`);
      setTemInteresse(response.data.temInteresse || false);
    } catch (err) {
      // Se não estiver logado, não tem interesse
      setTemInteresse(false);
    }
  };

  // Marcar/remover interesse
  const handleInteresseModal = async () => {
    if (!selectedEnsaio || !selectedEnsaio.proxima_data) return;

    const ensaioId = selectedEnsaio.id_original || selectedEnsaio.id;
    const dataEnsaio = selectedEnsaio.proxima_data;

    setProcessandoInteresse(true);

    try {
      if (temInteresse) {
        // Remover interesse
        await api.delete(`/interesse/${ensaioId}`, { data: { data_ensaio: dataEnsaio } });
        setTemInteresse(false);
      } else {
        // Adicionar interesse
        await api.post(`/interesse/${ensaioId}`, { data_ensaio: dataEnsaio });
        setTemInteresse(true);
      }
    } catch (err) {
      // Usar mensagem do interceptor se disponível
      const errorMessage = err.userMessage || err.response?.data?.error || 'Erro ao processar interesse';
      
      // Não mostrar alert se já foi redirecionado pelo interceptor
      if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
        alert('Para receber lembretes, você precisa estar logado. Faça login para continuar.');
      } else if (err.response?.status !== 401) {
        alert(errorMessage);
      }
    } finally {
      setProcessandoInteresse(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    const ensaio = clickInfo.event.extendedProps.ensaio;
    setSelectedEnsaio(ensaio);
    setShowModal(true);
    // Verificar se já tem interesse
    verificarInteresse(ensaio);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEnsaio(null);
    setTemInteresse(false);
    setProcessandoInteresse(false);
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    try {
      const dataObj = new Date(dataString + 'T00:00:00');
      if (isNaN(dataObj.getTime())) return dataString;
      return dataObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (e) {
      return dataString;
    }
  };

  if (loading) {
    return (
      <div className="calendario-loading">
        <p>Carregando calendário...</p>
      </div>
    );
  }

  return (
    <div className="calendario-agenda-inline">
      <div className="calendario-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--color-green-primary)' }}></span>
          <span>Ensaio Local</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: 'var(--color-blue-primary)' }}></span>
          <span>Ensaio Regional</span>
        </div>
      </div>

      <div className="calendario-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridWeek" : "dayGridMonth"}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={eventos}
          eventClick={handleEventClick}
          locale={ptBrLocale}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
        />
      </div>

      {showModal && selectedEnsaio && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>{selectedEnsaio.nome_igreja || selectedEnsaio.local || 'Detalhes do Ensaio'}</h2>
                {selectedEnsaio.proxima_data && (
                  <p className="modal-header-date">
                    {formatarData(selectedEnsaio.proxima_data)}
                    {selectedEnsaio.horario && ` às ${selectedEnsaio.horario}`}
                  </p>
                )}
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {selectedEnsaio.foto_local && (
                <div className="modal-foto">
                  <ImageWithFallback
                    src={selectedEnsaio.foto_local}
                    alt={selectedEnsaio.nome_igreja || 'Ensaio'}
                    className="modal-img"
                  />
                </div>
              )}

              <div className="modal-info">
                {/* Data e Horário - Alto destaque */}
                {selectedEnsaio.proxima_data && (
                  <div className="info-section info-section-highlight">
                    <div className="info-label">📅 Data e Horário</div>
                    <div className="info-value-highlight">
                      {formatarData(selectedEnsaio.proxima_data)}
                      {selectedEnsaio.horario && (
                        <span className="info-horario"> às {selectedEnsaio.horario}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Localização - Médio destaque */}
                {(selectedEnsaio.endereco || selectedEnsaio.cidade || selectedEnsaio.estado) && (
                  <div className="info-section">
                    <div className="info-label">📍 Localização</div>
                    <div className="info-value">
                      {selectedEnsaio.endereco && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            selectedEnsaio.endereco + 
                            (selectedEnsaio.cidade ? `, ${selectedEnsaio.cidade}` : '') + 
                            (selectedEnsaio.estado ? `, ${selectedEnsaio.estado}` : '')
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-maps-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {selectedEnsaio.endereco}
                          <span className="maps-icon">📍 Ver no Maps</span>
                        </a>
                      )}
                      {(selectedEnsaio.cidade || selectedEnsaio.estado) && (
                        <div className="info-location">
                          {[selectedEnsaio.cidade, selectedEnsaio.estado].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Encarregado e Tipo - Médio destaque */}
                <div className="info-section">
                  <div className="info-label">👤 Encarregado</div>
                  <div className="info-value">
                    {selectedEnsaio.nome_encarregado || selectedEnsaio.encarregado_name || 'N/A'}
                  </div>
                </div>

                {/* Tipo e Badge de Ensaio Geral */}
                <div className="info-section">
                  <div className="info-label">Informações</div>
                  <div className="info-badges">
                    {selectedEnsaio.tipo && (
                      <span className={`tipo-badge tipo-${selectedEnsaio.tipo}`}>
                        {selectedEnsaio.tipo.charAt(0).toUpperCase() + selectedEnsaio.tipo.slice(1)}
                      </span>
                    )}
                    <span className="ensaio-geral-badge" title="Ensaio aberto para todos os músicos">
                      🎼 Ensaio Geral
                    </span>
                  </div>
                </div>

                {/* Recorrência - Baixo destaque */}
                {selectedEnsaio.dia_semana && (
                  <div className="info-section info-section-low">
                    <div className="info-label">📆 Recorrência</div>
                    <div className="info-value">
                      {selectedEnsaio.dia_semana}
                      {selectedEnsaio.semana_mes !== null && selectedEnsaio.semana_mes !== undefined && (
                        <span>
                          {' '}- {selectedEnsaio.semana_mes === -1 
                            ? 'Última' 
                            : `${selectedEnsaio.semana_mes}ª`} semana do mês
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão de Lembrete */}
                {selectedEnsaio.proxima_data && (selectedEnsaio.id_original || selectedEnsaio.id) && (
                  <div className="info-section info-section-actions">
                    <button
                      onClick={handleInteresseModal}
                      disabled={processandoInteresse}
                      className={`btn-lembrete ${temInteresse ? 'lembrete-ativo' : ''}`}
                    >
                      {processandoInteresse 
                        ? '⏳ Processando...' 
                        : temInteresse
                        ? '✓ Recebendo lembrete'
                        : '⭐ Receber lembrete deste ensaio'}
                    </button>
                    {temInteresse && (
                      <p className="lembrete-info">
                        Você receberá um lembrete às 10:00 do dia do ensaio
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioAgenda;
