import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [processingState, setProcessingState] = useState('Processing authentication...');
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    // Debug logs for troubleshooting
    console.log('Auth callback: isLoading=', isLoading, 'isAuthenticated=', isAuthenticated);
    
    if (error) {
      console.error('Auth0 error:', error);
      setProcessingState(`Authentication error: ${error.message}`);
    }

    // Wait for Auth0 to finish loading and authenticating
    if (!isLoading) {
      if (isAuthenticated) {
        setProcessingState('Authentication successful! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 500); // Small delay to ensure state is settled
      } else if (!error) {
        setProcessingState('Not authenticated. Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 500); // Small delay to ensure state is settled
      }
    }
  }, [isLoading, isAuthenticated, error, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-medium mb-2">{processingState}</h2>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 max-w-md mx-auto">
            <p className="font-bold">Error Details:</p>
            <p className="mt-1">{error.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;