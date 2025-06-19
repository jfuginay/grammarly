import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  loginWithGoogle: () => void;
  logout: () => void;
}

const defaultContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  loginWithGoogle: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  const isAuthenticated = !!user;

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/login?connection=google-oauth2';
  };

  const logout = () => {
    window.location.href = '/api/auth/logout';
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
