import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      const { data } = await API.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      // Only wipe auth on actual auth failures.
      // Network/temporary server issues can otherwise cause intermittent dashboard/login issues.
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (data) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
