import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const IndexPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-4 px-6 md:px-10 flex justify-between items-center border-b">
        <Logo />
        <nav className="flex gap-4">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Log In
          </Button>
          <Button onClick={() => router.push('/signup')}>Sign Up</Button>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center text-center">
        <div className="px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to the Grammarly-est
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Your AI-powered writing assistant. Sign up or log in to get started.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/login')}>
              Log In
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/signup')}>
              Sign Up
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 px-6 md:px-10 text-muted-foreground text-sm">
        © {new Date().getFullYear()} <a href="https://www.engindearing.soy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EnginDearing</a>.
      </footer>
    </div>
  );
};

export default IndexPage;