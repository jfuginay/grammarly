import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Zap, Brain, MessageSquare, Check, Code, ArrowRight, AlertCircle, Users, Globe, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import FloatingTextBackground from '@/components/FloatingTextBackground';

const IndexPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [userText, setUserText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => router.push(path), 500);
  };

  // Scroll position effect for parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle spell check scan
  const handleScanNow = async () => {
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
    } catch (error: any) {
      console.error('Spell check error:', error);
      setScanError(error.message || 'Failed to scan text. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Apply suggestion to user text
  const applySuggestionToUserText = (suggestion: any) => {
    const newText = userText.replace(suggestion.original, suggestion.suggestion);
    setUserText(newText);
    
    // Remove this suggestion from results
    if (scanResults && scanResults.suggestions) {
      const updatedSuggestions = scanResults.suggestions.filter((s: any) => s.id !== suggestion.id);
      setScanResults({
        ...scanResults,
        suggestions: updatedSuggestions
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 opacity-60"></div>
        <FloatingTextBackground isActive={true} />
      </div>

      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/50 dark:border-gray-800/50 py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center transition-all duration-300"
      >
        <Logo />
        <nav className="flex items-center gap-4 md:gap-6">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => handleNavigation('/login')} className="transition-all duration-300 hover:scale-105">
            Log In
          </Button>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={() => handleNavigation('/signup')} className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300">
              <span className="relative z-10">Get Started</span>
            </Button>
          </motion.div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center relative z-10">
        {/* Hero Section with Live Chat */}
        <section className="w-full min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-7xl mx-auto relative z-10 w-full"
          >
            {/* Hero Badge */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <Badge variant="outline" className="mb-6 px-6 py-2 text-sm bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium">
                <Code className="inline mr-2 h-4 w-4" /> FOR TECHNICAL PROFESSIONALS
              </Badge>
            </motion.div>
            
            {/* Main Title */}
            <div className="text-center mb-12">
              <h1 className="font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400"
                  style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', lineHeight: 'clamp(2.8rem, 8.5vw, 5rem)' }}>
                Your AI Writing <span className="text-blue-600 dark:text-blue-400">Companion</span>
              </h1>
              
              {/* Subtitle */}
              <div className="mb-8">
                <p className="text-gray-600 dark:text-gray-300 font-medium"
                   style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>
                  Code by day, create by night? We&apos;ve got you covered.
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-2"
                   style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                  From pull requests to personal posts—your next best tool for content creation, sanity checks, or just having a chat.
                </p>
              </div>
            </div>

            {/* Live Chat Hero - Main Feature */}
            <motion.div 
              className="max-w-5xl mx-auto mb-16"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12 transform transition-all duration-500 hover:shadow-2xl border-2 border-gray-200 dark:border-gray-700">
                
                {/* Chat Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Try Engie Live</h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400">Real AI-powered spell checking with GPT-4o-mini</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 justify-center items-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 font-medium text-base px-4 py-2">
                      ✨ Live Demo - No Signup Required
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 font-medium text-base px-4 py-2">
                      🚀 Real API Connected
                    </Badge>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="relative mb-8">
                  <textarea
                    ref={textAreaRef}
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    className="w-full h-64 p-8 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none text-xl leading-relaxed shadow-inner"
                    placeholder="Paste your code comments, documentation, pull request descriptions, team updates, or any technical content here. Engie will help you write it better, catch errors, and improve clarity. Try it now!"
                  />
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {userText.length} characters
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Brain className="h-4 w-4" />
                        <span>Powered by GPT-4o-mini</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleScanNow}
                      disabled={isScanning || !userText.trim()}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg font-semibold rounded-xl"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-3 h-5 w-5" />
                          Analyze with Engie
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Error Message */}
                  {scanError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-200">Error:</p>
                          <p className="text-red-700 dark:text-red-300">{scanError}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Scan Results */}
                  {scanResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-4"
                    >
                      {/* Scan Stats */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">
                              Analysis Complete
                            </span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {scanResults.scanTime}ms • GPT-4o-mini
                          </div>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Found {scanResults.suggestions?.length || 0} suggestions for improvement
                        </p>
                      </div>

                      {/* Suggestions */}
                      {scanResults.suggestions && scanResults.suggestions.length > 0 ? (
                        <div className="space-y-3">
                          {scanResults.suggestions.map((suggestion: any, index: number) => (
                            <motion.div
                              key={suggestion.id || index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                      📝 {suggestion.type}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {suggestion.severity} Priority
                                    </span>
                                  </div>
                                  <p className="text-sm mb-2">
                                    <span className="text-red-600 line-through">&quot;{suggestion.original}&quot;</span>
                                    {' → '}
                                    <span className="text-green-600 font-medium">&quot;{suggestion.suggestion}&quot;</span>
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {suggestion.explanation}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => applySuggestionToUserText(suggestion)}
                                  size="sm"
                                  className="ml-4 h-8 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs"
                                >
                                  ✓ Apply
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Perfect! No issues found in your text.
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={() => handleNavigation('/signup')} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                    Get Full Access
                  </Button>
                </motion.div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Join thousands of technical professionals using Engie as their writing companion
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* Why Technical Professionals Choose Engie */}
        <section className="w-full py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-blue-600 dark:from-white dark:to-blue-400"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Built for Technical Minds
              </motion.h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Unlike generic writing tools, Engie understands technical communication and adapts to your professional needs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
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
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group hover:scale-105"
                >
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                  <Badge variant="outline" className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 text-sm">
                    {feature.examples}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Simple Features */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">More Than Just Spell Check</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Engie goes beyond traditional grammar checkers to provide intelligent, contextual assistance for all your writing needs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
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
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300 text-center"
                >
                  <div className="mb-4 flex justify-center">{feature.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 text-center border-t border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <div>© {new Date().getFullYear()} <a href="https://www.engindearing.soy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EnginDearing</a></div>
            <div className="mt-3 md:mt-0">Powered by Engie Suggestion Technology (EST)</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndexPage;
