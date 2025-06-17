import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  CheckCircle, 
  Lightbulb, 
  X, 
  User, 
  LogOut, 
  FileText,
  Sparkles,
  Eye,
  EyeOff,
  HelpCircle,
  Home,
  Upload,
  Download,
  Copy,
  Clipboard,
  ExternalLink,
  Smile
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface Suggestion {
  id: string;
  type: 'spelling' | 'grammar' | 'style';
  text: string;
  replacement: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
  severity: 'error' | 'warning' | 'suggestion';
}

interface ToneAnalysisResult {
  overallTone: string;
  toneScores: Record<string, number>;
  highlightedSentences: {
    text: string;
    tone: string;
    startIndex: number;
    endIndex: number;
  }[];
}

const TONE_COLORS: Record<string, string> = {
  Formal: "bg-blue-200 dark:bg-blue-800",
  Friendly: "bg-green-200 dark:bg-green-800",
  Confident: "bg-purple-200 dark:bg-purple-800",
  Analytical: "bg-yellow-200 dark:bg-yellow-800",
  Optimistic: "bg-pink-200 dark:bg-pink-800",
  Default: "bg-gray-200 dark:bg-gray-700",
};

const TONE_PROGRESS_COLORS: Record<string, string> = {
  Formal: "[&>div]:bg-blue-500",
  Friendly: "[&>div]:bg-green-500",
  Confident: "[&>div]:bg-purple-500",
  Analytical: "[&>div]:bg-yellow-500",
  Optimistic: "[&>div]:bg-pink-500",
  Default: "[&>div]:bg-gray-500",
};

