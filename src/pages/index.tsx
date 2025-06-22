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

  // Rest of the JSX remains the same...
  return (
    // ... (keep the existing JSX structure, just update the feature mapping sections)
    // For technical features:
    <div className="grid md:grid-cols-3 gap-8">
      {TECHNICAL_FEATURES.map((feature, i) => renderFeatureCard(feature, i, true))}
    </div>

    // For simple features:
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {SIMPLE_FEATURES.map((feature, i) => renderFeatureCard(feature, i))}
    </div>
  );
};

export default IndexPage;