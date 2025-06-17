import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2 } from 'lucide-react'; // Added Loader2
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';

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
  const [ideationMessage, setIdeationMessage] = useState<ChatMessage | null>(null);
  const [isIdeating, setIsIdeating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]); // For future chat interactions

  // Determine which suggestions to use: internal if available, otherwise external
  const activeSuggestions = internalSuggestions.length > 0 ? internalSuggestions : externalSuggestions;

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

  // Memoize extract functions if their definitions don't change often,
  // though their behavior depends on external DOM. For useEffect deps, keep them stable.
  const stableExtractFullPageText = useCallback(extractFullPageText, []);
  const stableExtractTextFromTarget = useCallback(extractTextFromTarget, []);


  useEffect(() => {
    // When the list of activeSuggestions changes, reset to the first one.
    setCurrentSuggestionIndex(0);
    // If suggestions appear, clear any proactive ideation message
    if (activeSuggestions.length > 0) {
      setIdeationMessage(null);
    }
  }, [activeSuggestions]);

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
      // Assuming the API returns an array of objects that match or can be mapped to Suggestion interface
      // For example, if API returns { id, original, corrected, explanation, type, severity }
      // We might need to map `corrected` to `suggestion`
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
      return data.response; // Assuming API returns { response: "..." }
    } catch (error) {
      console.error('Failed to fetch Engie chat response:', error);
      return "My circuits are a bit tangled at the moment. Try again later?";
    }
  };

  const triggerIdeation = async (isManualTrigger = false) => {
    if (isIdeating || (activeSuggestions.length > 0 && !isManualTrigger) || (toneAnalysisResult && !isManualTrigger) ) {
      // Don't trigger if already ideating, or if suggestions/tone analysis are showing (unless manually triggered)
      return;
    }

    if (!isChatOpen) {
      setIsChatOpen(true);
    }
    setIdeationMessage(null); // Clear previous ideation message
    setInternalSuggestions([]); // Clear suggestions
    setToneAnalysisResult(null); // Clear tone analysis

    setIsIdeating(true);
    setStatusMessage("Engie is brainstorming ideas...");

    let prompt = "I've noticed you haven't typed in a while. What are you working on, or what's on your mind?";
    if (isManualTrigger) {
      prompt = "Okay, let's brainstorm! What topic or idea should we explore?";
    } else if (prevScannedTextRef.current) {
      // Simple heuristic: use last scanned text if it's short and recent.
      const lastText = prevScannedTextRef.current.slice(-200); // last 200 chars
      prompt = `I noticed you were working on something related to: "${lastText}". Feeling stuck or want to explore ideas around that? Or is something else on your mind?`;
    }

    const assistantResponse = await callEngieChatAPI(prompt, []); // Start with empty history for proactive

    if (assistantResponse) {
      setIdeationMessage({ role: 'assistant', content: assistantResponse });
      setChatHistory([{role: 'user', content: prompt}, {role: 'assistant', content: assistantResponse}]);
    } else {
      setIdeationMessage({ role: 'assistant', content: "I'm having a little trouble brainstorming right now. Please try again in a moment!" });
    }

    setIsIdeating(false);
    setStatusMessage(""); // Clear "thinking" message, actual message is in ideationMessage
  };

  // Inactivity Timer Logic
  useEffect(() => {
    const resetTimer = () => {
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
    };

    document.addEventListener('keydown', resetTimer);
    resetTimer(); // Initial setup

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      document.removeEventListener('keydown', resetTimer);
    };
  }, [isChatOpen, activeSuggestions.length, ideationMessage, toneAnalysisResult, isIdeating, isScanning]);


  // Effect for MutationObserver and initial text scan (existing logic)
  useEffect(() => {
    const processScannedTexts = async (fullText: string, targetText: string | null) => {
      if (isIdeating) return;

      // For change detection, we need to decide what to compare.
      // Let's combine them for simplicity in prevScannedTextRef, or use the target text if available, otherwise full text.
      const textForComparison = targetText ?? fullText;
      const currentCombinedTextState = `target:${targetText}_full:${fullText}`;


      if (!textForComparison && !prevScannedTextRef.current ) { // Both current and previous are empty/null
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
      setInternalSuggestions([]); // Reset suggestions
      setToneAnalysisResult(null);    // Reset target tone
      setOverallPageToneAnalysis(null); // Reset page tone
      setIdeationMessage(null);

      // Log extracted texts for verification
      console.log("Engie: Full Page Text:", fullText.substring(0, 200) + "..."); // Log snippet
      if (targetEditorSelector && targetText !== null) {
        console.log(`Engie: Target Editor Text (${targetEditorSelector}):`, targetText.substring(0,200) + "..."); // Log snippet
      } else if (targetEditorSelector) {
        console.log(`Engie: Target Editor Text (${targetEditorSelector}): Not found or empty.`);
      }

      const apiCalls = [];
      let typoPromise: Promise<Suggestion[]> = Promise.resolve([]);
      let targetTonePromise: Promise<ToneAnalysis | null> = Promise.resolve(null);
      let pageTonePromise: Promise<ToneAnalysis | null> = Promise.resolve(null);

      // 1. Typo suggestions - only for target editor text
      if (targetText && targetText.trim()) {
        typoPromise = fetchTypoSuggestions(targetText);
      } else {
        setInternalSuggestions([]); // Ensure suggestions are cleared if no target text
      }

      // 2. Tone analysis for target editor text
      if (targetText && targetText.trim()) {
        targetTonePromise = fetchToneAnalysis(targetText);
      } else {
        setToneAnalysisResult(null); // Clear target tone if no target text
      }

      // 3. Tone analysis for full page text
      if (fullText && fullText.trim()) {
        pageTonePromise = fetchToneAnalysis(fullText);
      } else {
        setOverallPageToneAnalysis(null); // Clear page tone if no full text
      }

      // Check if any actual analysis needs to be done
      if ((!targetText || !targetText.trim()) && (!fullText || !fullText.trim())) {
        setStatusMessage("Content is empty, skipping analysis.");
        setIsScanning(false);
        setTimeout(() => setStatusMessage(""), 3000);
        return;
      }

      setStatusMessage("Engie is analyzing text..."); // General message

      try {
        const [typoResults, targetToneResults, pageToneResults] = await Promise.all([
          typoPromise,
          targetTonePromise,
          pageTonePromise
        ]);

        if (typoResults && typoResults.length > 0) {
          setInternalSuggestions(typoResults);
        }
        // No need to explicitly clear suggestions if typoResults is empty, already handled by initial reset or no-target-text condition

        setToneAnalysisResult(targetToneResults); // Will be null if no targetText or API failed
        setOverallPageToneAnalysis(pageToneResults); // Will be null if no fullText or API failed

        setStatusMessage("Analysis complete.");
      } catch (error) {
        console.error("Error during text processing:", error);
        setStatusMessage("Error during analysis.");
        // Reset states on error to avoid displaying stale data
        setInternalSuggestions([]);
        setToneAnalysisResult(null);
        setOverallPageToneAnalysis(null);
      } finally {
        setIsScanning(false);
        setTimeout(() => setStatusMessage(""), 3000);
      }
    };

    const handleDocumentChange = () => {
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
    };

    // The MutationObserver should observe document.body to capture all relevant changes.
    // The specific targeting of editor content is handled by extractTextFromTarget.
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
  }, [
    isIdeating,
    ideationMessage,
    isChatOpen,
    targetEditorSelector,
    stableExtractFullPageText,
    stableExtractTextFromTarget
  ]);

  const currentSuggestion = activeSuggestions.length > 0 ? activeSuggestions[currentSuggestionIndex] : null;

  const handleApply = () => {
    if (currentSuggestion) {
      if (internalSuggestions.length > 0) {
        console.log("Applying internal suggestion:", currentSuggestion);
        // TODO: Implement actual application of suggestion to the document.
        // For now, just remove it from the list.
        setInternalSuggestions(prev => prev.filter(s => s.id !== currentSuggestion.id));
        if (activeSuggestions.length -1 <= 0) setIdeationMessage(null); // Clear ideation if all suggestions handled
      } else {
        onApplyExternal(currentSuggestion);
      }
      setCurrentSuggestionIndex(0);
    }
  };

  const handleDismiss = () => {
    if (currentSuggestion) {
      if (internalSuggestions.length > 0) {
        setInternalSuggestions(prev => prev.filter(s => s.id !== currentSuggestion.id));
         if (activeSuggestions.length -1 <= 0) setIdeationMessage(null); // Clear ideation if all suggestions handled
      } else {
        onDismissExternal(currentSuggestion.id);
      }
       setCurrentSuggestionIndex(0);
    }
  };

  const handleDismissIdeation = () => {
    setIdeationMessage(null);
    setChatHistory([]); // Clear history as well
    // Potentially trigger a new scan or reset inactivity timer explicitly if needed
  };

  const handleNext = () => {
    if (currentSuggestion && currentSuggestionIndex < activeSuggestions.length - 1) {
        setCurrentSuggestionIndex(prev => prev + 1);
    } else {
        handleDismiss(); // If it's the last one, dismiss it.
    }
  };

  // Manual ideation trigger from the original button
  const handleManualIdeate = () => {
    if (onIdeateExternalProp) { // If an external handler is provided, it might have specific behavior
        onIdeateExternalProp(); // This prop might need to be re-evaluated.
                                // For now, we assume it might do something external AND we also trigger our internal ideation.
    }
    triggerIdeation(true); // Trigger internal ideation manually
  };


  const nodeRef = React.useRef(null);

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} id="engie-container" className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4 w-80 rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <header className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className='flex items-center gap-2'>
                    <Sparkles className="h-6 w-6 text-purple-500"/>
                    <h3 className="font-semibold">Engie</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsChatOpen(false)}><X className="h-4 w-4"/></Button>
              </header>

              <div className="p-4 max-h-[60vh] overflow-y-auto"> {/* Increased max-h slightly */}
                {(isScanning || (isIdeating && statusMessage) || (!isIdeating && statusMessage && !ideationMessage)) && (
                  <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 italic text-center">
                    {statusMessage}
                  </div>
                )}

                {/* Ideation Message Display */}
                {ideationMessage && !activeSuggestions.length && (
                  <Card className="mb-4 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Engie's Idea Corner</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ideationMessage.content}</p>
                    </CardContent>
                    <CardFooter className="p-3 pt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={handleDismissIdeation}>Dismiss</Button>
                      {/* Input for chat would go here in future iteration */}
                    </CardFooter>
                  </Card>
                )}

                {/* Suggestions Display */}
                {currentSuggestion && !ideationMessage && (
                  <div className="mb-4">
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
                )}

                {/* Overall Page Tone Display */}
                {overallPageToneAnalysis && !ideationMessage && (
                  <Card className="mt-4 border-dashed border-sky-300 dark:border-sky-700">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm font-medium text-sky-600 dark:text-sky-400">Overall Page Tone</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs">
                        General tone of the page: <Badge variant={overallPageToneAnalysis.overallTone === 'Negative' ? 'destructive' : overallPageToneAnalysis.overallTone === 'Positive' ? 'default' : 'secondary'} className="capitalize text-xs px-1.5 py-0.5">
                          {overallPageToneAnalysis.overallTone}
                          {typeof overallPageToneAnalysis.overallScore === 'number' && ` (${overallPageToneAnalysis.overallScore.toFixed(2)})`}
                        </Badge>
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Targeted Text Tone Display */}
                {toneAnalysisResult && !ideationMessage && (
                  <Card className="mt-4">
                    <CardHeader className="p-3">
                      <CardTitle className="text-base">
                        {targetEditorSelector ? "Editable Content Analysis" : "Text Analysis"}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Overall Tone: <Badge variant={toneAnalysisResult.overallTone === 'Negative' ? 'destructive' : toneAnalysisResult.overallTone === 'Positive' ? 'default' : 'secondary'} className="capitalize">
                          {toneAnalysisResult.overallTone} (Score: {typeof toneAnalysisResult.overallScore === 'number' ? toneAnalysisResult.overallScore.toFixed(2) : 'N/A'})
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    {toneAnalysisResult.highlightedSentences && toneAnalysisResult.highlightedSentences.length > 0 && (
                        <CardContent className="p-3 pt-0">
                            <p className="text-xs text-muted-foreground mb-1">Key Sentences from Editable Content:</p>
                            <ul className="space-y-1">
                            {toneAnalysisResult.highlightedSentences.slice(0,3).map((item, index) => (
                                <li key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                    "{item.sentence}" - <span className="font-medium capitalize">{item.tone}</span> (Score: {typeof item.score === 'number' ? item.score.toFixed(2) : 'N/A'})
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

                {/* Fallback "Looking good" or "Brainstorm" button */}
                {!currentSuggestion && !toneAnalysisResult && !overallPageToneAnalysis && !ideationMessage && !isIdeating && (
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