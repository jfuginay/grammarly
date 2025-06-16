import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';

const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/magic-link-login', '/reset-password'];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!initializing && !user && !publicRoutes.includes(router.pathname)) {
      router.push('/login');
    }
  }, [user, initializing, router]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user && !publicRoutes.includes(router.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;