import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";

const UserInfo = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently, logout } = useAuth0();
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
            }
          });
          setAccessToken(token);
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to get token');
          setAccessToken(null);
        }
      }
    };
    
    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!isAuthenticated) return <div className="p-8">Not signed in</div>;

  return (
    <div className="max-w-3xl mx-auto my-10 p-6 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">User Info</h2>
      <pre className="bg-muted p-4 rounded mb-6 overflow-auto">{JSON.stringify(user, null, 2)}</pre>
      
      <h3 className="text-xl font-bold mb-2">Google Access Token</h3>
      {error ? (
        <div className="bg-destructive/20 p-4 rounded mb-4 text-destructive">
          Error: {error}
        </div>
      ) : null}
      <pre className="bg-muted p-4 rounded mb-6 overflow-auto break-all">
        {accessToken || 'No token found'}
      </pre>
      
      <Button 
        variant="destructive" 
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Sign out
      </Button>
    </div>
  );
};

export default UserInfo;
