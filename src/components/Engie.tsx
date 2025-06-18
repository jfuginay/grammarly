import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, MessageCircle, BrainCircuit, PanelTop, Settings, Lightbulb, Check, Undo, BarChart, User, Users, Gift, Calendar, Zap, Flag, BookOpen, Target, Heart, Eye, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

// Enhanced Interfaces for Intelligent Engie
interface UserPreferences {
  role: 'Executive Director' | 'Program Manager' | 'Volunteer Coordinator' | 'Fundraising Manager' | 'Board Member' | 'General Staff' | string;
  communicationStyle: 'Direct' | 'Detailed' | 'Visual' | 'Collaborative';
  favoriteFeatures: string[];
  interactionHistory: UserInteraction[];
  personalizedTips: boolean;
  notificationPreferences: {
    suggestionNotifications: boolean;
    insightNotifications: boolean;
    reminderNotifications: boolean;
  };
}

interface UserInteraction {
  timestamp: Date;
  actionType: 'Applied Suggestion' | 'Dismissed Suggestion' | 'Asked Question' | 'Used Feature' | 'Viewed Insight';
  context: string;
  feedbackProvided?: 'Positive' | 'Negative' | 'Neutral';
}

interface OrganizationContext {
  name: string;
  mission: string;
  size: 'Small' | 'Medium' | 'Large';
  focus: string[];
  primaryChallenges: string[];
  importantDates: {date: Date, description: string}[];
}

// Original Chat message interface
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  context?: string;
  associatedAction?: string;
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

// Enhanced Suggestion Interface with more intelligence
interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity' | 'Tone' | 'Format' | 'Fundraising' | 'Engagement' | 'Strategy' | 'Content';
  severity: 'High' | 'Medium' | 'Low';
  impact?: 'Mission Impact' | 'Efficiency' | 'Fundraising' | 'Engagement' | 'Compliance';
  contextualNote?: string; // Additional organization-specific context
  alternatives?: string[]; // Alternative suggestions
  relatedResources?: {title: string, url: string}[]; // Related learning resources
  implementationDifficulty?: 'Easy' | 'Medium' | 'Complex';
}

// Intelligence Insights - proactive assistance
interface Insight {
  id: string;
  title: string;
  description: string;
  category: 'Fundraising' | 'Engagement' | 'Programs' | 'Operations' | 'Strategy';
  priority: 'High' | 'Medium' | 'Low';
  actionable: boolean;
  actions?: {label: string, handler: () => void}[];
  dismissed: boolean;
  data?: any; // Supporting data
  createdAt: Date;
}

// Enhanced Props Interface
interface EngieProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
  targetEditorSelector?: string; // Selector for the main text editing area
  userPreferences?: Partial<UserPreferences>;
  organizationContext?: Partial<OrganizationContext>;
  insights?: Insight[];
  onInsightAction?: (insightId: string, action: string) => void;
  onPreferencesChange?: (preferences: Partial<UserPreferences>) => void;
  onUserInteraction?: (interaction: UserInteraction) => void;
}

const severityColorMap: { [key in Suggestion['severity']]: string } = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-blue-500',
};

const categoryIconMap: { [key: string]: React.ReactNode } = {
  Fundraising: <Gift className="h-4 w-4" />,
  Engagement: <Users className="h-4 w-4" />,
  Programs: <Flag className="h-4 w-4" />,
  Operations: <Settings className="h-4 w-4" />,
  Strategy: <Target className="h-4 w-4" />
};

