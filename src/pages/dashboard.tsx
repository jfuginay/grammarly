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
  ExternalLink
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

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
    
    if (text.trim()) {
      const timeoutId = setTimeout(getSuggestions, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [text, generateSuggestions]);

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="write">Write</TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions
                {suggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {suggestions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Text Editor Section */}
          <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-2'}`}>
            <Card className="h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setIsKeyboardOpen(true)}
                    onBlur={() => setIsKeyboardOpen(false)}
                    className={`w-full ${
                      isMobile 
                        ? 'h-[60vh] text-base' 
                        : 'h-[500px] text-lg'
                    } p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed bg-white dark:bg-gray-800`}
                    placeholder="Start typing your text here, upload a document, or paste content..."
                  />
                  
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
          </div>

          {/* Suggestions Panel */}
          {(!isMobile || activeTab === 'suggestions') && (
            <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-1'}`}>
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
                            className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                              isMobile ? 'text-base' : ''
                            }`}
                            onClick={() => {
                              if (isMobile) {
                                handleMobileSuggestionTap(suggestion);
                              } else {
                                setSelectedSuggestion(suggestion);
                                setShowSuggestionModal(true);
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              {getSuggestionIcon(suggestion.type, suggestion.severity)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{suggestion.text}</span>
                                  <span className="text-gray-500">→</span>
                                  <span className="text-blue-600 dark:text-blue-400">{suggestion.replacement}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{suggestion.explanation}</p>
                                {isMobile && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-green-600 hover:text-green-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMobileSuggestionTap(suggestion);
                                    }}
                                  >
                                    Apply
                                  </Button>
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
          )}
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