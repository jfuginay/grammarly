import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Zap, Brain, Edit3, MessageSquare, Check, Code, Linkedin, Github, Hash, ArrowRight, ChevronDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import FloatingTextBackground from '@/components/FloatingTextBackground';

const IndexPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedDemoText, setTypedDemoText] = useState("");
  const [selectedWritingType, setSelectedWritingType] = useState(0);
  const [showThinking, setShowThinking] = useState(false);
  const [userText, setUserText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Dynamic taglines for technical professionals
  const taglines = [
    "Code by day, craft by night? We get it.",
    "From pull requests to personal posts.",
    "Technical precision meets human expression.",
    "Write code. Write docs. Write everything better.",
    "Your IDE for words, not just code."
  ];

  // Interactive writing scenarios
  const writingScenarios = useMemo(() => [
    {
      type: "LinkedIn Post",
      icon: <Linkedin className="h-5 w-5" />,
      color: "from-blue-500 to-blue-600",
      placeholder: "Just shipped a new feature...",
      sample: "Just shipped a caching layer that reduced our API response time from 850ms to 340ms - a 60% improvement! 🚀 The biggest win wasn't the Redis implementation, but discovering we were making redundant database calls. Sometimes the best optimizations come from questioning your assumptions. What's your latest performance breakthrough?",
      aiSuggestion: "Excellent technical post! Your specific metrics (850ms → 340ms) and insight about redundant calls make this engaging. The question at the end will drive meaningful discussions. Consider adding a brief mention of the business impact.",
      context: "Professional networking"
    },
    {
      type: "GitHub README",
      icon: <Github className="h-5 w-5" />,
      color: "from-gray-700 to-gray-900",
      placeholder: "## Installation...",
      sample: "# FastAPI Cache\n\nA lightweight Redis caching middleware for FastAPI applications.\n\n## Installation\n\n```bash\npip install fastapi-cache\n```\n\n## Quick Start\n\n```python\nfrom fastapi import FastAPI\nfrom fastapi_cache import CacheMiddleware\n\napp = FastAPI()\napp.add_middleware(CacheMiddleware, redis_url=\"redis://localhost\")\n```",
      aiSuggestion: "Great structure! Your README has a clear description, installation steps, and code example. Consider adding: 1) A features list, 2) Configuration options, 3) Performance benchmarks, and 4) Contributing guidelines to make it more comprehensive.",
      context: "Documentation"
    },
    {
      type: "Slack Message",
      icon: <Hash className="h-5 w-5" />,
      color: "from-purple-500 to-purple-600",
      placeholder: "Hey team...",
      sample: "🚨 Production alert: Our payment processing endpoint is throwing 500 errors since the 2:30 PM deployment. Error rate jumped from 0.1% to 15%. I'm seeing 'database connection timeout' in the logs. Rolling back now, but we should investigate the connection pool changes in PR #847.",
      aiSuggestion: "Perfect incident communication! You included timeline (2:30 PM), impact metrics (0.1% → 15%), specific error details, immediate action (rollback), and next steps (investigate PR #847). This gives the team everything they need to respond effectively.",
      context: "Team communication"
    }
  ], []);

  const demoSentences = useMemo(() => [
    { 
      original: "Our API endpoint is experiencing latency issues that effects user experience.", 
      improved: "Our API endpoint is experiencing latency issues that affect user experience.",
      type: "Grammar",
      explanation: "Fixed subject-verb agreement: 'issues' (plural) requires 'affect' not 'effects'"
    },
    { 
      original: "The deployment went smooth, but we need to optimize the database queries for better performance going forward.", 
      improved: "The deployment went smoothly, but we need to optimize database queries for better performance.",
      type: "Style",
      explanation: "Changed 'smooth' to 'smoothly' (adverb) and removed redundant phrases for clarity"
    },
    { 
      original: "Please find the attached documentation for the new feature implementation that we discussed in our meeting yesterday.", 
      improved: "Here's the documentation for the new feature we discussed yesterday.",
      type: "Clarity",
      explanation: "Simplified wordy business-speak into clear, direct communication"
    },
    { 
      original: "The algorithm performs good on most datasets, however it struggles with edge cases.", 
      improved: "The algorithm performs well on most datasets; however, it struggles with edge cases.",
      type: "Grammar",
      explanation: "Fixed adverb usage ('well' not 'good') and proper semicolon before 'however'"
    },
    { 
      original: "We should of tested this more thoroughly before pushing to production.", 
      improved: "We should have tested this more thoroughly before pushing to production.",
      type: "Grammar",
      explanation: "Corrected common error: 'should have' not 'should of'"
    },
    { 
      original: "The refactoring reduced code complexity and improved maintainability and also enhanced performance.", 
      improved: "The refactoring reduced code complexity, improved maintainability, and enhanced performance.",
      type: "Style",
      explanation: "Fixed parallel structure in series and removed redundant 'and also'"
    }
  ], []);

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => router.push(path), 500);
  };

  // Cycle through taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [taglines.length]);

  // Typing animation for demo text with realistic timing
  useEffect(() => {
    const currentScenario = writingScenarios[selectedWritingType];
    if (typedDemoText.length < currentScenario.sample.length) {
      setIsTyping(true);
      const char = currentScenario.sample[typedDemoText.length];
      
      // Variable typing speed based on character type for realism
      let delay = 80; // Base delay
      if (char === ' ') delay = 120; // Pause at spaces
      else if (char === '.' || char === '!' || char === '?') delay = 300; // Longer pause at sentence endings
      else if (char === ',' || char === ';' || char === ':') delay = 200; // Medium pause at punctuation
      else if (char === '\n') delay = 400; // Pause at line breaks
      else if (Math.random() < 0.1) delay = delay + Math.random() * 100; // Random thinking pauses
      
      const timeout = setTimeout(() => {
        setTypedDemoText(currentScenario.sample.substring(0, typedDemoText.length + 1));
      }, delay);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      // Show thinking indicator after typing is complete, before suggestion
      if (typedDemoText.length >= Math.min(currentScenario.sample.length * 0.7, 100)) {
        setTimeout(() => setShowThinking(true), 600);
        setTimeout(() => setShowThinking(false), 1800);
      }
    }
  }, [typedDemoText, selectedWritingType, writingScenarios]);

  // Reset typing when scenario changes
  useEffect(() => {
    setTypedDemoText("");
    setIsTyping(true);
    setShowThinking(false);
  }, [selectedWritingType]);

  // Auto-cycle through writing scenarios (increased to allow time for suggestions)
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedWritingType((prev) => (prev + 1) % writingScenarios.length);
    }, 12000); // Increased from 8s to 12s to allow full suggestion cycle
    
    return () => clearInterval(interval);
  }, [writingScenarios.length]);

  // Scroll position effect for parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-cycling through demos (longer interval for enhanced content)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemoIndex((prev) => (prev + 1) % demoSentences.length);
    }, 7000); // Increased to 7 seconds for better readability
    
    return () => clearInterval(interval);
  }, [demoSentences.length]);

  const currentScenario = writingScenarios[selectedWritingType];

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

      {/* Header with enhanced nav */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/50 dark:border-gray-800/50 py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center transition-all duration-300"
        style={{
          transform: `translateY(${scrollPosition > 50 ? 0 : 0}px)`,
        }}
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
              <span className="relative z-10">Sign Up</span>
            </Button>
          </motion.div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center relative z-10">
        {/* Transformed Hero Section - Interactive Onboarding */}
        <section className="w-full min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-7xl mx-auto relative z-10 w-full"
          >
            {/* Dynamic Badge */}
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
            
            {/* Main Title with Fluid Typography */}
            <div className="text-center mb-12">
              <h1 className="font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 dark:from-white dark:via-blue-400 dark:to-purple-400"
                  style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', lineHeight: 'clamp(2.8rem, 8.5vw, 5rem)' }}>
                Welcome to <span className="text-blue-600 dark:text-blue-400">Grammarly-EST</span>
              </h1>
              
              {/* Dynamic Tagline */}
              <div className="h-16 flex items-center justify-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTaglineIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="text-gray-600 dark:text-gray-300 font-medium"
                    style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}
                  >
                    {taglines[currentTaglineIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* "Built by" Tagline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className="text-center mb-12"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  built 100 percent AI first by EnginDearing.soy
                </p>
              </motion.div>
            </div>

            {/* Interactive Writing Demo */}
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              {/* Writing Type Selector */}
              <div className="space-y-6">
                <motion.h2 
                  className="font-bold text-gray-900 dark:text-white mb-6"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                >
                  See Engie&apos;s intelligent corrections in action
                </motion.h2>
                
                <div className="space-y-3">
                  {writingScenarios.map((scenario, index) => (
                    <motion.button
                      key={index}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                        selectedWritingType === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
                      }`}
                      onClick={() => setSelectedWritingType(index)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${scenario.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                          {scenario.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{scenario.type}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.context}</p>
                        </div>
                        <ArrowRight className={`h-5 w-5 transition-all duration-300 ${
                          selectedWritingType === index ? 'text-blue-600 translate-x-1' : 'text-gray-400'
                        }`} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Live Demo Area */}
              <motion.div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${currentScenario.color} text-white`}>
                    {currentScenario.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{currentScenario.type}</h3>
                  <Badge variant="outline" className="ml-auto text-xs">Live Demo</Badge>
                </div>
                
                <div className="relative">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 min-h-[120px] font-mono text-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-500 dark:text-gray-400 mb-2 text-xs uppercase tracking-wide">
                      {currentScenario.context}
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {typedDemoText}
                      <span className={`inline-block w-0.5 h-4 bg-blue-600 dark:bg-blue-400 ml-1 ${isTyping ? 'animate-pulse' : ''}`}></span>
                    </div>
                  </div>
                  
                  {/* Thinking indicator */}
                  <AnimatePresence>
                    {showThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="p-1 bg-purple-500 rounded-full"
                          >
                            <Brain className="h-3 w-3 text-white" />
                          </motion.div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Engie is analyzing...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {typedDemoText.length > Math.min(currentScenario.sample.length * 0.7, 100) && !isTyping && !showThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.8 }}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <motion.div 
                            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.0, duration: 0.3 }}
                          >
                            <Sparkles className="h-4 w-4 text-white" />
                          </motion.div>
                          <div className="flex-1">
                            <motion.p 
                              className="font-medium text-purple-800 dark:text-purple-200 mb-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.2, duration: 0.4 }}
                            >
                              Engie suggests:
                            </motion.p>
                            <motion.p 
                              className="text-gray-700 dark:text-gray-300 text-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.4, duration: 0.4 }}
                            >
                              {currentScenario.aiSuggestion}
                            </motion.p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Enhanced CTA Section */}
            <motion.div 
              className="text-center mt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={() => handleNavigation('/signup')} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
                    Start Writing Better
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => handleNavigation('/login')} 
                    className="rounded-full px-8 py-4 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    Log In
                  </Button>
                </motion.div>
              </div>
              
              <motion.div 
                className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer group"
                whileHover={{ y: 5 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <span className="text-sm">See Engie in action</span>
                <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform duration-300" />
              </motion.div>
            </motion.div>
          </motion.div>
          

        </section>

        {/* Meet Engie section */}
        <section className="w-full py-20 bg-gradient-to-b from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-3 mb-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                  Meet Engie
                </h2>
              </motion.div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Your AI writing companion that doesn&apos;t just check grammar—it understands context, 
                enhances creativity, and adapts to your unique writing style.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  icon: <Brain className="h-12 w-12 text-purple-500" />,
                  title: "Contextual Intelligence",
                  description: "Engie doesn&apos;t just spot errors—it understands what you&apos;re trying to say and helps you say it better.",
                  feature: "Smart Context Analysis"
                },
                {
                  icon: <MessageSquare className="h-12 w-12 text-blue-500" />,
                  title: "Interactive Conversations",
                  description: "Chat directly with Engie for writing advice, brainstorming, or getting unstuck on any project.",
                  feature: "Real-time Chat Support"
                },
                {
                  icon: <Zap className="h-12 w-12 text-cyan-500" />,
                  title: "Adaptive Learning",
                  description: "Engie learns your writing patterns and preferences to provide increasingly personalized suggestions.",
                  feature: "Personalized Assistance"
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
                  <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    {feature.feature}
                  </Badge>
                </motion.div>
              ))}
            </div>

            {/* Engie in Action Preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white text-center"
            >
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                See Engie in Action
              </h3>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Experience the future of writing assistance with our interactive technical writing prompts, 
                real-time suggestions, and intelligent document creation.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={() => handleNavigation('/signup')} 
                    className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-8 font-semibold"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Try Engie Now
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => handleNavigation('/login')} 
                    className="border-white text-white hover:bg-white hover:text-purple-600 rounded-full px-8"
                  >
                    Watch Demo
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Interactive demo section */}
        <section className="w-full py-16 bg-gradient-to-b from-transparent to-blue-50 dark:to-slate-800/30 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">Try Engie Now - Live Demo</h2>
                              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-4">
                  Experience the power of real AI-powered spell checking with GPT-4o-mini. 
                  Type your text below and get instant, intelligent suggestions that understand context and meaning.
                  This is the power of <span className="font-semibold text-purple-600 dark:text-purple-400">Engie Suggestion Technology</span>.
                </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-2xl mx-auto"
              >
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">Live Functional Demo</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 text-center mt-1">
                  This isn&apos;t a simulation - it&apos;s the real Engie API in action
                </p>
              </motion.div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Enhanced Chat with Engie */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 order-2 md:order-1 transform transition-all duration-500 hover:shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Chat with Engie</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Real-time AI spell checking and suggestions</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 font-medium">
                    ✨ Live Demo
                  </Badge>
                </div>
                <div className="relative">
                  <textarea
                    ref={textAreaRef}
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    className="w-full h-40 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-lg"
                    placeholder="Type your text here to test Engie's real-time spell checking and suggestions. Try including some typos or grammar mistakes to see Engie in action..."
                  />
                  
                  <div className="flex items-center justify-between mt-4">
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
                          Scan with Engie
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Error Message */}
                  {scanError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm"
                    >
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
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
                      className="mt-3 space-y-3"
                    >
                      {/* Scan Stats */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">
                              Scan Complete
                            </span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {scanResults.scanTime}ms • GPT-4o-mini
                          </div>
                        </div>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                          Found {scanResults.suggestions?.length || 0} suggestions
                        </p>
                      </div>

                      {/* Suggestions */}
                      {scanResults.suggestions && scanResults.suggestions.length > 0 ? (
                        <div className="space-y-2">
                          {scanResults.suggestions.map((suggestion: any, index: number) => (
                            <motion.div
                              key={suggestion.id || index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                                      📝 {suggestion.type}
                                    </Badge>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {suggestion.severity} Priority
                                    </span>
                                  </div>
                                  <p className="text-sm mb-1">
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
                                  className="ml-3 h-8 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 text-xs"
                                >
                                  ✓ Apply
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                          <div className="flex items-center">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                              Great job! No spelling errors found.
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Enhanced demo examples */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 order-1 md:order-2">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
                  See Engie&apos;s intelligent corrections
                </h3>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {demoSentences.map((demo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: activeDemoIndex === index ? 1 : 0.6,
                        scale: activeDemoIndex === index ? 1 : 0.98,
                        y: activeDemoIndex === index ? 0 : 5,
                      }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      className={`rounded-lg border-2 transition-all duration-300 ${
                        activeDemoIndex === index 
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-700 shadow-md' 
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="p-4">
                        {/* Type Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium ${
                              demo.type === 'Grammar' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                              demo.type === 'Style' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                              'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                            }`}
                          >
                            {demo.type === 'Grammar' ? '📝' : demo.type === 'Style' ? '🎨' : '💡'} {demo.type}
                          </Badge>
                          {activeDemoIndex === index && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                            >
                              Active
                            </motion.div>
                          )}
                        </div>

                        {/* Original Text */}
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">Original:</div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-through opacity-75">{demo.original}</p>
                        </div>
                        
                        {/* Improved Text */}
                        <div className="mb-3">
                          <div className="text-xs text-green-600 dark:text-green-400 mb-1 font-medium uppercase tracking-wide flex items-center">
                            <Check className="mr-1 h-3 w-3" /> Improved:
                          </div>
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{demo.improved}</p>
                        </div>

                        {/* Explanation (only for active demo) */}
                        <AnimatePresence>
                          {activeDemoIndex === index && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              className="border-t border-gray-200 dark:border-gray-700 pt-3"
                            >
                              <div className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-medium uppercase tracking-wide flex items-center">
                                <Brain className="mr-1 h-3 w-3" /> Engie explains:
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{demo.explanation}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center mt-4 space-x-1">
                  {demoSentences.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeDemoIndex === index ? 'w-6 bg-blue-500' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features grid */}
        <section className="w-full py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Engie is Different</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Unlike traditional grammar checkers, Engie understands context, learns your style, and provides intelligent suggestions that make your writing truly shine.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Edit3 className="h-10 w-10 text-blue-500" />,
                  title: "Beyond Grammar",
                  description: "Engie doesn&apos;t just fix errors—it enhances clarity, flow, and impact in your writing."
                },
                {
                  icon: <MessageSquare className="h-10 w-10 text-purple-500" />,
                  title: "Interactive Guidance",
                  description: "Chat directly with Engie for writing advice, brainstorming, and creative solutions."
                },
                {
                  icon: <Brain className="h-10 w-10 text-pink-500" />,
                  title: "Learns Your Style",
                  description: "Engie adapts to your unique voice and preferences, providing increasingly personalized help."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 text-center border-t border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            site built and maintained using AI first principles @ <a href="https://engindearing.soy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">engindearing.soy</a>
          </div>
        </div>
      </footer>
      
      {/* Custom CSS for responsive fluid typography */}
      <style jsx>{`
        /* Responsive fluid typography utilities */
        @supports (font-size: clamp(1rem, 4vw, 2rem)) {
          .fluid-text-lg { font-size: clamp(1.125rem, 2.5vw, 1.25rem); }
          .fluid-text-xl { font-size: clamp(1.25rem, 3vw, 1.5rem); }
          .fluid-text-2xl { font-size: clamp(1.5rem, 4vw, 2rem); }
          .fluid-text-3xl { font-size: clamp(1.875rem, 5vw, 2.5rem); }
          .fluid-text-4xl { font-size: clamp(2.25rem, 6vw, 3rem); }
        }
      `}</style>
    </div>
  );
};

export default IndexPage;
