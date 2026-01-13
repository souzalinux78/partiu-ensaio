import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import RegisterMusico from './components/RegisterMusico';
import DashboardEncarregado from './components/DashboardEncarregado';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardMusico from './components/DashboardMusico';
import EnsaiosPublicos from './components/EnsaiosPublicos';
import InstallPrompt from './components/InstallPrompt';
import { getAuthToken, getUser } from './utils/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const userData = getUser();
    if (token && userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
  }

  return (
    <Router>
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<EnsaiosPublicos />} />
        <Route 
          path="/login" 
          element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />} 
        />
        <Route 
          path="/register-musico" 
          element={user ? <Navigate to="/dashboard" /> : <RegisterMusico />} 
        />
        <Route 
          path="/dashboard" 
          element={
            user && user.role === 'encarregado' ? (
              <DashboardEncarregado user={user} onLogout={handleLogout} />
            ) : user && user.role === 'musico' ? (
              <DashboardMusico user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        <Route 
          path="/admin" 
          element={user && user.role === 'admin' ? <DashboardAdmin user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
