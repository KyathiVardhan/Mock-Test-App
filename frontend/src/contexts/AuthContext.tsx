import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, AuthResponse } from '../api/Api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  subscription?: 'free' | 'pro' | 'premium';
  testsCompleted?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data on mount
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
      // Small delay to prevent flash of loading screen
      setTimeout(() => {
        setLoading(false);
      }, 100);
    };

    checkAuth();
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    if (response.success && response.data) {
      const userData: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        avatar: response.data.avatar,
        isVerified: response.data.isVerified,
        subscription: 'free', // Default subscription
        testsCompleted: 0 // Default tests completed
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      handleAuthResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.register(name, email, password);
      handleAuthResponse(response);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}