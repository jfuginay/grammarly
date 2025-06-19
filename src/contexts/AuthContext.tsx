import React, { createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  loginWithGoogle: () => void;
  logout: () => void;
}

const defaultContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  loginWithGoogle: () => {},
  logout: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    loginWithRedirect, 
    logout: auth0Logout 
  } = useAuth0();

  const loginWithGoogle = () => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
      }
    });
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
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