import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      // Verify token is still valid
      authAPI.getMe()
        .then(res => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.data.mustVerify) return res.data;

    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const exitImpersonation = () => {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('admin_token');
      // Force refresh or reload me
      authAPI.getMe().then(res => {
        const u = res.data.user;
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
        window.location.href = '/super-admin';
      }).catch(() => logout());
    }
  };

  const updateUser = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'sub_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isUniversity = user?.role === 'university' || (user?.role === 'entity' && user?.entity_type === 'university');
  const isEntity = user?.role === 'entity';
  const entityType = user?.entity_type;
  const isAuth = !!user;
  const isImpersonating = !!localStorage.getItem('admin_token');

  return (
    <AuthContext.Provider value={{
      user, loading, isAuth, isAdmin, isSuperAdmin, isUniversity, isEntity, entityType,
      isImpersonating, login, register, logout, updateUser, exitImpersonation
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
