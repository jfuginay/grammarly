import { initAuth0 } from '@auth0/nextjs-auth0';

export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET || '',
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || '', 
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  routes: {
    callback: '/api/auth/callback',
    postLogoutRedirect: '/'
  },
  authorizationParams: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    response_type: 'code'
  },
  session: {
    rollingDuration: 60 * 60 * 8, // 8 hours
  },
  httpTimeout: 5000, // Increase timeout for Auth0 API calls
});