// Add mobile detection hook
const useIsMobile = () => useMediaQuery("(max-width: 768px)");

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestionNotification, setShowSuggestionNotification] = useState(false);
  const [isApplyingSuggestion, setIsApplyingSuggestion] = useState(false);
  const [showDocumentOptions, setShowDocumentOptions] = useState(false);
  const [isCheckingTone, setIsCheckingTone] = useState(false);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysisResult | null>(null);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [engieMessage, setEngieMessage] = useState("Hello! I'm Engie. Start typing and I'll share some encouraging thoughts!");
  const [isEngieThinking, setIsEngieThinking] = useState(false);
  const lastTypeTimeRef = useRef(Date.now());
  const charCountRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [lastAnalyzedText, setLastAnalyzedText] = useState("");
  const [hoveredSuggestion, setHoveredSuggestion] = useState<Suggestion | null>(null);

  // Add new state for mobile UI and document handling
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("write");
  const [fileName, setFileName] = useState<string>("");

  const generateSuggestions = useCallback(async (inputText: string): Promise<Suggestion[]> => {
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, []);

  const handleCheckTone = useCallback(async () => {
    if (!text.trim()) return;
    setIsCheckingTone(true);
    try {
      const response = await fetch('/api/check-tone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get tone analysis');
      }

      const data = await response.json();
      setToneAnalysis(data.analysis);
      setActiveTab('tone');
    } catch (error) {
      console.error('Error getting tone analysis:', error);
    } finally {
      setIsCheckingTone(false);
    }
  }, [text]);

  const handleEngieAnalysis = useCallback(async () => {
    if (isEngieThinking || !text.trim() || text === lastAnalyzedText) return;
    setIsEngieThinking(true);
    try {
      const response = await fetch('/api/engie-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.response) {
        setEngieMessage(data.response);
        setLastAnalyzedText(text);
      }
    } catch (error) {
      console.error("Error with Engie's analysis:", error);
    } finally {
      setIsEngieThinking(false);
    }
  }, [text, isEngieThinking, lastAnalyzedText]);

  useEffect(() => {
    const getSuggestions = async () => {
      // Don't generate new suggestions if we're currently applying one
      if (isApplyingSuggestion) return;
      
      setIsLoading(true);
      try {
        const apiSuggestions = await generateSuggestions(text);
        setSuggestions(apiSuggestions);
        
        // Show notification for new suggestions
        if (apiSuggestions.length > 0) {
          setShowSuggestionNotification(true);
          setTimeout(() => setShowSuggestionNotification(false), 3000);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Typing speed and Engie logic
    const wpm = (charCountRef.current / 5) / ((Date.now() - lastTypeTimeRef.current) / 60000);
    setTypingSpeed(wpm);

    const typingTimeout = setTimeout(() => {
      setTypingSpeed(0);
      if (text.trim().length > 20) {
        handleEngieAnalysis();
      } else if (!text.trim()) {
        setEngieMessage("A blank page is full of possibilities! What's on your mind? ✨");
      }
    }, 2000); // Engie analyzes after 2s of inactivity

    if (text.trim() && activeTab !== 'tone') {
      const timeoutId = setTimeout(getSuggestions, 300);
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(typingTimeout);
      };
    } else {
      setSuggestions([]);
      return () => clearTimeout(typingTimeout);
    }
  }, [text, generateSuggestions, activeTab, handleEngieAnalysis]);

  const applySuggestion = (suggestion: Suggestion) => {
    // Set flag to prevent new suggestions from being generated during application
    setIsApplyingSuggestion(true);
    
    // Apply the text change and update suggestions in a single state update
    setText(prevText => {
      const newText = prevText.substring(0, suggestion.startIndex) + 
                     suggestion.replacement + 
                     prevText.substring(suggestion.endIndex);
      
      // Update suggestions immediately after text change
      setSuggestions(prevSuggestions => {
        const filteredSuggestions = prevSuggestions.filter(s => s.id !== suggestion.id);
        const lengthDifference = suggestion.replacement.length - (suggestion.endIndex - suggestion.startIndex);
        
        return filteredSuggestions.map(s => {
          if (s.startIndex > suggestion.endIndex) {
            return {
              ...s,
              startIndex: s.startIndex + lengthDifference,
              endIndex: s.endIndex + lengthDifference
            };
          }
          return s;
        });
      });
      
      return newText;
    });
    
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
    
    // Reset the flag after a short delay to allow new suggestions
    setTimeout(() => {
      setIsApplyingSuggestion(false);
    }, 100);
  };

  const applyAllSuggestions = () => {
    // Set flag to prevent new suggestions from being generated during application
    setIsApplyingSuggestion(true);
    
    // Apply all suggestions and clear the suggestions list
    setText(prevText => {
      const sortedSuggestions = [...suggestions].sort((a, b) => b.startIndex - a.startIndex);
      let updatedText = prevText;
      
      sortedSuggestions.forEach(suggestion => {
        updatedText = updatedText.substring(0, suggestion.startIndex) + 
                      suggestion.replacement + 
                      updatedText.substring(suggestion.endIndex);
      });
      
      setSuggestions([]);
      return updatedText;
    });
    
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
    
    // Reset the flag after a short delay to allow new suggestions
    setTimeout(() => {
      setIsApplyingSuggestion(false);
    }, 100);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions((prev: Suggestion[]) => prev.filter((s: Suggestion) => s.id !== suggestionId));
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
  };

  // Document handling functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      setFileName(file.name);
    };

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else if (file.name.endsWith('.docx')) {
      // For .docx files, we'll need a library like mammoth.js
      // For now, show an error message
      alert('DOCX files are not yet supported. Please use plain text files (.txt) or copy and paste your content.');
    } else {
      alert('Please upload a text file (.txt) or copy and paste your content.');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
        setFileName('Pasted Content');
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      alert('Unable to access clipboard. Please paste manually using Ctrl+V or Cmd+V.');
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'corrected-text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openGoogleDocs = () => {
    const encodedText = encodeURIComponent(text);
    const googleDocsUrl = `https://docs.google.com/document/create?title=Grammarly-est%20Document&body=${encodedText}`;
    window.open(googleDocsUrl, '_blank');
  };

  const getSuggestionIcon = (type: string, severity: string) => {
    if (severity === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  const handleClearText = () => {
    setText("");
    setSuggestions([]);
    setFileName("");
  };

  const getTextStats = () => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    return {
      words: words.length,
      characters
    };
  };

  // Add mobile-specific handlers
  const handleMobileSuggestionTap = (suggestion: Suggestion) => {
    if (isMobile) {
      applySuggestion(suggestion);
      // Vibrate on success (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const renderHighlightedText = () => {
    if (!toneAnalysis || !text) return <p>{text}</p>;

    let lastIndex = 0;
    const highlightedElements: React.ReactNode[] = [];
    const sortedSentences = [...toneAnalysis.highlightedSentences].sort((a, b) => a.startIndex - b.startIndex);

    sortedSentences.forEach((sentence, i) => {
      if (sentence.startIndex > lastIndex) {
        highlightedElements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, sentence.startIndex)}</span>);
      }
      const colorClass = TONE_COLORS[sentence.tone] || TONE_COLORS.Default;
      highlightedElements.push(
        <span key={`hl-${i}`} className={`${colorClass} p-1 rounded`}>
          {text.substring(sentence.startIndex, sentence.endIndex)}
        </span>
      );
      lastIndex = sentence.endIndex;
    });

    if (lastIndex < text.length) {
      highlightedElements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }

    return <p className="text-lg leading-relaxed whitespace-pre-wrap">{highlightedElements}</p>;
  };

  const renderTextWithSuggestionHighlight = () => {
    if (!hoveredSuggestion) return null;

    const { startIndex, endIndex } = hoveredSuggestion;
    
    // To handle wrapping and newlines correctly, we need to render the text with spans
    const preText = text.substring(0, startIndex);
    const highlightedText = text.substring(startIndex, endIndex);
    const postText = text.substring(endIndex);

    return (
      <div 
        className="absolute inset-0 p-4 border border-transparent rounded-lg resize-none leading-relaxed pointer-events-none whitespace-pre-wrap"
        style={{
          fontSize: isMobile ? '1rem' : '1.125rem', // text-base or text-lg
          fontFamily: 'inherit',
        }}
      >
        <span>{preText}</span>
        <span className="bg-yellow-200/50 dark:bg-yellow-800/50 rounded">
          {highlightedText}
        </span>
        <span>{postText}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".txt,.docx"
          className="hidden"
        />

        {/* Mobile Header */}
        {isMobile && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40 mb-4"
          >
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <h1 className="text-xl font-bold text-primary">Grammarly-est</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePasteFromClipboard}
                  className="h-9 w-9"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyToClipboard}
                  className="h-9 w-9"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearText}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Grammarly-est Writing Assistant</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-sm">
                  {getTextStats().words} words
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {getTextStats().characters} characters
                </Badge>
                {fileName && (
                  <Badge variant="outline" className="text-sm">
                    {fileName}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Document Options */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload a text file</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePasteFromClipboard}
                      className="flex items-center space-x-2"
                    >
                      <Clipboard className="h-4 w-4" />
                      <span>Paste</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Paste from clipboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadText}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download as text file</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openGoogleDocs}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Google Docs</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in Google Docs</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckTone}
                disabled={isCheckingTone}
                className="flex items-center space-x-2"
              >
                {isCheckingTone ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <Smile className="h-4 w-4" />
                )}
                <span>Check Tone</span>
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearText}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </Button>
              {suggestions.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyAllSuggestions}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Fix All ({suggestions.length})</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Tabs */}
        {isMobile && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions
                {suggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {suggestions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tone">Tone</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Left Panel: Tone Analysis */}
          <AnimatePresence>
            {toneAnalysis && (
              <motion.div
                className="lg:col-span-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="h-full">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center space-x-2">
                      <Smile className="h-5 w-5" />
                      <span>Tone Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Overall Tone</h4>
                        <Badge variant="default">{toneAnalysis.overallTone}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Tone Scores</h4>
                        <div className="space-y-2">
                          {Object.entries(toneAnalysis.toneScores).map(([tone, score]) => (
                            <div key={tone}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">{tone}</span>
                                <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
                              </div>
                              <Progress value={score * 100} className={`w-full ${TONE_PROGRESS_COLORS[tone] || TONE_PROGRESS_COLORS.Default}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Text Editor Section */}
          <div className={toneAnalysis ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card className="h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => {
                      const newText = e.target.value;
                      const timeNow = Date.now();
                      if (newText.length > text.length) {
                        if (timeNow - lastTypeTimeRef.current > 2000) {
                          charCountRef.current = 0;
                          lastTypeTimeRef.current = timeNow;
                        }
                        charCountRef.current += newText.length - text.length;
                      }
                      setText(newText);
                      if (suggestions.length > 0) setSuggestions([]);
                      if (toneAnalysis) setToneAnalysis(null);
                      if(lastAnalyzedText) setLastAnalyzedText("");
                    }}
                    onFocus={() => {
                      lastTypeTimeRef.current = Date.now();
                      charCountRef.current = 0;
                    }}
                    onBlur={() => setTypingSpeed(0)}
                    className={`w-full ${
                      isMobile 
                        ? 'h-[60vh] text-base' 
                        : 'h-[500px] text-lg'
                    } p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed bg-white dark:bg-gray-800`}
                    placeholder="Start typing your text here, upload a document, or paste content..."
                  />
                  
                  {renderTextWithSuggestionHighlight()}
                  
                  {isLoading && (
                    <div className="absolute top-4 right-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {/* Mobile Quick Actions */}
                  {isMobile && isKeyboardOpen && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/40 p-4 z-50"
                    >
                      <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {suggestions.length} suggestions
                          </Badge>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={applyAllSuggestions}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Fix All
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Engie aI Assistant */}
            <AnimatePresence>
              <motion.div 
                className="mt-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🤖</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Engie says...</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isEngieThinking ? 'Thinking...' : engieMessage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Typing Speed</p>
                    <p className="text-2xl font-bold text-blue-500">{Math.round(typingSpeed)} <span className="text-sm font-normal">WPM</span></p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Panel: Suggestions */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Suggestions</span>
                  {suggestions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {suggestions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {suggestions.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Analyzing text...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <p>No suggestions found</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ScrollArea className={`${isMobile ? 'h-[40vh]' : 'h-[500px]'}`}>
                    <div className="space-y-4 pr-4">
                      {suggestions.map((suggestion) => (
                        <motion.div
                          key={suggestion.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            isMobile ? 'text-base' : ''
                          }`}
                          onMouseEnter={() => !isMobile && setHoveredSuggestion(suggestion)}
                          onMouseLeave={() => !isMobile && setHoveredSuggestion(null)}
                        >
                          <div className="flex items-start space-x-3">
                            {getSuggestionIcon(suggestion.type, suggestion.severity)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-500 mb-1">{suggestion.explanation}</p>
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span className="font-medium text-red-500 line-through">{suggestion.text}</span>
                                <span className="text-gray-500">→</span>
                                <span className="font-medium text-green-600">{suggestion.replacement}</span>
                              </div>
                              
                              {!isMobile && (
                                <div className="flex items-center space-x-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applySuggestion(suggestion);
                                    }}
                                  >
                                    Apply
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissSuggestion(suggestion.id);
                                    }}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              )}

                              {isMobile && (
                                <div className="mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 w-full justify-start p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMobileSuggestionTap(suggestion);
                                    }}
                                  >
                                    Tap to apply
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Suggestion Modal */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent className={`${isMobile ? 'w-[95vw]' : 'sm:max-w-md'}`}>
          {selectedSuggestion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getSuggestionIcon(selectedSuggestion.type, selectedSuggestion.severity)}
                  <span className="capitalize">{selectedSuggestion.type} Suggestion</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-2">Current text:</div>
                  <div className="font-medium text-red-600 dark:text-red-400">
                    "{selectedSuggestion.text}"
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-sm text-muted-foreground mb-2">Suggested replacement:</div>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    "{selectedSuggestion.replacement}"
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-sm text-muted-foreground mb-2">Explanation:</div>
                  <div className="text-sm">{selectedSuggestion.explanation}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => dismissSuggestion(selectedSuggestion.id)}
                >
                  Dismiss
                </Button>
                <Button
                  variant="default"
                  onClick={() => applySuggestion(selectedSuggestion)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Apply
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Built on AI-first principles by{' '}
            <a 
              href="https://www.engindearing.soy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
            >
              www.EnginDearing.soy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}