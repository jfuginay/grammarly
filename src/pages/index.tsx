import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const IndexPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-gray-200 dark:border-gray-700 py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Logo />
        <nav className="flex gap-4 md:gap-8">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Log In
          </Button>
          <Button onClick={() => router.push('/signup')}>Sign Up</Button>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center text-center py-16 sm:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900">
        <div className="px-6">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
            Welcome to the Grammarly-est
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
            Your AI-powered writing assistant. Sign up or log in to get started.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Log In
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/signup')} className="bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400">
              Sign Up
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 px-4 sm:px-6 lg:px-8 text-muted-foreground text-sm border-t border-gray-200 dark:border-gray-700">
        © {new Date().getFullYear()} <a href="https://www.engindearing.soy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EnginDearing</a>.
      </footer>
    </div>
  );
};

export default IndexPage;