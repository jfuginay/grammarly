// Custom Auth0 interfaces for type checking
interface Auth0User {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  [key: string]: any;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: Auth0User;
  loginWithGoogle: () => void;
  logout: () => void;
}