const Engie: React.FC<EngieProps> = ({
  suggestions: externalSuggestions,
  onApply: onApplyExternal,
  onDismiss: onDismissExternal,
  onIdeate: onIdeateExternalProp,
  targetEditorSelector,
  userPreferences,
  organizationContext,
  insights = [],
  onInsightAction,
  onPreferencesChange,
  onUserInteraction
}) => {
  // Core UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevScannedTextRef = useRef<string>("");
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draggableRef = useRef<HTMLDivElement>(null);

  // Enhanced state for intelligent features
  const [internalSuggestions, setInternalSuggestions] = useState<Suggestion[]>([]);
  const [toneAnalysisResult, setToneAnalysisResult] = useState<ToneAnalysis | null>(null);
  const [overallPageToneAnalysis, setOverallPageToneAnalysis] = useState<ToneAnalysis | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [insightsState, setInsightsState] = useState<Insight[]>(insights || []);
  const [userPreferencesState, setUserPreferencesState] = useState<Partial<UserPreferences>>(userPreferences || {});
  const [organizationContextState, setOrganizationContextState] = useState<Partial<OrganizationContext>>(organizationContext || {});
  const [isIdeating, setIsIdeating] = useState(false);
  const [ideationMessage, setIdeationMessage] = useState<ChatMessage | null>(null);
  const [activeTab, setActiveTab] = useState("suggestions");
  const [showOnboarding, setShowOnboarding] = useState(!userPreferencesState?.role);
  const [isOnboarding, setIsOnboarding] = useState(!userPreferencesState?.role);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{original: string, suggestion: string}>({original: '', suggestion: ''});
  const [undoHistory, setUndoHistory] = useState<{suggestion: Suggestion, timestamp: Date}[]>([]);
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [contextualHelpTopic, setContextualHelpTopic] = useState<string | null>(null);
  const [contextualHelp, setContextualHelp] = useState<{visible: boolean, content: string, position: {x: number, y: number}}>({
    visible: false,
    content: '',
    position: {x: 0, y: 0}
  });
  const [userQuestion, setUserQuestion] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [encouragementMessageApi, setEncouragementMessageApi] = useState<ChatMessage | null>(null);
  const [lastEncouragementTone, setLastEncouragementTone] = useState<string | null>(null);
  const [userInteractions, setUserInteractions] = useState<UserInteraction[]>([]);
  const [localUserPreferences, setLocalUserPreferences] = useState<Partial<UserPreferences>>(userPreferences || {});
  const [localOrgContext, setLocalOrgContext] = useState<Partial<OrganizationContext>>(organizationContext || {});
  const [lastInteractions, setLastInteractions] = useState<{type: string, count: number}[]>([]);
  const [suggestionsHistory, setSuggestionsHistory] = useState<Suggestion[]>([]);

  // Computed values
  const activeSuggestions = internalSuggestions.length > 0 ? internalSuggestions : externalSuggestions;
  const activeInsights = insightsState.filter(insight => !insight.dismissed);
  const currentSuggestion = activeSuggestions.length > 0 ? activeSuggestions[currentSuggestionIndex] : null;

  // Extracts text from a specific target element
  const extractTextFromTarget = useCallback((selector: string): string | null => {
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
  }, []);

  // Extracts text from the full document body, excluding Engie's own UI
  const extractFullPageText = useCallback((): string => {
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
  }, []);

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

  // Function to trigger a scan of the document
  const triggerScan = useCallback(() => {
    setStatusMessage("Engie is scanning document...");
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const fullPageText = extractFullPageText();
      const targetEditorText = targetEditorSelector 
        ? extractTextFromTarget(targetEditorSelector) 
        : null;
      
      processScannedTexts(fullPageText, targetEditorText);
    }, 500);
  }, [extractFullPageText, extractTextFromTarget, processScannedTexts, targetEditorSelector]);

  const resetTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      triggerIdeation(false);
    }, 30000); // 30 seconds of inactivity
  }, []);

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

  const handleDocumentChange = useCallback(() => {
    if (isIdeating || (isChatOpen && ideationMessage)) return;

    setStatusMessage("Engie is scanning document...");

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const fullPageText = extractFullPageText();
      let targetEditorText: string | null = null;
      if (targetEditorSelector) {
        targetEditorText = extractTextFromTarget(targetEditorSelector);
      }
      processScannedTexts(fullPageText, targetEditorText);
    }, 1500);
  }, [isIdeating, ideationMessage, isChatOpen, targetEditorSelector, extractFullPageText, extractTextFromTarget, processScannedTexts]);

  // Track user interactions to learn preferences
  const trackInteraction = useCallback((interaction: UserInteraction) => {
    setUserInteractions(prev => {
      const updated = [...prev, interaction];
      // Update local preferences
      setLocalUserPreferences(p => ({
        ...p,
        interactionHistory: updated
      }));
      // Notify parent if callback exists
      if (onUserInteraction) {
        onUserInteraction(interaction);
      }
      return updated;
    });
    
    // Update last interactions summary for intelligent suggestions
    setLastInteractions(prev => {
      const existing = prev.find(i => i.type === interaction.actionType);
      if (existing) {
        return prev.map(i => i.type === interaction.actionType ? {...i, count: i.count + 1} : i);
      } else {
        return [...prev, {type: interaction.actionType, count: 1}];
      }
    });
  }, [onUserInteraction]);

  // Preview the suggestion before applying
  const handlePreview = () => {
    if (currentSuggestion) {
      setPreviewContent({
        original: currentSuggestion.original,
        suggestion: currentSuggestion.suggestion
      });
      setShowPreview(true);
    }
  };
  
  // Intelligent apply with one-click implementation and undo capability
  const handleApply = () => {
    if (currentSuggestion) {
      // Store in undo history before applying
      setUndoHistory(prev => [...prev, {
        suggestion: currentSuggestion,
        timestamp: new Date()
      }]);
      
      // Track this interaction for learning
      trackInteraction({
        timestamp: new Date(),
        actionType: 'Applied Suggestion',
        context: `Applied ${currentSuggestion.type} suggestion: "${currentSuggestion.original}" → "${currentSuggestion.suggestion}"`,
      });
      
      // Store in suggestions history for learning
      setSuggestionsHistory(prev => [...prev, currentSuggestion]);
      
      // Apply the suggestion
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
      
      // Close the preview if it's open
      setShowPreview(false);
      
      // Show success feedback
      setStatusMessage(`Applied: "${currentSuggestion.suggestion}"`);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };
  
  // Undo the last applied suggestion
  const handleUndo = () => {
    if (undoHistory.length > 0) {
      const lastApplied = undoHistory[undoHistory.length - 1];
      
      // Create a reverse suggestion (putting back the original)
      const reverseSuggestion: Suggestion = {
        ...lastApplied.suggestion,
        id: `undo-${lastApplied.suggestion.id}`,
        original: lastApplied.suggestion.suggestion,
        suggestion: lastApplied.suggestion.original,
        explanation: `Undo: Reverting back to "${lastApplied.suggestion.original}"`,
      };
      
      // Apply the reverse suggestion
      onApplyExternal(reverseSuggestion);
      
      // Remove from undo history
      setUndoHistory(prev => prev.slice(0, -1));
      
      // Track this interaction
      trackInteraction({
        timestamp: new Date(),
        actionType: 'Used Feature',
        context: `Undid suggestion: "${lastApplied.suggestion.suggestion}" → "${lastApplied.suggestion.original}"`,
      });
      
      // Show success feedback
      setStatusMessage(`Undid change: Reverted to "${lastApplied.suggestion.original}"`);
      setTimeout(() => setStatusMessage(""), 3000);
    }
  };

  const handleDismiss = () => {
    if (currentSuggestion) {
      // Track this dismissal for learning
      trackInteraction({
        timestamp: new Date(),
        actionType: 'Dismissed Suggestion',
        context: `Dismissed ${currentSuggestion.type} suggestion: "${currentSuggestion.original}" → "${currentSuggestion.suggestion}"`,
      });
      
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
      
      // Show subtle feedback
      setStatusMessage(`Dismissed suggestion for "${currentSuggestion.original}"`);
      setTimeout(() => setStatusMessage(""), 2000);
    }
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

  // Return the component JSX
  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowOnboarding(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
            
            {onboardingStep === 1 && (
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Engie!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Let's get to know each other better. What's your role at your organization?</p>
                
                <div className="space-y-2 mb-6">
                  {['Executive Director', 'Program Manager', 'Volunteer Coordinator', 'Fundraising Manager', 'Board Member', 'General Staff'].map(role => (
                    <button
                      key={role}
                      className={`w-full p-2 rounded-md text-left pl-4 border ${
                        userPreferencesState.role === role 
                          ? 'border-primary bg-primary/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setUserPreferencesState(prev => ({...prev, role}));
                        if (onPreferencesChange) onPreferencesChange({...userPreferencesState, role});
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                
                <Button 
                  className="w-full"
                  onClick={() => setOnboardingStep(2)}
                  disabled={!userPreferencesState.role}
                >
                  Continue
                </Button>
              </div>
            )}
            
            {onboardingStep === 2 && (
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Your Mission</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Tell me a bit about your organization's mission.</p>
                
                <Input
                  className="mb-4"
                  placeholder="Our mission is to..."
                  value={organizationContextState.mission || ''}
                  onChange={(e) => {
                    setOrganizationContextState(prev => ({...prev, mission: e.target.value}));
                  }}
                />
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">What's the size of your organization?</p>
                  <div className="flex space-x-2">
                    {['Small', 'Medium', 'Large'].map(size => (
                      <button
                        key={size}
                        className={`flex-1 p-2 rounded-md border ${
                          organizationContextState.size === size 
                            ? 'border-primary bg-primary/10' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => {
                          setOrganizationContextState(prev => ({
                            ...prev, 
                            size: size as 'Small' | 'Medium' | 'Large'
                          }));
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOnboardingStep(1)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setOnboardingStep(3)}
                    disabled={!organizationContextState.mission || !organizationContextState.size}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {onboardingStep === 3 && (
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Personalized Tips</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Would you like to receive personalized writing tips based on your previous documents?</p>
                
                <div className="flex items-center justify-center space-x-2 mb-8">
                  <Switch
                    id="personalized-tips"
                    checked={userPreferencesState.personalizedTips !== false}
                    onCheckedChange={(checked) => {
                      setUserPreferencesState(prev => ({...prev, personalizedTips: checked}));
                      if (onPreferencesChange) onPreferencesChange({...userPreferencesState, personalizedTips: checked});
                    }}
                  />
                  <label htmlFor="personalized-tips" className="text-sm text-gray-700 dark:text-gray-300">
                    Enable personalized tips
                  </label>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOnboardingStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => setShowOnboarding(false)}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Contextual Help */}
      {showContextualHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowContextualHelp(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-4">
              <div className="bg-primary/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">{contextualHelpTopic || 'Help Center'}</h2>
            </div>
            
            <ScrollArea className="h-80 pr-4">
              {contextualHelpTopic === 'Suggestions' && (
                <div className="space-y-4">
                  <h3 className="font-medium">About Suggestions</h3>
                  <p>Engie intelligently analyzes your content to provide suggestions that improve clarity, engagement, and impact.</p>
                  
                  <h3 className="font-medium">Working with Suggestions</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Click <strong>Apply</strong> to automatically implement a suggestion</li>
                    <li>Use <strong>Preview</strong> to see how the change will look</li>
                    <li>The <strong>Undo</strong> button restores your last applied change</li>
                    <li>Suggestions are categorized by type and importance</li>
                  </ul>
                  
                  <h3 className="font-medium">Types of Suggestions</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Spelling/Grammar:</strong> Basic text corrections</li>
                    <li><strong>Style/Clarity:</strong> Improvements to readability</li>
                    <li><strong>Fundraising:</strong> Donor-focused language improvements</li>
                    <li><strong>Engagement:</strong> Enhancements to audience connection</li>
                    <li><strong>Strategy:</strong> Mission-aligned content suggestions</li>
                  </ul>
                </div>
              )}
              
              {contextualHelpTopic === 'Insights' && (
                <div className="space-y-4">
                  <h3 className="font-medium">About Insights</h3>
                  <p>Insights are proactive recommendations based on your organization's goals, challenges, and content patterns.</p>
                  
                  <h3 className="font-medium">Using Insights</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Insights appear in the Insights tab</li>
                    <li>High priority insights are marked with red</li>
                    <li>Click any actionable insight to see implementation options</li>
                    <li>Dismiss insights you've addressed or don't need</li>
                  </ul>
                  
                  <h3 className="font-medium">Types of Insights</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Fundraising:</strong> Opportunities to enhance donor communications</li>
                    <li><strong>Engagement:</strong> Ways to better connect with your audience</li>
                    <li><strong>Programs:</strong> Suggestions for program descriptions and impact</li>
                    <li><strong>Operations:</strong> Improvements to internal communications</li>
                    <li><strong>Strategy:</strong> Alignment with mission and organizational goals</li>
                  </ul>
                </div>
              )}
              
              {(!contextualHelpTopic || contextualHelpTopic === 'General') && (
                <div className="space-y-4">
                  <h3 className="font-medium">About Engie</h3>
                  <p>Engie is your intelligent nonprofit writing assistant, designed to help you create more effective content with less effort.</p>
                  
                  <h3 className="font-medium">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Intelligent Suggestions:</strong> Get real-time writing improvements</li>
                    <li><strong>Proactive Insights:</strong> Receive strategic content recommendations</li>
                    <li><strong>Smart Chat:</strong> Ask questions or get writing help</li>
                    <li><strong>Learning System:</strong> Engie adapts to your organization's style</li>
                  </ul>
                  
                  <h3 className="font-medium">Getting Started</h3>
                  <p>Just start writing in the editor, and Engie will automatically scan your content and provide suggestions. Click the chat icon to ask questions or get help with specific writing tasks.</p>
                  
                  <h3 className="font-medium">Need More Help?</h3>
                  <p>Click on the specific feature tabs in this help center, or ask Engie directly by typing your question in the chat interface.</p>
                </div>
              )}
            </ScrollArea>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setShowContextualHelp(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Engie Interface */}
      <Draggable bounds="parent" handle=".handle" nodeRef={draggableRef}>
        <div ref={draggableRef} className={`fixed bottom-5 right-5 flex flex-col items-end z-40 ${isChatOpen ? 'w-80' : 'w-auto'}`}>
          {/* Notification Badge */}
          {!isChatOpen && (internalSuggestions.length > 0 || insights.some(i => i.priority === 'High' && !i.dismissed)) && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {internalSuggestions.length + insights.filter(i => i.priority === 'High' && !i.dismissed).length}
            </div>
          )}
          
          {/* Undo Button */}
          {undoHistory.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 flex items-center justify-center mb-2"
              onClick={() => {
                // Handle undo logic
                const lastSuggestion = undoHistory[undoHistory.length - 1];
                setUndoHistory(prev => prev.slice(0, -1));
                // In a real implementation, this would reverse the last applied suggestion
              }}
              title="Undo last change"
            >
              <Undo className="h-4 w-4" />
            </motion.button>
          )}
          
          {/* Main Chat Interface (when open) */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-2 overflow-hidden flex flex-col w-full"
                style={{ height: '400px' }}
              >
                {/* Header with tabs */}
                <div className="handle bg-primary/10 p-2 cursor-move flex items-center justify-between">
                  <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 bg-transparent">
                      <TabsTrigger value="suggestions" className="text-xs">
                        Suggestions
                        {internalSuggestions.length > 0 && (
                          <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1">
                            {internalSuggestions.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="assistant" className="text-xs">Assistant</TabsTrigger>
                      <TabsTrigger value="insights" className="text-xs">
                        Insights
                        {insights.some(i => i.priority === 'High' && !i.dismissed) && (
                          <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1">
                            {insights.filter(i => i.priority === 'High' && !i.dismissed).length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-1"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Content for each tab */}
                <TabsContent value="suggestions" className="flex-1 overflow-auto p-0 m-0">
                  {isScanning && (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">Scanning your document...</p>
                    </div>
                  )}
                  
                  {!isScanning && internalSuggestions.length > 0 && (
                    <div className="flex flex-col h-full">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <p className="text-sm font-medium">
                          {currentSuggestionIndex + 1} of {internalSuggestions.length}
                        </p>
                        
                        <div className="flex items-center space-x-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => setShowContextualHelp(true) || setContextualHelpTopic('Suggestions')}
                              >
                                <BookOpen className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Help with suggestions</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => setPreviewMode(prev => !prev)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Toggle preview</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Toggle preview mode</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${severityColorMap[currentSuggestion.severity]}`}></div>
                            <div>
                              <p className="text-sm font-medium mb-1">
                                {currentSuggestion.type} suggestion
                                {currentSuggestion.impact && (
                                  <Badge variant="outline" className="ml-2 font-normal">
                                    {currentSuggestion.impact}
                                  </Badge>
                                )}
                              </p>
                              <div className="space-y-2">
                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-sm">
                                  <p className="text-gray-500 dark:text-gray-400">Original:</p>
                                  <p className="font-mono">{currentSuggestion.original}</p>
                                </div>
                                
                                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-sm">
                                  <p className="text-green-600 dark:text-green-400">Suggestion:</p>
                                  <p className="font-mono">{currentSuggestion.suggestion}</p>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {currentSuggestion.explanation}
                                </p>
                                
                                {currentSuggestion.contextualNote && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm">
                                    <p className="text-blue-600 dark:text-blue-400">Note:</p>
                                    <p>{currentSuggestion.contextualNote}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            // Dismiss current suggestion
                            onDismissExternal(currentSuggestion.id);
                            // Move to next suggestion if available
                            if (currentSuggestionIndex < internalSuggestions.length - 1) {
                              setCurrentSuggestionIndex(currentSuggestionIndex + 1);
                            }
                          }}
                        >
                          Dismiss
                        </Button>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              if (currentSuggestionIndex > 0) {
                                setCurrentSuggestionIndex(currentSuggestionIndex - 1);
                              }
                            }}
                            disabled={currentSuggestionIndex === 0}
                          >
                            Previous
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              if (currentSuggestionIndex < internalSuggestions.length - 1) {
                                setCurrentSuggestionIndex(currentSuggestionIndex + 1);
                              }
                            }}
                            disabled={currentSuggestionIndex === internalSuggestions.length - 1}
                          >
                            Next
                          </Button>
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => {
                            // Apply the suggestion
                            onApplyExternal(currentSuggestion);
                            // Track in undo history
                            setUndoHistory(prev => [...prev, currentSuggestion]);
                            // Log the interaction for learning
                            if (onUserInteraction) {
                              onUserInteraction({
                                timestamp: new Date(),
                                actionType: 'Applied Suggestion',
                                context: currentSuggestion.type,
                                feedbackProvided: 'Positive'
                              });
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!isScanning && internalSuggestions.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3 mb-4">
                        <Check className="h-6 w-6 text-green-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Looking good!</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        No suggestions found. Your content is clear and effective.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => triggerScan()}>
                        Scan Again
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                {/* Assistant Tab */}
                <TabsContent value="assistant" className="flex-1 flex flex-col p-0 m-0">
                  <ScrollArea className="flex-1 p-4">
                    {/* Ideation message */}
                    {ideationMessage && (
                      <div className="mb-4 bg-primary/10 p-3 rounded-lg">
                        <p className="text-sm">{ideationMessage}</p>
                      </div>
                    )}
                    
                    {/* Chat messages */}
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                        <BrainCircuit className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Nonprofit Assistant</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto mb-6">
                          Ask me anything about nonprofit communications, fundraising, or strategy. I'm here to help!
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground ml-12' 
                              : 'bg-muted mr-12'
                          } mb-2`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1 text-right">
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                  
                  <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                    <form className="flex items-center space-x-2" onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                      const message = input.value.trim();
                      if (!message) return;
                      
                      // Add user message to chat
                      const userMessage: ChatMessage = {
                        role: 'user',
                        content: message,
                        timestamp: new Date()
                      };
                      setChatMessages(prev => [...prev, userMessage]);
                      input.value = '';
                      
                      // Set loading state
                      setIsIdeating(true);
                      
                      // Get AI response
                      callEngieChatAPI(message, [...chatMessages, userMessage]).then(response => {
                        if (response) {
                          setChatMessages(prev => [...prev, {
                            role: 'assistant',
                            content: response,
                            timestamp: new Date()
                          }]);
                        }
                        setIsIdeating(false);
                      });
                    }}>
                      <Input 
                        placeholder="Ask me anything..." 
                        className="flex-1"
                      />
                      <Button size="icon" type="submit" disabled={isIdeating}>
                        {isIdeating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="sr-only">Send</span>
                      </Button>
                    </form>
                  </div>
                </TabsContent>
                
                {/* Insights Tab */}
                <TabsContent value="insights" className="flex-1 flex flex-col p-0 m-0">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <p className="text-sm font-medium">Organizational Insights</p>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => setShowContextualHelp(true) || setContextualHelpTopic('Insights')}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Help with insights</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    {insights.filter(i => !i.dismissed).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <BarChart className="h-8 w-8 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No active insights</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Insights will appear here as Engie learns more about your organization and content.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {insights.filter(i => !i.dismissed).map(insight => (
                          <Card key={insight.id} className={`${
                            insight.priority === 'High' 
                              ? 'border-red-300 dark:border-red-700' 
                              : insight.priority === 'Medium'
                                ? 'border-yellow-300 dark:border-yellow-700'
                                : 'border-blue-300 dark:border-blue-700'
                          }`}>
                            <CardHeader className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {categoryIconMap[insight.category]}
                                  <Badge variant="outline" className="ml-2">
                                    {insight.category}
                                  </Badge>
                                </div>
                                
                                <Badge variant={
                                  insight.priority === 'High' 
                                    ? 'destructive' 
                                    : insight.priority === 'Medium'
                                      ? 'default'
                                      : 'outline'
                                }>
                                  {insight.priority}
                                </Badge>
                              </div>
                              <CardTitle className="text-sm font-semibold mt-1">{insight.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="py-2 px-3">
                              <p className="text-xs text-gray-600 dark:text-gray-300">{insight.description}</p>
                            </CardContent>
                            {insight.actionable && insight.actions && insight.actions.length > 0 && (
                              <CardFooter className="flex justify-end p-2 gap-2">
                                {insight.actions.map((action, idx) => (
                                  <Button 
                                    key={idx} 
                                    size="sm" 
                                    variant={idx === 0 ? 'default' : 'outline'}
                                    className="text-xs h-7 px-2"
                                    onClick={() => {
                                      action.handler();
                                      if (onInsightAction) {
                                        onInsightAction(insight.id, action.label);
                                      }
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Button (always visible) */}
          <Button 
            onClick={() => setIsChatOpen(!isChatOpen)} 
            size="icon" 
            className={`rounded-full h-12 w-12 shadow-lg ${
              !isChatOpen && (internalSuggestions.length > 0 || insights.some(i => i.priority === 'High' && !i.dismissed))
                ? 'animate-bounce'
                : ''
            }`}
          >
            {isChatOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </Button>
        </div>
      </Draggable>
    </>
  );
};

export default Engie;