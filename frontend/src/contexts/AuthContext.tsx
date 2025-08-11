import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Axios 인터셉터 설정
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // 토큰 검증 및 사용자 정보 가져오기
  const verifyToken = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`);
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 시 토큰 검증
  useEffect(() => {
    verifyToken();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { user: userData, token: userToken } = response.data.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('token', userToken);
      } else {
        throw new Error(response.data.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || '로그인에 실패했습니다.');
      } else {
        throw new Error('서버 연결에 실패했습니다.');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.permissions.includes('all')) return true;
    return user.permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};