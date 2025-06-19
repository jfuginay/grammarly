import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";
import GoogleButton from '@/components/GoogleButton';
import Logo from '@/components/Logo';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const LoginPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth0();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
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
            <div className="flex flex-col gap-4">
              <GoogleButton />
              <div className="text-center mt-4">
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => router.push('/signup')}
                >
                  Need an account? Sign up
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;