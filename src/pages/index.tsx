import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Zap, Brain, Edit3, MessageSquare, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

const IndexPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [activeDemoIndex, setActiveDemoIndex] = useState(0);
  const textToType = "Experience the future of writing with AI-powered assistance.";
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const demoSentences = [
    { original: "This is a example of how AI can help you write better.", 
      improved: "This is an example of how AI can help you write better." },
    { original: "The company have announced there new product yesterday.", 
      improved: "The company has announced their new product yesterday." },
    { original: "Im not sure weather to go or not.", 
      improved: "I'm not sure whether to go or not." },
  ];

  // Handle navigation with loading state
  const handleNavigation = (path: string) => {
    setIsLoading(true);
    setTimeout(() => router.push(path), 500);
  };

  // Typing animation effect
  useEffect(() => {
    if (typedText.length < textToType.length) {
      const timeout = setTimeout(() => {
        setTypedText(textToType.substring(0, typedText.length + 1));
      }, 50 + Math.random() * 50);
      
      return () => clearTimeout(timeout);
    }
  }, [typedText]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    
    return () => clearInterval(interval);
  }, []);

  // Scroll position effect for parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-cycling through demos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemoIndex((prev) => (prev + 1) % demoSentences.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // AI suggestion effect - simulates real-time feedback
  useEffect(() => {
    if (textAreaRef.current && textAreaRef.current.value) {
      // Simulate AI thinking
      const timeout = setTimeout(() => {
        // Some simple suggestions based on text content
        const text = textAreaRef.current?.value.toLowerCase() || "";
        
        if (text.includes("hello") || text.includes("hi")) {
          setAiSuggestion("Try a more engaging greeting like 'Greetings' or 'Welcome'");
        } else if (text.includes("good") || text.includes("great")) {
          setAiSuggestion("Consider using more precise adjectives like 'exceptional' or 'outstanding'");
        } else if (text.length > 5) {
          setAiSuggestion("Your writing looks good! Consider adding more descriptive language.");
        } else {
          setAiSuggestion("");
        }
      }, 800);
      
      return () => clearTimeout(timeout);
    } else {
      setAiSuggestion("");
    }
  }, [textAreaRef.current?.value]);

  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Neural network animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-slate-900 opacity-50"></div>
        <div className="network-grid"></div>
      </div>

      {/* Header with animated nav */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-gray-200 dark:border-gray-800 py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center"
        style={{
          transform: `translateY(${scrollPosition > 50 ? 0 : 0}px)`,
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <Logo />
        <nav className="flex items-center gap-4 md:gap-6">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => handleNavigation('/login')} className="transition-all hover:scale-105">
            Log In
          </Button>
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={() => handleNavigation('/signup')} className="relative overflow-hidden group">
              <span className="relative z-10">Sign Up</span>
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300"></span>
            </Button>
          </motion.div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center relative z-10">
        {/* Hero section with dynamic typing */}
        <section className="w-full py-20 md:py-32 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto relative z-10"
          >
            <Badge variant="outline" className="mb-6 px-4 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              <Sparkles className="inline mr-2 h-4 w-4" /> AI-POWERED WRITING
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              Welcome to the <span className="text-blue-600 dark:text-blue-400">Grammarly-est</span>
            </h1>
            
            <div className="h-12 mb-8 text-xl sm:text-2xl text-gray-700 dark:text-gray-300">
              <span>{typedText}</span>
              <span className={`inline-block w-0.5 h-6 bg-blue-600 dark:bg-blue-400 ml-1 align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  onClick={() => handleNavigation('/signup')} 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Get Started Free
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => handleNavigation('/login')} 
                  className="rounded-full px-8"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Log In
                </Button>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Floating particles background */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-blue-500 dark:bg-blue-400"
                style={{
                  width: Math.random() * 10 + 5 + 'px',
                  height: Math.random() * 10 + 5 + 'px',
                  opacity: Math.random() * 0.3 + 0.1,
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%',
                }}
                animate={{
                  y: [0, Math.random() * 100 - 50],
                  x: [0, Math.random() * 100 - 50],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: Math.random() * 10 + 20,
                }}
              />
            ))}
          </div>
        </section>

        {/* Interactive demo section */}
        <section className="w-full py-16 bg-gradient-to-b from-transparent to-blue-50 dark:to-slate-800/30 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Experience AI-Powered Writing</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Our advanced AI analyzes your text in real-time, providing suggestions to enhance clarity, correctness, and impact.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Interactive typing demo */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 order-2 md:order-1 transform transition-all duration-500 hover:shadow-2xl">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Edit3 className="mr-2 h-5 w-5 text-blue-500" />
                  Try it yourself
                </h3>
                <div className="relative">
                  <textarea
                    ref={textAreaRef}
                    className="w-full h-32 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type something here to see AI suggestions..."
                    onChange={(e) => e.target.value} // Just to trigger the effect
                  ></textarea>
                  
                  <AnimatePresence>
                    {aiSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg text-sm"
                      >
                        <div className="flex items-start">
                          <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-blue-800 dark:text-blue-200">AI Suggestion:</p>
                            <p className="text-gray-700 dark:text-gray-300">{aiSuggestion}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Auto-cycling demo examples */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 order-1 md:order-2">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-blue-500" />
                  See AI corrections
                </h3>
                
                <div className="space-y-6">
                  {demoSentences.map((demo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: activeDemoIndex === index ? 1 : 0.5,
                        scale: activeDemoIndex === index ? 1 : 0.98,
                      }}
                      className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
                    >
                      <div className="mb-2 text-gray-500 dark:text-gray-400">Original:</div>
                      <p className="mb-4 text-gray-700 dark:text-gray-300">{demo.original}</p>
                      
                      <div className="mb-2 text-green-600 dark:text-green-400 flex items-center">
                        <Check className="mr-1 h-4 w-4" /> Improved:
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{demo.improved}</p>
                    </motion.div>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Powered by Advanced AI</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Experience writing assistant features that only AI can provide.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Edit3 className="h-10 w-10 text-blue-500" />,
                  title: "Real-time Editing",
                  description: "Get instant suggestions as you type with our AI-powered grammar and spelling assistant."
                },
                {
                  icon: <MessageSquare className="h-10 w-10 text-purple-500" />,
                  title: "Smart Conversations",
                  description: "Chat with our AI to get writing advice or generate ideas for your content."
                },
                {
                  icon: <Brain className="h-10 w-10 text-pink-500" />,
                  title: "Contextual Understanding",
                  description: "Our AI understands context, meaning, and tone to provide genuinely helpful suggestions."
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
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <div>© {new Date().getFullYear()} <a href="https://www.engindearing.soy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EnginDearing</a></div>
            <div className="mt-3 md:mt-0">Powered by advanced AI technology</div>
          </div>
        </div>
      </footer>
      
      {/* Custom CSS for neural network grid */}
      <style jsx>{`
        .network-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(circle at 2px 2px, rgba(0, 0, 255, 0.1) 1px, transparent 0),
                           radial-gradient(circle at 2px 2px, rgba(0, 0, 255, 0.05) 1px, transparent 0);
          background-size: 30px 30px, 90px 90px;
          animation: moveGrid 100s linear infinite;
        }
        
        @keyframes moveGrid {
          0% {
            background-position: 0 0, 0 0;
          }
          100% {
            background-position: 1000px 1000px, 500px 500px;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .network-grid {
            background-image: radial-gradient(circle at 2px 2px, rgba(100, 150, 255, 0.1) 1px, transparent 0),
                             radial-gradient(circle at 2px 2px, rgba(100, 150, 255, 0.05) 1px, transparent 0);
          }
        }
      `}</style>
    </div>
  );
};

export default IndexPage;