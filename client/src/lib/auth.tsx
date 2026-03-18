'use client';
import {
  createContext, useContext, useEffect, useRef, useState, ReactNode,
} from 'react';
import { authApi } from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'staff' | 'secretariat' | 'case_manager' | 'admin';
  department?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const savedAccessToken = localStorage.getItem('neo_access_token');
    const savedUser        = localStorage.getItem('neo_user');

    if (!savedAccessToken) {
      setLoading(false);
      return;
    }

    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { /* ignore bad JSON */ }
    }

    authApi.me()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('neo_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('neo_access_token');
        localStorage.removeItem('neo_user');
      })
      .finally(() => setLoading(false));
  }, []); 

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { accessToken, user: u } = res.data;
    localStorage.setItem('neo_access_token', accessToken);
    localStorage.setItem('neo_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      localStorage.removeItem('neo_access_token');
      localStorage.removeItem('neo_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isRole = (...roles: string[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
