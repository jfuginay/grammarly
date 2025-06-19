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
            Finally, an AI Writing Assistant That Gets You.
          </h1>
          <p className="text-xl md:text-2xl text-purple-600 dark:text-purple-400 font-semibold max-w-2xl mx-auto mb-6">
            Out of all the Grammarly clones, this is the Grammarly...est?
          </p>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Stop wrestling with words. Our (surprisingly clever) writing assistant helps you craft text that's clear, compelling, and actually sounds like you. We handle the grammar, spelling, tone, and style—so you can focus on, well, anything else.
          </p>
          <Button size="lg" onClick={() => router.push('/signup')}>
            Get Started for Free (Your Sanity Will Thank You)
          </Button>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 md:px-10 bg-muted">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Engie is Your New Favorite Word Nerd
            </h2>
            <div className="grid md:grid-cols-3 gap-10 text-center">
              <div>
                <h3 className="text-xl font-semibold mb-2">Spell & Grammar Check</h3>
                <p className="text-muted-foreground">
                  Zap those pesky typos and grammar gremlins before your boss (or your mom) spots them.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Tone Analysis</h3>
                <p className="text-muted-foreground">
                  Sound like you mean it. Or don't. We'll help you nail the tone, from 'super serious CEO' to 'just kidding... mostly.'
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Smarter Suggestions & Idea Sparking</h3>
                <p className="text-muted-foreground">
                  Not just corrections—actual upgrades for clarity and style. Plus, if you're stuck, Engie will even help brainstorm. (Yes, really.)
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 px-6 md:px-10 text-muted-foreground text-sm">
        © {new Date().getFullYear()} <a href="https://www.engindearing.soy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">EnginDearing</a>. We're probably not sentient. Yet.
      </footer>
    </div>
  );
};

export default IndexPage;