import React, { useState } from 'react';
import api from '../utils/api';
import './AlterarSenha.css';

const AlterarSenha = ({ isOpen, onClose, userId = null, userName = null }) => {
  const [formData, setFormData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validações
    if (!formData.senhaAtual && !userId) {
      setError('Por favor, informe sua senha atual');
      return;
    }

    if (formData.novaSenha.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        novaSenha: formData.novaSenha,
        ...(userId && { userId }),
        ...(!userId && { senhaAtual: formData.senhaAtual }) // Só envia senhaAtual se não for admin alterando outro usuário
      };

      const response = await api.post('/user/alterar-senha', payload);
      
      if (response.data.success) {
        setSuccess(true);
        setFormData({
          senhaAtual: '',
          novaSenha: '',
          confirmarSenha: ''
        });
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: ''
    });
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  const isAdminChangingOtherUser = userId && userName;

  return (
    <div className="alterar-senha-overlay" onClick={handleClose}>
      <div className="alterar-senha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alterar-senha-header">
          <h2>
            {isAdminChangingOtherUser 
              ? `Alterar Senha - ${userName}`
              : 'Alterar Senha'
            }
          </h2>
          <button className="alterar-senha-close" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="alterar-senha-form">
          {!isAdminChangingOtherUser && (
            <div className="form-group">
              <label htmlFor="senhaAtual">Senha Atual</label>
              <input
                type="password"
                id="senhaAtual"
                name="senhaAtual"
                value={formData.senhaAtual}
                onChange={handleChange}
                placeholder="Digite sua senha atual"
                required
                disabled={loading}
              />
            </div>
          )}

          {isAdminChangingOtherUser && (
            <div className="admin-notice">
              <p>⚠️ Você está alterando a senha de outro usuário. A senha atual não é necessária.</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="novaSenha">Nova Senha</label>
            <input
              type="password"
              id="novaSenha"
              name="novaSenha"
              value={formData.novaSenha}
              onChange={handleChange}
              placeholder="Digite a nova senha (mínimo 6 caracteres)"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleChange}
              placeholder="Digite a nova senha novamente"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">✅ Senha alterada com sucesso!</div>}

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="btn-cancel" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlterarSenha;
