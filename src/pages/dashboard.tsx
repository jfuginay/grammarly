import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import FloatingSuggestion from "@/components/FloatingSuggestion";
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
  EyeOff
} from "lucide-react";

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

// Simple spell checker with common misspellings
const spellCheckDict: Record<string, string> = {
  'teh': 'the',
  'recieve': 'receive',
  'seperate': 'separate',
  'definately': 'definitely',
  'occured': 'occurred',
  'accomodate': 'accommodate',
  'neccessary': 'necessary',
  'embarass': 'embarrass',
  'begining': 'beginning',
  'existance': 'existence',
  'maintainance': 'maintenance',
  'independant': 'independent',
  'appearence': 'appearance',
  'beleive': 'believe',
  'acheive': 'achieve',
  'wierd': 'weird',
  'freind': 'friend',
  'thier': 'their',
  'reccomend': 'recommend',
  'tommorrow': 'tomorrow'
};

// Grammar rules
const grammarRules = [
  {
    pattern: /\bi\s+am\s+going\s+to\s+went\b/gi,
    replacement: 'I am going to go',
    explanation: 'Incorrect verb tense combination'
  },
  {
    pattern: /\byour\s+welcome\b/gi,
    replacement: "you're welcome",
    explanation: "Use 'you're' (you are) instead of 'your' (possessive)"
  },
  {
    pattern: /\bits\s+a\s+nice\s+day\b/gi,
    replacement: "it's a nice day",
    explanation: "Use 'it's' (it is) instead of 'its' (possessive)"
  }
];

