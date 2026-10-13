import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    campus?: string;
    studentId?: string;
    whatsapp?: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  submitKtm: (payload: { studentId: string; ktmImageUrl: string; campus?: string }) => Promise<void>;
  updateProfile: (payload: { name?: string; campus?: string; whatsapp?: string; studentId?: string }) => Promise<void>;
  verifyEmail: (code?: string) => Promise<void>;
  loginAsDemoStudent: () => Promise<AuthResponse>;
  loginAsDemoKtmStudent: () => Promise<AuthResponse>;
  loginAsDemoAdmin: () => Promise<AuthResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await api.auth.getMe();
      setUser(currentUser);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    return res;
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    campus?: string;
    studentId?: string;
    whatsapp?: string;
  }): Promise<AuthResponse> => {
    const res = await api.auth.register(payload);
    setUser(res.user);
    return res;
  };

  const logout = async (): Promise<void> => {
    await api.auth.logout();
    setUser(null);
  };

  const submitKtm = async (payload: { studentId: string; ktmImageUrl: string; campus?: string }) => {
    const res = await api.auth.submitKtm(payload);
    setUser(res.user);
  };

  const updateProfile = async (payload: { name?: string; campus?: string; whatsapp?: string; studentId?: string }) => {
    const res = await api.auth.updateProfile(payload);
    setUser(res.user);
  };

  const verifyEmail = async (code?: string) => {
    const res = await api.auth.verifyEmail(code);
    setUser(res.user);
  };

  const loginAsDemoStudent = async (): Promise<AuthResponse> => {
    const res = await api.auth.demoLogin('student');
    setUser(res.user);
    return res;
  };

  const loginAsDemoKtmStudent = async (): Promise<AuthResponse> => {
    const res = await api.auth.demoLogin('ktm_student');
    setUser(res.user);
    return res;
  };

  const loginAsDemoAdmin = async (): Promise<AuthResponse> => {
    const res = await api.auth.demoLogin('admin');
    setUser(res.user);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        submitKtm,
        updateProfile,
        verifyEmail,
        loginAsDemoStudent,
        loginAsDemoKtmStudent,
        loginAsDemoAdmin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
