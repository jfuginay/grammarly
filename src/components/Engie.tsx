import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Chat message interface
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Define a basic structure for ToneAnalysis. This should ideally match the API response.
interface ToneAnalysisHighlight {
  sentence: string;
  tone: string;
  score: number;
}

interface ToneAnalysis {
  overallTone: string;
  overallScore: number;
  highlightedSentences: ToneAnalysisHighlight[];
}

interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
}

interface EngieProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
  targetEditorSelector?: string; // Selector for the main text editing area
}

const severityColorMap: { [key in Suggestion['severity']]: string } = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-blue-500',
};

const Engie: React.FC<EngieProps> = ({
  suggestions: externalSuggestions,
  onApply: onApplyExternal,
  onDismiss: onDismissExternal,
  onIdeate: onIdeateExternalProp,
  targetEditorSelector
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevScannedTextRef = useRef<string>("");
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [internalSuggestions, setInternalSuggestions] = useState<Suggestion[]>([]);
  const [toneAnalysisResult, setToneAnalysisResult] = useState<ToneAnalysis | null>(null); // For target editor
  const [overallPageToneAnalysis, setOverallPageToneAnalysis] = useState<ToneAnalysis | null>(null); // For full page
  const [ideationMessage, setIdeationMessage] = useState<ChatMessage | null>(null); // For proactive ideation
  const [encouragementMessageApi, setEncouragementMessageApi] = useState<ChatMessage | null>(null); // For page tone encouragement
  const [lastEncouragementTone, setLastEncouragementTone] = useState<string | null>(null);
  const [isIdeating, setIsIdeating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // For future chat interactions
  const [activeTab, setActiveTab] = useState('suggestions');

  // Determine which suggestions to use: internal if available, otherwise external
  const activeSuggestions = internalSuggestions.length > 0 ? internalSuggestions : externalSuggestions;

  const resetTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Only set new timer if chat is closed OR if chat is open but no suggestions/ideation/tone results are active
    const shouldSetTimer = !isChatOpen ||
                           (isChatOpen && activeSuggestions.length === 0 && !ideationMessage && !toneAnalysisResult && !isIdeating && !isScanning);

    if (shouldSetTimer) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log("Inactivity detected, triggering ideation.");
        triggerIdeation();
      }, 30000); // 30 seconds
    }
  }, [isChatOpen, activeSuggestions.length, ideationMessage, toneAnalysisResult, isIdeating, isScanning]);

  // Extracts text from a specific target element
  const extractTextFromTarget = (selector: string): string | null => {
    const selectedEditor = document.querySelector(selector);
    if (!selectedEditor) {
      console.warn(`Engie: Target editor selector "${selector}" not found.`);
      return null;
    }

    if (selectedEditor instanceof HTMLTextAreaElement || selectedEditor instanceof HTMLInputElement) {
      return selectedEditor.value;
    }

    let text = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue) {
          text += node.nodeValue.trim() + " ";
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.id === "engie-container" ||
            element.closest("#engie-container") ||
            element.tagName === "SCRIPT" ||
            element.tagName === "STYLE") {
          return;
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(selectedEditor);
    return text.trim();
  };

  // Extracts text from the full document body, excluding Engie's own UI
  const extractFullPageText = (): string => {
    let text = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue) {
          text += node.nodeValue.trim() + " ";
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.id === "engie-container" ||
            element.closest("#engie-container") ||
            element.tagName === "SCRIPT" ||
            element.tagName === "STYLE") {
          return;
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
        }
      }
    };
    walk(document.body);
    return text.trim();
  };

  // Memoize extract functions
  const stableExtractFullPageText = useCallback(extractFullPageText, []);
  const stableExtractTextFromTarget = useCallback(extractTextFromTarget, []);

  const fetchEncouragementMessage = async (tone: string, score?: number): Promise<string | null> => {
    try {
      const response = await fetch('/api/engie-encouragement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overallPageTone: tone, overallScore: score }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching encouragement message:', response.statusText, errorData);
        return null;
      }
      const data = await response.json();
      return data.encouragementMessage || null;
    } catch (error) {
      console.error('Failed to fetch encouragement message:', error);
      return null;
    }
  };

  useEffect(() => {
    // When the list of activeSuggestions changes, reset to the first one.
    setCurrentSuggestionIndex(0);
    // If suggestions appear, clear any proactive ideation or encouragement messages
    if (activeSuggestions.length > 0) {
      setIdeationMessage(null);
      setEncouragementMessageApi(null);
    }
  }, [activeSuggestions]);

  // Ensure currentSuggestionIndex stays in bounds when suggestions change
  useEffect(() => {
    if (activeSuggestions.length > 0 && currentSuggestionIndex >= activeSuggestions.length) {
      setCurrentSuggestionIndex(Math.max(0, activeSuggestions.length - 1));
    }
  }, [activeSuggestions.length, currentSuggestionIndex]);

  const fetchTypoSuggestions = async (text: string): Promise<Suggestion[]> => {
    if (!text.trim()) return [];
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        console.error('Error fetching typo suggestions:', response.statusText);
        return [];
      }
      const data = await response.json();
      return data.suggestions.map((s: any) => ({ ...s, id: s.id || Math.random().toString(36).substring(2, 15) })) as Suggestion[];
    } catch (error) {
      console.error('Failed to fetch typo suggestions:', error);
      return [];
    }
  };

  const fetchToneAnalysis = async (text: string): Promise<ToneAnalysis | null> => {
    if (!text.trim()) return null;
    try {
      const response = await fetch('/api/check-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        console.error('Error fetching tone analysis:', response.statusText);
        return null;
      }
      const data = await response.json();
      return data as ToneAnalysis;
    } catch (error) {
      console.error('Failed to fetch tone analysis:', error);
      return null;
    }
  };

  const callEngieChatAPI = async (prompt: string, currentHistory: ChatMessage[]): Promise<string | null> => {
    try {
      const response = await fetch('/api/engie-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: currentHistory }),
      });
      if (!response.ok) {
        console.error('Error fetching Engie chat response:', response.statusText);
        return "Sorry, I couldn't come up with anything right now.";
      }
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Failed to fetch Engie chat response:', error);
      return "My circuits are a bit tangled at the moment. Try again later?";
    }
  };

  const triggerIdeation = async (isManualTrigger = false) => {
    if (isIdeating || (activeSuggestions.length > 0 && !isManualTrigger) || (toneAnalysisResult && !isManualTrigger) ) {
      return;
    }

    if (!isChatOpen) {
      setIsChatOpen(true);
    }
    setIdeationMessage(null);
    setInternalSuggestions([]);
    setToneAnalysisResult(null);

    setIsIdeating(true);
    setStatusMessage("Engie is brainstorming ideas...");

    let prompt = "I've noticed you haven't typed in a while. What are you working on, or what's on your mind?";
    if (isManualTrigger) {
      prompt = "Okay, let's brainstorm! What topic or idea should we explore?";
    } else if (prevScannedTextRef.current) {
      const lastText = prevScannedTextRef.current.slice(-200);
      prompt = `I noticed you were working on something related to: "${lastText}". Feeling stuck or want to explore ideas around that? Or is something else on your mind?`;
    }

    const assistantResponse = await callEngieChatAPI(prompt, []);

    if (assistantResponse) {
      setIdeationMessage({ role: 'assistant', content: assistantResponse });
      setChatHistory([{role: 'user', content: prompt}, {role: 'assistant', content: assistantResponse}]);
    } else {
      setIdeationMessage({ role: 'assistant', content: "I'm having a little trouble brainstorming right now. Please try again in a moment!" });
    }

    setIsIdeating(false);
    setStatusMessage("");
  };

  const processScannedTexts = useCallback(async (fullText: string, targetText: string | null) => {
    if (isIdeating) return;

    const textForComparison = targetText ?? fullText;
    const currentCombinedTextState = `target:${targetText}_full:${fullText}`;

    if (!textForComparison && !prevScannedTextRef.current) {
       setIsScanning(false);
       setStatusMessage("Nothing to scan.");
       setTimeout(() => setStatusMessage(""), 3000);
       return;
    }

    if (currentCombinedTextState === prevScannedTextRef.current) {
      setIsScanning(false);
      setStatusMessage("No significant changes detected.");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }

    prevScannedTextRef.current = currentCombinedTextState;
    setIsScanning(true);
    setStatusMessage("Engie is analyzing text...");
    setInternalSuggestions([]);
    setToneAnalysisResult(null);
    setOverallPageToneAnalysis(null);
    setIdeationMessage(null);

    let typoPromise: Promise<Suggestion[]> = Promise.resolve([]);
    let targetTonePromise: Promise<ToneAnalysis | null> = Promise.resolve(null);
    let pageTonePromise: Promise<ToneAnalysis | null> = Promise.resolve(null);

    if (targetText && targetText.trim()) {
      typoPromise = fetchTypoSuggestions(targetText);
      targetTonePromise = fetchToneAnalysis(targetText);
    } else {
      setInternalSuggestions([]);
      setToneAnalysisResult(null);
    }

    if (fullText && fullText.trim()) {
      pageTonePromise = fetchToneAnalysis(fullText);
    } else {
      setOverallPageToneAnalysis(null);
    }

    if ((!targetText || !targetText.trim()) && (!fullText || !fullText.trim())) {
      setStatusMessage("Content is empty, skipping analysis.");
      setIsScanning(false);
      setEncouragementMessageApi(null);
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }

    try {
      const [typoResults, localToneAnalysis, globalPageToneAnalysis] = await Promise.all([
        typoPromise,
        targetTonePromise,
        pageTonePromise
      ]);

      const hasTypos = typoResults && typoResults.length > 0;
      const nonPositiveOrNeutralTones = ['Negative', 'Critical', 'Anxious', 'Frustrated', 'Stressed', 'Worried', 'Sad'];
      const hasSignificantLocalToneIssue = localToneAnalysis &&
                                         (nonPositiveOrNeutralTones.includes(localToneAnalysis.overallTone) ||
                                         (localToneAnalysis.overallScore > 0.6 && nonPositiveOrNeutralTones.includes(localToneAnalysis.overallTone)));

      if (hasTypos) {
        setInternalSuggestions(typoResults);
      }
      setToneAnalysisResult(localToneAnalysis);
      setOverallPageToneAnalysis(globalPageToneAnalysis);

      if (hasTypos || hasSignificantLocalToneIssue) {
        setEncouragementMessageApi(null);
        setLastEncouragementTone(null);
      } else if (globalPageToneAnalysis && globalPageToneAnalysis.overallTone) {
        if (globalPageToneAnalysis.overallTone !== lastEncouragementTone) {
          const message = await fetchEncouragementMessage(globalPageToneAnalysis.overallTone, globalPageToneAnalysis.overallScore);
          if (message) {
            setEncouragementMessageApi({ role: 'assistant', content: message });
            setLastEncouragementTone(globalPageToneAnalysis.overallTone);
          } else {
            setEncouragementMessageApi(null);
          }
        }
      } else {
        setEncouragementMessageApi(null);
      }

      setStatusMessage("Analysis complete.");
    } catch (error) {
      console.error("Error during text processing:", error);
      setStatusMessage("Error during analysis.");
      setInternalSuggestions([]);
      setToneAnalysisResult(null);
      setOverallPageToneAnalysis(null);
      setEncouragementMessageApi(null);
    } finally {
      setIsScanning(false);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  }, [isIdeating, fetchEncouragementMessage, lastEncouragementTone]);

  const handleDocumentChange = useCallback(() => {
    if (isIdeating || (isChatOpen && ideationMessage)) return;

    setStatusMessage("Engie is scanning document...");

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const fullPageText = stableExtractFullPageText();
      let targetEditorText: string | null = null;
      if (targetEditorSelector) {
        targetEditorText = stableExtractTextFromTarget(targetEditorSelector);
      }
      processScannedTexts(fullPageText, targetEditorText);
    }, 1500);
  }, [isIdeating, ideationMessage, isChatOpen, targetEditorSelector, stableExtractFullPageText, stableExtractTextFromTarget, processScannedTexts]);

  // Effect for document change detection
  useEffect(() => {
    const observer = new MutationObserver(handleDocumentChange);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    // Initial scan on mount
    if (!isIdeating && !ideationMessage) {
       handleDocumentChange();
    }

    return () => {
      observer.disconnect();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [handleDocumentChange, isIdeating, ideationMessage]);

  // Inactivity Timer Logic
  useEffect(() => {
    document.addEventListener('keydown', resetTimer);
    resetTimer(); // Initial setup

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      document.removeEventListener('keydown', resetTimer);
    };
  }, [resetTimer]);

  const currentSuggestion = activeSuggestions.length > 0 ? activeSuggestions[currentSuggestionIndex] : null;

  const handleApply = () => {
    if (currentSuggestion) {
      if (internalSuggestions.length > 0) {
        console.log("Applying internal suggestion:", currentSuggestion);
        // Clear all internal suggestions since the document will change
        setInternalSuggestions([]);
        if (ideationMessage) {
          setIdeationMessage(null);
        }
      } else {
        // Pass the suggestion to external handler and let it handle clearing
        onApplyExternal(currentSuggestion);
      }
      
      // Reset to index 0 since we're clearing all suggestions
      setCurrentSuggestionIndex(0);
    }
  };

  const handleDismiss = () => {
    if (currentSuggestion) {
      if (internalSuggestions.length > 0) {
        // Only remove the current suggestion when dismissing
        setInternalSuggestions(prev => {
          const filtered = prev.filter(s => s.id !== currentSuggestion.id);
          return filtered;
        });
        
        if (internalSuggestions.length - 1 <= 0) {
          setIdeationMessage(null);
        }
      } else {
        onDismissExternal(currentSuggestion.id);
      }
      
      // Adjust the current suggestion index to handle the removal
      setCurrentSuggestionIndex(prev => {
        const remainingSuggestions = internalSuggestions.length > 0 
          ? internalSuggestions.filter(s => s.id !== currentSuggestion.id).length
          : activeSuggestions.length - 1;
        
        if (remainingSuggestions === 0) {
          return 0;
        } else if (prev >= remainingSuggestions) {
          return Math.max(0, remainingSuggestions - 1);
        } else {
          return prev;
        }
      });
    }
  };

  const handleDismissIdeation = () => {
    setIdeationMessage(null);
    setChatHistory([]);
  };

  const handleNext = () => {
    if (currentSuggestion && currentSuggestionIndex < activeSuggestions.length - 1) {
        setCurrentSuggestionIndex(prev => prev + 1);
    } else {
        // If we're at the last suggestion, dismiss it instead of cycling
        handleDismiss();
    }
  };

  const handleManualIdeate = () => {
    if (onIdeateExternalProp) {
        onIdeateExternalProp();
    }
    triggerIdeation(true);
  };

  // Helper function to safely format scores
  const formatScore = (score: number | undefined | null): string => {
    if (typeof score === 'number' && !isNaN(score)) {
      return score.toFixed(2);
    }
    return 'N/A';
  };

  const nodeRef = React.useRef(null);

  return (
    <Draggable handle=".handle" nodeRef={nodeRef} allowMobileScroll={true}>
      <div ref={nodeRef} id="engie-container" className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4 w-[calc(100vw-2.5rem)] sm:w-80 max-w-xs rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <header className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className='flex items-center gap-2'>
                    <Sparkles className="h-6 w-6 text-purple-500"/>
                    <h3 className="font-semibold">Engie</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsChatOpen(false)}><X className="h-4 w-4"/></Button>
              </header>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {(isScanning || (isIdeating && statusMessage) || (!isIdeating && statusMessage && !ideationMessage)) && (
                  <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 italic text-center">
                    {statusMessage}
                  </div>
                )}

                {/* Ideation Message Display */}
                {ideationMessage && !activeSuggestions.length && !encouragementMessageApi && (
                  <Card className="mb-4 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Engie's Idea Corner</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ideationMessage.content}</p>
                    </CardContent>
                    <CardFooter className="p-3 pt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={handleDismissIdeation}>Dismiss</Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Encouragement Message Display */}
                {encouragementMessageApi && !activeSuggestions.length && !toneAnalysisResult && !ideationMessage && (
                  <Card className="mb-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">A little boost from Engie!</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {encouragementMessageApi.content}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {!ideationMessage && !encouragementMessageApi && (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                      <TabsTrigger value="tone">Tone</TabsTrigger>
                    </TabsList>
                    <TabsContent value="suggestions">
                      {/* Suggestions Display */}
                      {currentSuggestion ? (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                            Found {activeSuggestions.length - currentSuggestionIndex} suggestion(s):
                          </p>
                          <Card key={currentSuggestion.id}>
                            <CardHeader className="flex flex-row items-center gap-2 p-3">
                              <span className={`h-2.5 w-2.5 rounded-full ${severityColorMap[currentSuggestion.severity]}`}></span>
                              <CardTitle className="text-sm font-semibold">{currentSuggestion.type}</CardTitle>
                              <Badge variant="outline" className="font-normal text-xs">{currentSuggestion.severity}</Badge>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-through">"{currentSuggestion.original}"</p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">"{currentSuggestion.suggestion}"</p>
                              <p className="text-xs text-muted-foreground mt-3">{currentSuggestion.explanation}</p>
                            </CardContent>
                          </Card>
                          <div className="flex justify-end gap-2 mt-4">
                              <Button variant="ghost" size="sm" onClick={handleNext}>
                                  {currentSuggestionIndex < activeSuggestions.length - 1 ? 'Next' : 'Ignore'}
                              </Button>
                              <Button variant="default" size="sm" onClick={handleApply}>Apply</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">Looking good! No suggestions found.</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="tone">
                      {/* Tone Analysis Display */}
                      {toneAnalysisResult || overallPageToneAnalysis ? (
                        <div className="mt-4 space-y-4">
                          {toneAnalysisResult && (
                             <Card>
                                <CardHeader className="p-3">
                                  <CardTitle className="text-base">
                                    {targetEditorSelector ? "Editable Content Analysis" : "Text Analysis"}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    Overall Tone: <Badge variant={toneAnalysisResult.overallTone === 'Negative' ? 'destructive' : toneAnalysisResult.overallTone === 'Positive' ? 'default' : 'secondary'} className="capitalize">
                                      {toneAnalysisResult.overallTone} (Score: {formatScore(toneAnalysisResult.overallScore)})
                                    </Badge>
                                  </CardDescription>
                                </CardHeader>
                                {toneAnalysisResult.highlightedSentences && toneAnalysisResult.highlightedSentences.length > 0 && (
                                    <CardContent className="p-3 pt-0">
                                        <p className="text-xs text-muted-foreground mb-1">Key Sentences:</p>
                                        <ul className="space-y-1">
                                        {toneAnalysisResult.highlightedSentences.slice(0,3).map((item, index) => (
                                            <li key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                                "{item.sentence}" - <span className="font-medium capitalize">{item.tone}</span> (Score: {formatScore(item.score)})
                                            </li>
                                        ))}
                                        </ul>
                                    </CardContent>
                                )}
                                <CardFooter className="p-3 pt-2">
                                     <p className="text-xs text-muted-foreground">Analysis of the editable content area.</p>
                                </CardFooter>
                              </Card>
                          )}
                          {overallPageToneAnalysis && (
                              <Card className="border-dashed border-sky-300 dark:border-sky-700">
                                <CardHeader className="p-3 pb-2">
                                  <CardTitle className="text-sm font-medium text-sky-600 dark:text-sky-400">Overall Page Tone</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  <div className="text-xs">
                                    General tone of the page: <Badge variant={overallPageToneAnalysis.overallTone === 'Negative' ? 'destructive' : overallPageToneAnalysis.overallTone === 'Positive' ? 'default' : 'secondary'} className="capitalize text-xs px-1.5 py-0.5">
                                      {overallPageToneAnalysis.overallTone}
                                      {typeof overallPageToneAnalysis.overallScore === 'number' && ` (${formatScore(overallPageToneAnalysis.overallScore)})`}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                          )}
                          {!toneAnalysisResult && !overallPageToneAnalysis && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-600 dark:text-gray-300">No tone analysis available.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">No tone analysis available.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                {/* Fallback "Looking good" or "Brainstorm" button */}
                {!currentSuggestion && !toneAnalysisResult && !overallPageToneAnalysis && !ideationMessage && !encouragementMessageApi && !isIdeating && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Looking good! No immediate suggestions or analysis.</p>
                    <Button variant="link" size="sm" className="mt-2" onClick={handleManualIdeate}>Want to brainstorm ideas?</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="handle relative p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-grab"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, cursor: 'grabbing' }}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          { (isScanning || isIdeating) && !isChatOpen ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Sparkles className="h-8 w-8" />
          )}
          {activeSuggestions.length > 0 && !isChatOpen && !(isScanning || isIdeating) && (
            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                <Badge variant="destructive" className="absolute -top-1 -right-1">{activeSuggestions.length}</Badge>
            </motion.div>
          )}
        </motion.button>
      </div>
    </Draggable>
  );
};

export default Engie;