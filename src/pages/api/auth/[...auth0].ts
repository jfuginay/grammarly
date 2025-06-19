import { handleAuth, handleLogin, handleCallback, handleLogout, handleProfile } from '@auth0/nextjs-auth0';

// Use the correct Auth0 configuration from environment variables
export default handleAuth({
  async login(req, res) {
    try {
      console.log('Auth0 login attempt with config:', {
        issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
        baseURL: process.env.AUTH0_BASE_URL,
        clientID: process.env.AUTH0_CLIENT_ID ? 'Set' : 'Not set',
        scope: process.env.AUTH0_SCOPE
      });
      
      await handleLogin(req, res, {
        authorizationParams: {
          // For Google OAuth connection
          connection: 'google-oauth2',
          // Include the necessary scopes
          scope: process.env.AUTH0_SCOPE || 'openid profile email',
        },
        returnTo: '/dashboard'
      });
    } catch (error: any) {
      console.error('Login error details:', error);
      res.status(500).json({ 
        error: 'Login failed', 
        message: error.message || 'Unknown error', 
        cause: error.cause?.message || 'No cause specified' 
      });
    }
  },
  callback: handleCallback,
  logout: handleLogout,
  profile: handleProfile
});
