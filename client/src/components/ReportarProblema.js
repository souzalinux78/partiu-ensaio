import React, { useMemo, useState } from 'react';
import api from '../utils/api';
import './ReportarProblema.css';

const ReportarProblema = ({ isOpen, onClose, userRole }) => {
  const [categoria, setCategoria] = useState('geral');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  const categorias = useMemo(() => {
    const base = [
      { value: 'geral', label: 'Geral' },
      { value: 'cadastro', label: 'Cadastro' },
      { value: 'login', label: 'Login' },
      { value: 'ensaios', label: 'Ensaios' },
      { value: 'imagens', label: 'Imagens' },
      { value: 'pwa', label: 'PWA / Instalação' },
      { value: 'notificacoes', label: 'Notificações' }
    ];
    return base;
  }, []);

  const handleClose = () => {
    setCategoria('geral');
    setMensagem('');
    setError('');
    setOk(false);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOk(false);

    if (mensagem.trim().length < 5) {
      setError('Descreva o problema (mínimo 5 caracteres).');
      return;
    }

    setLoading(true);
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen?.width || ''}x${window.screen?.height || ''}`,
        isStandalone:
          window.matchMedia?.('(display-mode: standalone)')?.matches ||
          window.navigator.standalone ||
          document.referrer.includes('android-app://')
      };

      await api.post('/report/problema', {
        categoria,
        mensagem: mensagem.trim(),
        pagina: window.location.pathname,
        deviceInfo
      });

      setOk(true);
      setTimeout(() => handleClose(), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-header">
          <h2>Reportar Problema</h2>
          <button className="report-close" onClick={handleClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="report-note">
            Enviaremos os dados do seu usuário ({userRole}) e a descrição do problema via webhook.
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={loading}>
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Descreva o problema *</label>
            <textarea
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Ex: Ao marcar interesse, a tela trava..."
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {ok && <div className="success-message">✅ Enviado!</div>}

          <div className="report-actions">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportarProblema;

