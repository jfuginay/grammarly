import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AuthDebugPage = () => {
  const { 
    isLoading, 
    isAuthenticated, 
    error, 
    user, 
    getAccessTokenSilently, 
    loginWithRedirect, 
    logout 
  } = useAuth0();

  const [accessToken, setAccessToken] = React.useState<string>('');
  const [tokenError, setTokenError] = React.useState<string>('');

  const fetchToken = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
          scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
        }
      });
      setAccessToken(token);
      setTokenError('');
    } catch (error) {
      console.error('Error fetching token:', error);
      setTokenError(error instanceof Error ? error.message : 'Unknown error fetching token');
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading Auth0 information...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Auth0 Debug Information</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2"><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes ✅' : 'No ❌'}</p>
          <p className="mb-2"><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mt-4">
              <p className="font-bold">Error:</p>
              <p>{error.message}</p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => loginWithRedirect()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Log In
            </button>
            <button 
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Log Out
            </button>
          </div>
        </CardContent>
      </Card>

      {isAuthenticated && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(user, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Access Token</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <button 
                  onClick={fetchToken}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Fetch Access Token
                </button>
              </div>
              
              {tokenError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
                  <p className="font-bold">Token Error:</p>
                  <p>{tokenError}</p>
                </div>
              )}
              
              {accessToken && (
                <div className="overflow-x-auto">
                  <p className="mb-2"><strong>Token (first 50 chars):</strong> {accessToken.substring(0, 50)}...</p>
                  <details>
                    <summary className="cursor-pointer text-blue-500">View Full Token</summary>
                    <pre className="bg-gray-100 p-4 rounded mt-2 whitespace-pre-wrap break-all">{accessToken}</pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2"><strong>NEXT_PUBLIC_AUTH0_DOMAIN:</strong> {process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'Not set'}</p>
              <p className="mb-2"><strong>NEXT_PUBLIC_AUTH0_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'Not set'}</p>
              <p className="mb-2"><strong>NEXT_PUBLIC_AUTH0_AUDIENCE:</strong> {process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || 'Not set'}</p>
              <p className="mb-2"><strong>NEXT_PUBLIC_AUTH0_REDIRECT_URI:</strong> {process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || 'Not set'}</p>
              <p className="mb-2"><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Not available'}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AuthDebugPage;
