import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, profileAPI } from '../services/api';

const AuthContext = createContext(null);

const DEMO_USERS = [
  { id: 1, name: 'Alex Founder', email: 'founder@ventureiq.com', password: 'demo1234', role: 'FOUNDER', avatar: 'AF', company: 'QuickRoom Inc.' },
  { id: 2, name: 'Sarah Investor', email: 'investor@ventureiq.com', password: 'demo1234', role: 'INVESTOR', avatar: 'SI', firm: 'Sequoia Capital' },
  { id: 3, name: 'Admin User', email: 'admin@ventureiq.com', password: 'demo1234', role: 'ADMIN', avatar: 'AU' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getRegisteredUsers = () => {
    try {
      const stored = localStorage.getItem('ventureiq_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('ventureiq_user');
    const token = localStorage.getItem('ventureiq_token');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.role) parsed.role = parsed.role.toUpperCase();
        setUser(parsed);
      } catch { localStorage.removeItem('ventureiq_user'); }
    }
    if (token) {
      profileAPI.get().then(res => {
        if (res.data) {
          setUser(prev => {
            const updated = {
              ...prev,
              role: res.data.role ? res.data.role.toUpperCase() : (prev?.role ? prev.role.toUpperCase() : 'FOUNDER'),
              name: res.data.name || prev?.name,
              firm: res.data.firm || prev?.firm,
              company: res.data.company || prev?.company,
              location: res.data.location || prev?.location,
              bio: res.data.bio || prev?.bio,
              investment_thesis: res.data.investment_thesis || prev?.investment_thesis
            };
            localStorage.setItem('ventureiq_user', JSON.stringify(updated));
            return updated;
          });
        }
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    setError(null);
    setLoading(true);

    try {
      // Attempt live Django backend login
      const res = await authAPI.login(email, password, role);
      const safeUser = res.data.user;
      if (safeUser && safeUser.role) safeUser.role = safeUser.role.toUpperCase();
      if (res.data.token) {
        localStorage.setItem('ventureiq_token', res.data.token);
      }
      setUser(safeUser);
      localStorage.setItem('ventureiq_user', JSON.stringify(safeUser));
      setLoading(false);
      return safeUser;
    } catch (apiErr) {
      // If backend explicitly rejected (400/403/404) — propagate immediately,
      // do NOT fall through to the offline demo fallback.
      // This ensures deleted accounts cannot sneak in via localStorage.
      const httpStatus = apiErr.response?.status;
      if (httpStatus === 400 || httpStatus === 403 || httpStatus === 404) {
        setLoading(false);
        const err = apiErr.response?.data?.error || 'Invalid credentials.';
        setError(err);
        throw new Error(err);
      }

      // Fallback only for genuine network / server-down scenarios
      await new Promise(r => setTimeout(r, 600));
      const allUsers = [...DEMO_USERS, ...getRegisteredUsers()];
      const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

      if (!found) {
        setLoading(false);
        const err = 'Invalid email or password.';
        setError(err);
        throw new Error(err);
      }

      if (role && found.role !== role.toUpperCase()) {
        setLoading(false);
        const err = `Incorrect role. This account is registered as ${found.role}.`;
        setError(err);
        throw new Error(err);
      }

      const { password: _, ...safeUser } = found;
      if (safeUser && safeUser.role) safeUser.role = safeUser.role.toUpperCase();
      setUser(safeUser);
      localStorage.setItem('ventureiq_user', JSON.stringify(safeUser));
      setLoading(false);
      return safeUser;
    }
  };

  const loginWithGoogle = async (credential, role, mode = 'signup') => {
    setError(null);
    setLoading(true);
    try {
      const res = await authAPI.googleAuth(credential, role, mode);
      const safeUser = res.data.user;
      if (safeUser && safeUser.role) safeUser.role = safeUser.role.toUpperCase();
      if (res.data.token) {
        localStorage.setItem('ventureiq_token', res.data.token);
      }
      if (res.data.refresh) {
        localStorage.setItem('ventureiq_refresh', res.data.refresh);
      }
      setUser(safeUser);
      localStorage.setItem('ventureiq_user', JSON.stringify(safeUser));
      setLoading(false);
      return safeUser;
    } catch (apiErr) {
      setLoading(false);
      const err = apiErr.response?.data?.error || 'Google sign-in failed. Please try again.';
      setError(err);
      throw new Error(err);
    }
  };

  const register = async (data) => {
    setError(null);
    setLoading(true);

    try {
      const res = await authAPI.register(data);
      const safeUser = res.data.user;
      if (safeUser && safeUser.role) safeUser.role = safeUser.role.toUpperCase();
      if (res.data.token) {
        localStorage.setItem('ventureiq_token', res.data.token);
      }
      setUser(safeUser);
      localStorage.setItem('ventureiq_user', JSON.stringify(safeUser));
      setLoading(false);
      return safeUser;
    } catch (apiErr) {
      await new Promise(r => setTimeout(r, 600));
      const allUsers = [...DEMO_USERS, ...getRegisteredUsers()];
      const exists = allUsers.find(u => u.email === data.email);
      if (exists) {
        setLoading(false);
        const err = apiErr.response?.data?.error || 'An account with this email already exists.';
        setError(err);
        throw new Error(err);
      }

      const newUser = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        avatar: data.name.slice(0, 2).toUpperCase()
      };

      const registered = getRegisteredUsers();
      registered.push(newUser);
      localStorage.setItem('ventureiq_registered_users', JSON.stringify(registered));

      const { password: _, ...safeUser } = newUser;
      setUser(safeUser);
      localStorage.setItem('ventureiq_user', JSON.stringify(safeUser));
      setLoading(false);
      return safeUser;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ventureiq_user');
    localStorage.removeItem('ventureiq_token');
  };

  const deleteAccount = async () => {
    if (user?.email) {
      try {
        const reg = getRegisteredUsers();
        const filtered = reg.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
        localStorage.setItem('ventureiq_registered_users', JSON.stringify(filtered));
      } catch { /* silent */ }
    }
    logout();
  };

  // Call this after saving profile fields so the dashboard reflects changes instantly
  const updateUser = (fields) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      localStorage.setItem('ventureiq_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithGoogle, register, logout, setError, updateUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
