import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { createClient } from '@/util/supabase/component';
import { User, Provider } from '@supabase/supabase-js';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  createUser: (user: User) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializing: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  createUser: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithMagicLink: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  initializing: false
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // If user exists, ensure they're in our database
      if (user) {
        try {
          await createUser(user);
        } catch (error) {
          console.error('Error ensuring user exists in database:', error);
          // Don't fail the auth process if database creation fails
        }
      }
      
      setInitializing(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // The setTimeout is necessary to allow Supabase functions to trigger inside onAuthStateChange
      setTimeout(async () => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // If user signed in and we have a user, ensure they're in our database
        if (event === 'SIGNED_IN' && newUser) {
          try {
            await createUser(newUser);
          } catch (error) {
            console.error('Error ensuring user exists in database:', error);
            // Don't fail the auth process if database creation fails
          }
        }
        
        setInitializing(false);
      }, 0);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const createUser = async (user: User) => {
    try {
      // Use fetch to call our API route for user creation
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // If user already exists, that's OK - don't throw an error
        if (response.status === 200 && responseData.message === 'User already exists') {
          console.log('User already exists in database');
          return;
        }
        
        console.error('Error creating user:', responseData.error);
        throw new Error(responseData.error || 'Failed to create user');
      }

      console.log('User created/verified in database:', responseData);
    } catch (error) {
      console.error('Error creating user:', error);
      // Only show toast error if it's not a "user already exists" scenario
      if (error instanceof Error && !error.message.includes('already exists')) {
        toast({
          variant: "destructive",
          title: "Error", 
          description: "Failed to create user profile",
        });
      }
      // Don't throw the error - we want auth to continue even if DB creation fails
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && data.user) {
      try {
        await createUser(data.user);
      } catch (userError) {
        console.error('Error creating user during sign in:', userError);
        // Don't fail the sign-in process if user creation fails
      }
    }
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "You have successfully signed in",
      });
    }
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (data.user) {
      try {
        await createUser(data.user);
      } catch (userError) {
        console.error('Error creating user during sign up:', userError);
        // Don't fail the sign-up process if user creation fails
      }
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Sign up successful! Please login to continue.",
      });
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Allow creating new users with magic link
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (!error && data.user) {
      try {
        await createUser(data.user);
      } catch (userError) {
        console.error('Error creating user during magic link sign in:', userError);
        // Don't fail the sign-in process if user creation fails
      }
    }
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the login link",
      });
    }
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    }
    
    // Note: The actual user creation will happen in the auth callback
    // and in the onAuthStateChange listener
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Success",
        description: "You have successfully signed out",
      });
      router.push('/');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      throw error;
    } else {
      toast({
        title: "Success",
        description: "Check your email for the password reset link",
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      createUser,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      resetPassword,
      initializing,

    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);