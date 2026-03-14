import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kr_token');
    const savedUser = localStorage.getItem('kr_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token
      api.get('/auth/me').then(res => {
        setUser(res.data.user);
        localStorage.setItem('kr_user', JSON.stringify(res.data.user));
      }).catch(() => {
        localStorage.removeItem('kr_token');
        localStorage.removeItem('kr_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('kr_token', token);
    localStorage.setItem('kr_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('kr_token');
    localStorage.removeItem('kr_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('kr_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
