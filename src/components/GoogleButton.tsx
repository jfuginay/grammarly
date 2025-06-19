import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

const GoogleButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to sign in with Google",
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during sign-in",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      ) : (
        <Image src="/favicon.svg" alt="Google logo" width={20} height={20} className="mr-2" />
      )}
      {isLoading ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
};

export default GoogleButton;
