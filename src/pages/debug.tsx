import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DebugInfo {
  supabaseUrl: string;
  siteUrl: string;
  authState: string;
  user: User | null;
  error: string | null;
  dbTest: string | null;
}

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    supabaseUrl: '',
    siteUrl: '',
    authState: 'loading',
    user: null,
    error: null,
    dbTest: null
  });

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        setDebugInfo(prev => ({
          ...prev,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
          authState: user ? 'authenticated' : 'not authenticated',
          user: user,
          error: error?.message || null
        }));

        // Test database connection
        if (user) {
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: user.id, email: user.email })
            });
            const result = await response.json();
            setDebugInfo(prev => ({
              ...prev,
              dbTest: response.ok ? 'Success' : `Error: ${result.error}`
            }));
          } catch (dbError) {
            setDebugInfo(prev => ({
              ...prev,
              dbTest: `Database test failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
            }));
          }
        }
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          authState: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setDebugInfo(prev => ({
        ...prev,
        authState: session ? 'authenticated' : 'not authenticated',
        user: session?.user || null
      }));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const testGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setDebugInfo(prev => ({
          ...prev,
          error: `Google sign-in error: ${error.message}`
        }));
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        error: `Google sign-in exception: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const testSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setDebugInfo(prev => ({
        ...prev,
        error: `Sign out error: ${error.message}`
      }));
    }
  };

  const testApiCall = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'test-debug-user', email: 'debug@test.com' })
      });
      const result = await response.json();
      setDebugInfo(prev => ({
        ...prev,
        dbTest: response.ok ? `API Success: ${JSON.stringify(result)}` : `API Error: ${result.error}`
      }));
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        dbTest: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Authentication Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Environment Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Supabase URL:</strong>
                  <Badge variant={debugInfo.supabaseUrl.includes('supabase') ? 'default' : 'destructive'}>
                    {debugInfo.supabaseUrl}
                  </Badge>
                </div>
                <div>
                  <strong>Site URL:</strong>
                  <Badge variant="secondary">{debugInfo.siteUrl}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Auth State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authentication State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Status:</strong>
                  <Badge variant={debugInfo.authState === 'authenticated' ? 'default' : 'secondary'}>
                    {debugInfo.authState}
                  </Badge>
                </div>
                {debugInfo.user && (
                  <div>
                    <strong>User ID:</strong> {debugInfo.user.id}<br/>
                    <strong>Email:</strong> {debugInfo.user.email}<br/>
                    <strong>Provider:</strong> {debugInfo.user.app_metadata?.provider}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Database Test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Status:</strong>
                  <Badge variant={debugInfo.dbTest?.includes('Success') ? 'default' : 'destructive'}>
                    {debugInfo.dbTest || 'Not tested'}
                  </Badge>
                </div>
                <Button onClick={testApiCall} variant="outline" size="sm">
                  Test Database API
                </Button>
              </CardContent>
            </Card>

            {/* Errors */}
            {debugInfo.error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-red-600 font-mono text-sm">
                    {debugInfo.error}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testGoogleSignIn} disabled={debugInfo.authState === 'authenticated'}>
              Test Google Sign In
            </Button>
            <Button onClick={testSignOut} variant="outline" disabled={debugInfo.authState !== 'authenticated'}>
              Test Sign Out
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Refresh Page
            </Button>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debug Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Check that environment variables are properly set</li>
                <li>Try the Google Sign In test button</li>
                <li>Check browser console for any JavaScript errors</li>
                <li>Test the database API connection</li>
                <li>If sign-in redirects but fails, check the auth callback page</li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugPage;
