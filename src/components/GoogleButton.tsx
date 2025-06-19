import React from 'react';
import { Button } from "@/components/ui/button";
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';

const GoogleButton = () => {
  const { loginWithGoogle, isLoading } = useAuth();

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full flex items-center justify-center gap-2"
      disabled={isLoading}
      onClick={loginWithGoogle}
    >
      <FcGoogle className="h-5 w-5" />
      <span>Sign in with Google</span>
    </Button>
  );
};

export default GoogleButton;
