import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";
import { FcGoogle } from 'react-icons/fc';

const GoogleButton = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleGoogleLogin = () => {
    console.log('Initiating Google login...');
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
        redirect_uri: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/callback` 
          : (process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || 'http://localhost:3000/auth/callback')
      }
    });
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full flex items-center justify-center gap-2"
      disabled={isLoading}
      onClick={handleGoogleLogin}
    >
      <FcGoogle className="h-5 w-5" />
      <span>Sign in with Google</span>
    </Button>
  );
};

export default GoogleButton;
