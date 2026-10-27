import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  updateUserPreferences: (theme: 'light' | 'dark' | 'system', language: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          // Apply user theme preference
          if (profile.preferences?.theme) {
            applyTheme(profile.preferences.theme);
          }
        } catch {
          // Token invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    if (data.user.preferences?.theme) {
      applyTheme(data.user.preferences.theme);
    }
  };

  const register = async (name: string, email: string, password: string, role: string = 'user') => {
    const data = await api.register({ name, email, password, role });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUserPreferences = async (theme: 'light' | 'dark' | 'system', language: string) => {
    if (!user) return;
    const updated = await api.updateProfile({
      preferences: {
        ...user.preferences,
        theme,
        language
      }
    });
    setUser(updated);
    applyTheme(theme);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUserPreferences, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
