import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Logo from '@/components/Logo';
import Link from 'next/link';

const LoginPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { error: errorParam } = router.query;
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please log in again.');
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Please log in again to continue.",
      });
    } else if (errorParam === 'config_error') {
      setError('A server configuration error occurred. Please contact support.');
       toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "The server is missing its authentication secret.",
      });
    } else if (errorParam) {
      setError('An authentication error occurred.');
    }
  }, [router.query, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast({
        title: "Logged in successfully!",
      });
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background justify-center items-center">
      <div className="flex flex-col gap-5 w-full max-w-sm px-4">
        <div className="w-full flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging In...' : 'Log In'}
                </Button>
                <div className="mt-4 text-center text-sm">
                  Don't have an account?{' '}
                  <Link href="/signup" className="underline">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;