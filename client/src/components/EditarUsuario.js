import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import './EditarUsuario.css';

const normalizeTipo = (tipo) => {
  if (!tipo) return '';
  const t = String(tipo).toLowerCase();
  if (t === 'local' || t === 'regional') return t;
  return '';
};

const EditarUsuario = ({ isOpen, onClose, user, onSaved }) => {
  const initial = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || '',
      email: user.email || '',
      aprovado: typeof user.aprovado === 'number' ? user.aprovado : user.aprovado ? 1 : 0,
      tipo: normalizeTipo(user.tipo),
      instrumento: user.instrumento || '',
      categoria_instrumento: user.categoria_instrumento || '',
      celular: user.celular || '',
      cidade: user.cidade || '',
      estado: user.estado || '',
      nome_igreja: user.nome_igreja || ''
    };
  }, [user]);

  const [formData, setFormData] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initial);
    setError('');
    setSaving(false);
  }, [initial, isOpen]);

  if (!isOpen || !user || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        aprovado: Number(formData.aprovado),
        tipo: formData.tipo || null,
        instrumento: formData.instrumento || null,
        categoria_instrumento: formData.categoria_instrumento || null,
        celular: formData.celular || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        nome_igreja: formData.nome_igreja || null
      };

      const res = await api.patch(`/user/${user.id}`, payload);
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClose = () => {
    if (saving) return;
    onClose();
  };

  const isEncarregado = user.role === 'encarregado';

  return (
    <div className="editar-usuario-overlay" onClick={handleOverlayClose}>
      <div className="editar-usuario-modal" onClick={(e) => e.stopPropagation()}>
        <div className="editar-usuario-header">
          <h2>Editar Usuário</h2>
          <button className="editar-usuario-close" onClick={handleOverlayClose} disabled={saving}>×</button>
        </div>

        <div className="editar-usuario-subtitle">
          <div><strong>ID:</strong> {user.id}</div>
          <div><strong>Perfil:</strong> {user.role}</div>
        </div>

        <form onSubmit={handleSubmit} className="editar-usuario-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input id="name" name="name" value={formData.name} onChange={handleChange} disabled={saving} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={saving} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="aprovado">Status</label>
              <select id="aprovado" name="aprovado" value={String(formData.aprovado)} onChange={handleChange} disabled={saving}>
                <option value="1">Aprovado</option>
                <option value="0">Pendente</option>
              </select>
            </div>

            {isEncarregado && (
              <div className="form-group">
                <label htmlFor="tipo">Tipo (Encarregado)</label>
                <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} disabled={saving}>
                  <option value="">(não definido)</option>
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="instrumento">Instrumento</label>
              <input id="instrumento" name="instrumento" value={formData.instrumento} onChange={handleChange} disabled={saving} />
            </div>
            <div className="form-group">
              <label htmlFor="categoria_instrumento">Categoria (Naipe)</label>
              <input id="categoria_instrumento" name="categoria_instrumento" value={formData.categoria_instrumento} onChange={handleChange} disabled={saving} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="celular">Celular</label>
              <input id="celular" name="celular" value={formData.celular} onChange={handleChange} disabled={saving} />
            </div>
            <div className="form-group">
              <label htmlFor="nome_igreja">Nome da Igreja</label>
              <input id="nome_igreja" name="nome_igreja" value={formData.nome_igreja} onChange={handleChange} disabled={saving} />
            </div>
            <div className="form-group">
              <label htmlFor="cidade">Cidade</label>
              <input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} disabled={saving} />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <input id="estado" name="estado" value={formData.estado} onChange={handleChange} disabled={saving} />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={handleOverlayClose} className="btn-cancel" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuario;

