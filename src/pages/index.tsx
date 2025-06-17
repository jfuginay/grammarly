import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const IndexPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-4 px-6 md:px-10 flex justify-between items-center">
        <Logo />
        <nav className="flex gap-4">
          <Button variant="ghost" onClick={() => router.push('/login')}>
            Log In
          </Button>
          <Button onClick={() => router.push('/signup')}>Sign Up</Button>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 px-6 md:px-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Write with Confidence
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Our intelligent writing assistant helps you craft clear, compelling text. From grammar and spelling to tone and style, we've got you covered.
          </p>
          <Button size="lg" onClick={() => router.push('/signup')}>
            Get Started for Free
          </Button>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 md:px-10 bg-muted">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Write Better
            </h2>
            <div className="grid md:grid-cols-3 gap-10 text-center">
              <div>
                <h3 className="text-xl font-semibold mb-2">Spell & Grammar Check</h3>
                <p className="text-muted-foreground">
                  Catch embarrassing typos and grammatical errors before anyone else does.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Tone Analysis</h3>
                <p className="text-muted-foreground">
                  Ensure your writing has the right tone for your audience, whether it's formal, friendly, or confident.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Suggestions</h3>
                <p className="text-muted-foreground">
                  Go beyond basic corrections with smart suggestions to improve clarity and style.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 px-6 md:px-10 text-muted-foreground text-sm">
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>
    </div>
  );
};

export default IndexPage;