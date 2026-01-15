import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { instrumentos, getCategoriaInstrumento } from '../utils/instrumentos';
import './Login.css';

const RegisterMusico = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    instrumento: '',
    categoria_instrumento: '',
    celular: '',
    cidade: '',
    estado: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Se o campo mudado for instrumento, preencher automaticamente a categoria
      if (name === 'instrumento') {
        const categoria = getCategoriaInstrumento(value);
        next.categoria_instrumento = categoria || '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register-musico', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        instrumento: formData.instrumento,
        categoria_instrumento: formData.categoria_instrumento,
        celular: formData.celular,
        cidade: formData.cidade,
        estado: formData.estado,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Partiu Ensaio</h1>
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>Cadastro Realizado!</h2>
            <p className="success-title">
              Seu cadastro foi enviado com sucesso. Aguarde a aprovação do administrador para acessar o sistema.
            </p>
            <p className="success-text">
              Você será redirecionado para a página de login em alguns segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Partiu Ensaio</h1>
        <h2>Cadastro de Músico</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} autoComplete="on">
          <div className="form-group">
            <label htmlFor="name">Nome Completo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>
          <div className="form-row-responsive">
            <div className="form-group">
              <label htmlFor="instrumento">Instrumento</label>
              <select
                id="instrumento"
                name="instrumento"
                value={formData.instrumento}
                onChange={handleChange}
              >
                <option value="">Selecione um instrumento...</option>
                {instrumentos.map((inst, index) => (
                  <option key={index} value={inst.nome}>
                    {inst.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="categoria_instrumento">Categoria</label>
              <input
                type="text"
                id="categoria_instrumento"
                name="categoria_instrumento"
                value={formData.categoria_instrumento}
                readOnly
                placeholder="Preenchido automaticamente"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="celular">Celular</label>
            <input
              type="tel"
              id="celular"
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="form-row-responsive">
            <div className="form-group">
              <label htmlFor="cidade">Cidade</label>
              <input
                type="text"
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                placeholder="Nome da cidade"
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>
          </div>
          <div className="aviso-cadastro">
            ⚠️ <strong>Atenção:</strong> Seu cadastro será enviado para aprovação. Você receberá acesso após a aprovação do administrador.
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Cadastrando...' : 'Cadastrar como Músico'}
          </button>
        </form>
        <p className="auth-link">
          Já tem uma conta? <Link to="/login">Faça login</Link>
        </p>
        <p className="auth-link">
          É encarregado? <Link to="/register">Cadastre-se como encarregado</Link>
        </p>
        <p className="auth-link">
          <Link to="/">Ver ensaios públicos</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterMusico;
