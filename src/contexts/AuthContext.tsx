import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthUser, LoginCredentials, RegisterData, ApiResponse } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'kanzey_token';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          // Set token for API calls
          authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get current user
          const response = await authApi.get('/auth/me');
          if (response.data.success) {
            setUser({
              id: response.data.data.user._id,
              firstName: response.data.data.user.firstName,
              lastName: response.data.data.user.lastName,
              email: response.data.data.user.email,
              phone: response.data.data.user.phone,
              role: response.data.data.user.role,
              avatar: response.data.data.user.avatar
            });
          }
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem(TOKEN_KEY);
          delete authApi.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await authApi.post<ApiResponse>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        // Store token
        localStorage.setItem(TOKEN_KEY, token);
        authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user
        setUser({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          avatar: userData.avatar
        });
        
        toast.success('Connexion réussie !');
        return true;
      } else {
        toast.error(response.data.message || 'Erreur de connexion');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await authApi.post<ApiResponse>('/auth/register', data);
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        // Store token
        localStorage.setItem(TOKEN_KEY, token);
        authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user
        setUser({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          avatar: userData.avatar
        });
        
        toast.success('Compte créé avec succès !');
        return true;
      } else {
        toast.error(response.data.message || 'Erreur lors de la création du compte');
        return false;
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const message = error.response?.data?.message || 'Erreur lors de la création du compte';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    delete authApi.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser(prev => prev ? { ...prev, ...userData } : null);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAgent: user?.role === 'agent' || user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;