import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import GoogleButton from '@/components/GoogleButton';
import Logo from '@/components/Logo';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase login logic removed. Implement new login logic here.
    setIsAuthLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Implement login logic here
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen justify-center items-center bg-background">
      <div className="flex flex-col gap-5 h-auto">
        <div className="w-full flex justify-center cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>

        <Card className="w-full md:w-[440px]">
          <CardHeader>
            <CardTitle className="text-center">Log in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
            <div className="flex items-center w-full my-4">
              <Separator className="flex-1" />
              <span className="mx-4 text-muted-foreground text-sm font-semibold whitespace-nowrap">or</span>
              <Separator className="flex-1" />
            </div>
            <div className="flex flex-col gap-4">
              <GoogleButton />
            </div>
            <div className="flex items-center w-full my-6">
              <Separator className="flex-1" />
              <span className="mx-4 text-muted-foreground text-sm font-semibold whitespace-nowrap">or</span>
              <Separator className="flex-1" />
            </div>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0"
                onClick={() => router.push('/signup')}
              >
                Need an account? Sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;