// Style suggestions
const styleSuggestions = [
  {
    pattern: /\bvery\s+good\b/gi,
    replacement: 'excellent',
    explanation: 'Use more specific adjectives instead of "very + adjective"'
  },
  {
    pattern: /\bin\s+order\s+to\b/gi,
    replacement: 'to',
    explanation: 'Simplify by using "to" instead of "in order to"'
  },
  {
    pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    replacement: 'because',
    explanation: 'Use "because" for clearer, more concise writing'
  }
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [text, setText] = useState("Welcome to your writing assistant! Try typing some text with mistakes like 'teh' or 'recieve' to see suggestions appear.");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(true);
  const [floatingSuggestion, setFloatingSuggestion] = useState<Suggestion | null>(null);
  const [floatingPosition, setFloatingPosition] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const generateSuggestions = useCallback((inputText: string): Suggestion[] => {
    const newSuggestions: Suggestion[] = [];
    const words = inputText.split(/(\s+)/);
    let currentIndex = 0;

    // Spell checking
    words.forEach((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord && spellCheckDict[cleanWord]) {
        const startIndex = currentIndex;
        const endIndex = currentIndex + word.length;
        
        newSuggestions.push({
          id: `spell-${index}-${startIndex}`,
          type: 'spelling',
          text: word,
          replacement: spellCheckDict[cleanWord],
          explanation: `"${cleanWord}" appears to be misspelled`,
          startIndex,
          endIndex,
          severity: 'error'
        });
      }
      currentIndex += word.length;
    });

    // Grammar checking
    grammarRules.forEach((rule, ruleIndex) => {
      let match;
      while ((match = rule.pattern.exec(inputText)) !== null) {
        newSuggestions.push({
          id: `grammar-${ruleIndex}-${match.index}`,
          type: 'grammar',
          text: match[0],
          replacement: rule.replacement,
          explanation: rule.explanation,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          severity: 'warning'
        });
      }
    });

    // Style suggestions
    styleSuggestions.forEach((rule, ruleIndex) => {
      let match;
      while ((match = rule.pattern.exec(inputText)) !== null) {
        newSuggestions.push({
          id: `style-${ruleIndex}-${match.index}`,
          type: 'style',
          text: match[0],
          replacement: rule.replacement,
          explanation: rule.explanation,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          severity: 'suggestion'
        });
      }
    });

    return newSuggestions.sort((a, b) => a.startIndex - b.startIndex);
  }, []);

  useEffect(() => {
    const newSuggestions = generateSuggestions(text);
    setSuggestions(newSuggestions);
  }, [text, generateSuggestions]);

  const applySuggestion = (suggestion: Suggestion) => {
    const newText = text.substring(0, suggestion.startIndex) + 
                   suggestion.replacement + 
                   text.substring(suggestion.endIndex);
    setText(newText);
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
  };

  const handleTextClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    const clickedSuggestion = suggestions.find(s => 
      clickPosition >= s.startIndex && clickPosition <= s.endIndex
    );
    
    if (clickedSuggestion) {
      const rect = textarea.getBoundingClientRect();
      const textBeforeClick = text.substring(0, clickPosition);
      const lines = textBeforeClick.split('\n');
      const currentLine = lines.length - 1;
      const currentColumn = lines[lines.length - 1].length;
      
      // Approximate position calculation
      const lineHeight = 28; // Based on text-lg leading-relaxed
      const charWidth = 11; // Approximate character width for monospace
      
      const x = rect.left + 24 + (currentColumn * charWidth); // 24px padding
      const y = rect.top + 24 + (currentLine * lineHeight); // 24px padding
      
      setFloatingSuggestion(clickedSuggestion);
      setFloatingPosition({ x, y });
    } else {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const overlay = e.currentTarget;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left - 24; // Account for padding
    const y = e.clientY - rect.top - 24; // Account for padding
    
    // Find which suggestion is being hovered
    const lineHeight = 28;
    const charWidth = 11;
    const line = Math.floor(y / lineHeight);
    const column = Math.floor(x / charWidth);
    
    const lines = text.split('\n');
    let charIndex = 0;
    for (let i = 0; i < line && i < lines.length; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }
    charIndex += Math.min(column, lines[line]?.length || 0);
    
    const hoveredSuggestion = suggestions.find(s => 
      charIndex >= s.startIndex && charIndex <= s.endIndex
    );
    
    if (hoveredSuggestion && hoveredSuggestion.id !== floatingSuggestion?.id) {
      setFloatingSuggestion(hoveredSuggestion);
      setFloatingPosition({ x: e.clientX, y: e.clientY });
    } else if (!hoveredSuggestion) {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
    }
  };

  const handleOverlayMouseLeave = () => {
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const renderTextWithHighlights = () => {
    if (suggestions.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    suggestions.forEach((suggestion) => {
      result += text.substring(lastIndex, suggestion.startIndex);
      
      const highlightClass = suggestion.severity === 'error' 
        ? 'bg-red-100 border-b-2 border-red-500 dark:bg-red-900/20 dark:border-red-400 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-800 dark:text-red-200' 
        : suggestion.severity === 'warning'
        ? 'bg-yellow-100 border-b-2 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200'
        : 'bg-blue-100 border-b-2 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/30 text-blue-800 dark:text-blue-200';
      
      result += `<span class="${highlightClass} cursor-pointer transition-colors" data-suggestion-id="${suggestion.id}">${suggestion.text}</span>`;
      lastIndex = suggestion.endIndex;
    });
    
    result += text.substring(lastIndex);
    return result;
  };

  const applyFloatingSuggestion = (suggestion: Suggestion) => {
    applySuggestion(suggestion);
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const dismissFloatingSuggestion = (suggestionId: string) => {
    dismissSuggestion(suggestionId);
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const closeFloatingSuggestion = () => {
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const getSuggestionIcon = (type: string, severity: string) => {
    if (severity === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  };

  const getSuggestionBadgeVariant = (severity: string) => {
    if (severity === 'error') return 'destructive';
    if (severity === 'warning') return 'secondary';
    return 'default';
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 border-r border-border bg-card p-6 flex flex-col"
      >
        <div className="flex items-center space-x-2 mb-8">
          <Sparkles className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-primary">GrammarlyClone</span>
        </div>

        <div className="flex items-center space-x-3 mb-6 p-3 rounded-lg bg-muted/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{user?.email || 'User'}</div>
            <div className="text-sm text-muted-foreground">Free Plan</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Suggestions ({suggestions.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestionPanel(!showSuggestionPanel)}
            >
              {showSuggestionPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          <AnimatePresence>
            {showSuggestionPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {suggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>Great job! No issues found.</p>
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedSuggestion(suggestion);
                        setShowSuggestionModal(true);
                      }}
                    >
                      <div className="flex items-start space-x-2">
                        {getSuggestionIcon(suggestion.type, suggestion.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={getSuggestionBadgeVariant(suggestion.severity)} className="text-xs">
                              {suggestion.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mb-1">
                            "{suggestion.text}" → "{suggestion.replacement}"
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {suggestion.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="my-6" />

        <Button
          onClick={signOut}
          variant="ghost"
          className="justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Writing Assistant</h1>
              <p className="text-muted-foreground">Write with confidence and clarity</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {text.split(/\s+/).filter(word => word.length > 0).length} words
              </Badge>
              <Badge variant="outline" className="text-sm">
                {text.length} characters
              </Badge>
            </div>
          </div>
        </motion.header>

        <div className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <div className="relative h-full">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onClick={handleTextClick}
                    className="w-full h-full p-6 text-lg leading-relaxed resize-none border-none outline-none bg-transparent font-mono"
                    placeholder="Start writing your document here..."
                    style={{ minHeight: '500px' }}
                  />
                  
                  {/* Overlay for highlighting */}
                  <div 
                    ref={overlayRef}
                    className="absolute inset-0 p-6 text-lg leading-relaxed pointer-events-auto whitespace-pre-wrap font-mono text-transparent"
                    dangerouslySetInnerHTML={{ __html: renderTextWithHighlights() }}
                    onMouseMove={handleOverlayMouseMove}
                    onMouseLeave={handleOverlayMouseLeave}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Floating Suggestion */}
      <FloatingSuggestion
        suggestion={floatingSuggestion}
        position={floatingPosition}
        onApply={applyFloatingSuggestion}
        onDismiss={dismissFloatingSuggestion}
        onClose={closeFloatingSuggestion}
      />

      {/* Suggestion Modal */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent className="sm:max-w-md">
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
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => applySuggestion(selectedSuggestion)}
                    className="flex-1"
                  >
                    Apply Suggestion
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => dismissSuggestion(selectedSuggestion.id)}
                    className="flex-1"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}