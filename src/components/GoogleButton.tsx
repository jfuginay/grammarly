import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const GoogleButton = () => {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center"
      onClick={handleGoogleLogin}
    >
      <Image src="/favicon.svg" alt="Google logo" width={20} height={20} className="mr-2" />
      Sign in with Google
    </Button>
  );
};

export default GoogleButton;
