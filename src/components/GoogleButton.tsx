import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";
import { FcGoogle } from 'react-icons/fc';

const GoogleButton = () => {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full flex items-center justify-center gap-2"
      disabled={isLoading}
      onClick={() => loginWithRedirect({
        // Explicitly request Google login
        authorizationParams: {
          connection: 'google-oauth2',
          scope: 'openid profile email https://www.googleapis.com/auth/drive.file',
        }
      })}
    >
      <FcGoogle className="h-5 w-5" />
      <span>Sign in with Google</span>
    </Button>
  );
};

export default GoogleButton;
