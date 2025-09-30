import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, AuthResponse } from '../api/Api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  subscription: string;
  testsCompleted?: number;
}

interface Admin {
  id: string;
  email: string;
  role: string;
  loginTime?: string;
}

interface AdminAuthResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    role: string;
    loginTime?: string;
  };
  token?: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user and admin data on mount
    const checkAuth = async () => {
      // Check for regular user
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

      // Check for admin user
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        try {
          const adminData = JSON.parse(storedAdmin);
          setAdmin(adminData);
        } catch (error) {
          console.error('Error parsing stored admin data:', error);
          localStorage.removeItem('admin');
          localStorage.removeItem('adminToken');
        }
      }

      // Small delay to prevent flash of loading screen
      setTimeout(() => {
        setLoading(false);
      }, 100);
    };

    checkAuth();
  }, []);

  const handleAdminResponse = (response: AdminAuthResponse) => {
    if (response.success && response.data) {
      const adminData: Admin = {
        id: response.data.email, // Using email as ID for admin
        email: response.data.email,
        role: response.data.role,
        loginTime: response.data.loginTime
      };

      setAdmin(adminData);
      
      // Store admin data in localStorage
      localStorage.setItem('admin', JSON.stringify(adminData));
      
      // Store admin token if provided
      if (response.token) {
        localStorage.setItem('adminToken', response.token);
      }

      // Clear user data when admin logs in (mutual exclusivity)
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const handleAuthResponse = (response: AuthResponse) => {
    if (response.success && response.data) {
      const userData: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        avatar: response.data.avatar,
        isVerified: response.data.isVerified,
        subscription: response.data.subscription || 'free', // Default subscription
        testsCompleted: response.data.testsCompleted || 0 // Default tests completed
      };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      // Clear admin data when user logs in (mutual exclusivity)
      setAdmin(null);
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await api.adminLogin(email, password);
      handleAdminResponse(response);
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
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

  const adminLogout = async () => {
    try {
      await api.adminLogout();
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      setAdmin(null);
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
    }
  };

  const value: AuthContextType = {
    user,
    admin,
    loading,
    isAdmin: !!admin,
    login,
    register,
    adminLogin,
    logout,
    adminLogout
  };

  return (
    <AuthContext.Provider value={value}>
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

// Additional hook specifically for admin operations
export function useAdmin() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdmin must be used within AuthProvider');
  }
  
  if (!context.admin) {
    throw new Error('Admin access required');
  }
  
  return {
    admin: context.admin,
    adminLogout: context.adminLogout,
    isAdmin: context.isAdmin
  };
}
