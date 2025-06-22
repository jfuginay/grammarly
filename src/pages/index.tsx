import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { motion } from 'framer-motion';
import { 
  Loader2, Sparkles, Zap, Brain, MessageSquare, Check, 
  Code, ArrowRight, AlertCircle, Users, Globe, Wrench 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import FloatingTextBackground from '@/components/FloatingTextBackground';

// Types
interface Suggestion {
  id: string;
  type: string;
  severity: string;
  original: string;
  suggestion: string;
  explanation: string;
}

interface ScanResult {
  scanTime: number;
  suggestions: Suggestion[];
}

interface Feature {
  icon: JSX.Element;
  title: string;
  description: string;
  examples?: string;
}

// Constants
const TECHNICAL_FEATURES: Feature[] = [
  {
    icon: <Code className="h-12 w-12 text-blue-500" />,
    title: "Technical Context",
    description: "Understands code comments, documentation, technical specifications, and developer communication patterns.",
    examples: "README files, API docs, code reviews"
  },
  {
    icon: <Users className="h-12 w-12 text-purple-500" />,
    title: "Team Communication",
    description: "Perfect for Slack messages, pull request descriptions, incident reports, and stakeholder updates.",
    examples: "Sprint updates, technical explanations"
  },
  {
    icon: <Globe className="h-12 w-12 text-cyan-500" />,
    title: "Professional Content",
    description: "LinkedIn posts, blog articles, conference proposals, and personal branding content that showcases your expertise.",
    examples: "Technical blog posts, portfolio content"
  }
];

const SIMPLE_FEATURES: Feature[] = [
  {
    icon: <Zap className="h-8 w-8 text-yellow-500" />,
    title: "Real-time Analysis",
    description: "Instant feedback as you type"
  },
  {
    icon: <Brain className="h-8 w-8 text-purple-500" />,
    title: "Context Aware",
    description: "Understands technical terminology"
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
    title: "Interactive Chat",
    description: "Ask questions, get writing advice"
  },
  {
    icon: <Wrench className="h-8 w-8 text-green-500" />,
    title: "Quick Fixes",
    description: "One-click corrections and improvements"
  }
];

const IndexPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [userText, setUserText] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string>("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Handle navigation with loading state
  const handleNavigation = (path: string): void => {
    setIsLoading(true);
    setTimeout(() => router.push(path), 500);
  };

  // Scroll position effect for parallax
  useEffect(() => {
    const handleScroll = (): void => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle spell check scan
  const handleScanNow = async (): Promise<void> => {
    if (!userText.trim()) {
      setScanError("Please enter some text to scan");
      return;
    }

    setIsScanning(true);
    setScanError("");
    setScanResults(null);

    try {
      const response = await fetch('/api/spell-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: userText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setScanResults(result);
    } catch (error) {
      console.error('Spell check error:', error);
      setScanError(error instanceof Error ? error.message : 'Failed to scan text. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Apply suggestion to user text
  const applySuggestionToUserText = (suggestion: Suggestion): void => {
    const newText = userText.replace(suggestion.original, suggestion.suggestion);
    setUserText(newText);
    
    if (scanResults?.suggestions) {
      const updatedSuggestions = scanResults.suggestions.filter(s => s.id !== suggestion.id);
      setScanResults({
        ...scanResults,
        suggestions: updatedSuggestions
      });
    }
  };

  // Render feature card
  const renderFeatureCard = (feature: Feature, index: number, isLarge: boolean = false) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      viewport={{ once: true }}
      className={`bg-white dark:bg-slate-800 rounded-${isLarge ? '2xl' : 'xl'} shadow-${isLarge ? 'xl' : 'md'} p-${isLarge ? '8' : '6'} hover:shadow-${isLarge ? '2xl' : 'xl'} transition-all duration-300 ${isLarge ? 'group hover:scale-105' : ''} ${!isLarge ? 'text-center' : ''}`}
    >
      <div className={`mb-${isLarge ? '6' : '4'} ${isLarge ? 'group-hover:scale-110 transition-transform duration-300' : 'flex justify-center'}`}>
        {feature.icon}
      </div>
      <h3 className={`${isLarge ? 'text-2xl' : 'text-lg'} font-bold mb-${isLarge ? '4' : '2'}`}>
        {feature.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {feature.description}
      </p>
      {feature.examples && (
        <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-sm">
          {feature.examples}
        </Badge>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <FloatingTextBackground />
      
      {/* Navigation */}
      <nav className="relative z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Logo />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Grammarly-EST
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={() => handleNavigation('/login')}
                disabled={isLoading}
                className="hidden sm:inline-flex"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
              <Button 
                onClick={() => handleNavigation('/dashboard')}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                  Your AI-Powered
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  Writing Companion
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
                Built for technical professionals who need more than spell-check. 
                Get intelligent assistance for code documentation, technical blogs, 
                and professional communication.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-4 py-2 text-sm font-medium">
                  ✨ Live Demo - No Signup Required
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-4 py-2 text-sm font-medium">
                  🚀 Real API Integration
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-4 py-2 text-sm font-medium">
                  💼 For Technical Professionals
                </Badge>
              </div>
            </motion.div>

            {/* Live Demo Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Try It Now - Live Demo
                  </h2>
                  <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                    Real API
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter your text (try with some typos or technical content):
                    </label>
                    <textarea
                      ref={textAreaRef}
                      value={userText}
                      onChange={(e) => setUserText(e.target.value)}
                      placeholder="Type something like: 'This function recieve user input and proccess it for the databse using async/await pattern...'"
                      className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userText.length} characters
                    </div>
                    <Button
                      onClick={handleScanNow}
                      disabled={isScanning || !userText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Analyze Text
                        </>
                      )}
                    </Button>
                  </div>

                  {scanError && (
                    <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      <span className="text-red-700 dark:text-red-300">{scanError}</span>
                    </div>
                  )}

                  {scanResults && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Analysis Results ({scanResults.suggestions.length} suggestions):
                      </h3>
                      {scanResults.suggestions.length > 0 ? (
                        <div className="space-y-2">
                          {scanResults.suggestions.map((suggestion) => (
                            <div key={suggestion.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded border">
                              <div className="flex-1">
                                <span className="text-red-600 dark:text-red-400 line-through mr-2">
                                  {suggestion.original}
                                </span>
                                <span className="text-green-600 dark:text-green-400 mr-2">
                                  → {suggestion.suggestion}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({suggestion.type})
                                </span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => applySuggestionToUserText(suggestion)}
                                className="ml-2"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-green-600 dark:text-green-400 font-medium">
                          ✨ Great! No issues found in your text.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technical Features Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Built for Technical Professionals
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Whether you're documenting code, writing technical blogs, or communicating with stakeholders, 
              we understand your context and help you communicate more effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {TECHNICAL_FEATURES.map((feature, i) => renderFeatureCard(feature, i, true))}
          </div>
        </div>
      </section>

      {/* Simple Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features, Simple Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Advanced AI technology that feels effortless to use.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SIMPLE_FEATURES.map((feature, i) => renderFeatureCard(feature, i))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Write Better?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join technical professionals who are already writing more effectively with AI assistance.
            </p>
            <Button
              size="lg"
              onClick={() => handleNavigation('/dashboard')}
              disabled={isLoading}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              Start Writing Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Logo />
              <span className="text-2xl font-bold">Grammarly-EST</span>
            </div>
            <p className="text-gray-400 mb-4">
              AI-powered writing companion for technical professionals
            </p>
            <p className="text-sm text-gray-500">
              © 2024 Grammarly-EST. Built with Next.js and OpenAI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;