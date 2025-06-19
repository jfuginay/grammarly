// This component is no longer used with the Auth0 v2 SDK
// The Auth0 provider is now set up directly in the API routes

import { ReactNode } from 'react';

interface Auth0ProviderProps {
  children?: ReactNode;
}

// Empty component - Auth0 is now managed via API routes
function Auth0Provider({ children }: Auth0ProviderProps) {
  return <>{children}</>;
}

export default Auth0Provider;
