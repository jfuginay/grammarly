import React, { useState, useEffect, useRef, useCallback } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Loader2, MessageCircle, BrainCircuit, PanelTop, Settings, Lightbulb, Check, Undo, BarChart, User, Users, Gift, Calendar, Zap, Flag, BookOpen, Target, Heart } from 'lucide-react';
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

  // Enhanced state for intelligent features
  const [internalSuggestions, setInternalSuggestions] = useState<Suggestion[]>([]);
  const [toneAnalysisResult, setToneAnalysisResult] = useState<ToneAnalysis | null>(null); // For target editor
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [insights, setInsights] = useState<Insight[]>(insights || []);
  const [userPreferencesState, setUserPreferencesState] = useState<Partial<UserPreferences>>(userPreferences || {});
  const [organizationContextState, setOrganizationContextState] = useState<Partial<OrganizationContext>>(organizationContext || {});
  const [isIdeating, setIsIdeating] = useState(false);
  const [ideationMessage, setIdeationMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("suggestions");
  const [showOnboarding, setShowOnboarding] = useState(!userPreferencesState?.role);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [undoHistory, setUndoHistory] = useState<Suggestion[]>([]);
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [contextualHelpTopic, setContextualHelpTopic] = useState<string | null>(null);
  
  // Function to trigger a scan of the document
  const triggerScan = useCallback(() => {
    setStatusMessage("Engie is scanning document...");
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const fullPageText = stableExtractFullPageText();
      const targetEditorText = targetEditorSelector 
        ? stableExtractTextFromTarget(targetEditorSelector) 
        : null;
      
      processScannedTexts(fullPageText, targetEditorText);
    }, 500);
  }, [stableExtractFullPageText, stableExtractTextFromTarget, processScannedTexts]);

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

  // Enhanced state for intelligent features
  const [internalSuggestions, setInternalSuggestions] = useState<Suggestion[]>([]);
  const [toneAnalysisResult, setToneAnalysisResult] = useState<ToneAnalysis | null>(null); // For target editor
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [insights, setInsights] = useState<Insight[]>(insights || []);
  const [userPreferencesState, setUserPreferencesState] = useState<Partial<UserPreferences>>(userPreferences || {});
  const [organizationContextState, setOrganizationContextState] = useState<Partial<OrganizationContext>>(organizationContext || {});
  const [isIdeating, setIsIdeating] = useState(false);
  const [ideationMessage, setIdeationMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("suggestions");
  const [showOnboarding, setShowOnboarding] = useState(!userPreferencesState?.role);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [undoHistory, setUndoHistory] = useState<Suggestion[]>([]);
  const [showContextualHelp, setShowContextualHelp] = useState(false);
  const [contextualHelpTopic, setContextualHelpTopic] = useState<string | null>(null);
  
  }, [stableExtractFullPageText, stableExtractTextFromTarget, processScannedTexts]);

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

  // Smart onboarding and contextual learning
  const handleOnboardingNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
    } else {
      // Finish onboarding
      setIsOnboarding(false);
      
      // Save preferences from onboarding
      if (onPreferencesChange) {
        onPreferencesChange(localUserPreferences);
      }
      
      // Track completion
      trackInteraction({
        timestamp: new Date(),
        actionType: 'Used Feature',
        context: 'Completed onboarding flow',
      });
      
      // Show welcome message
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Welcome ${localUserPreferences.role || 'to Engie'}! I'm here to help you create impactful content for your nonprofit. Let me know what you're working on, and I'll provide intelligent suggestions tailored to your organization's mission${localOrgContext.mission ? `: "${localOrgContext.mission}"` : ''}.`,
          timestamp: new Date()
        }
      ]);
    }
  };
  
  const handleOnboardingSkip = () => {
    setIsOnboarding(false);
    
    // Track skip
    trackInteraction({
      timestamp: new Date(),
      actionType: 'Used Feature',
      context: 'Skipped onboarding flow',
    });
  };
  
  // Handle role selection during onboarding
  const handleRoleSelection = (role: UserPreferences['role']) => {
    setLocalUserPreferences(prev => ({...prev, role}));
  };
  
  // Handle mission input during onboarding
  const handleMissionInput = (mission: string) => {
    setLocalOrgContext(prev => ({...prev, mission}));
  };
  
  // Handle organization size selection
  const handleOrgSizeSelection = (size: OrganizationContext['size']) => {
    setLocalOrgContext(prev => ({...prev, size}));
  };
  
  // Proactive feature suggestions based on role and behavior
  const getProactiveSuggestions = useCallback(() => {
    // Only suggest if we have some user data
    if (!localUserPreferences.role) return null;
    
    // Check recent interactions
    const recentDismissals = userInteractions
      .filter(i => i.actionType === 'Dismissed Suggestion' && 
                  new Date().getTime() - i.timestamp.getTime() < 1000 * 60 * 60 * 24)
      .length;
      
    const recentApplications = userInteractions
      .filter(i => i.actionType === 'Applied Suggestion' && 
                  new Date().getTime() - i.timestamp.getTime() < 1000 * 60 * 60 * 24)
      .length;
    
    // Generate personalized suggestions based on role and behavior
    if (recentDismissals > 5 && recentApplications < 2) {
      return {
        message: "I've noticed you're dismissing a lot of suggestions. Would you like me to adjust my recommendations to better match your needs?",
        actions: [
          { label: "Yes, adjust suggestions", handler: () => adjustSuggestionPreferences() },
          { label: "No thanks", handler: () => dismissProactiveSuggestion() }
        ]
      };
    }
    
    // Role-specific suggestions
    if (localUserPreferences.role === 'Fundraising Manager' && suggestionsHistory.filter(s => s.type === 'Fundraising').length === 0) {
      return {
        message: "Would you like me to provide specialized fundraising language suggestions to help maximize donor engagement?",
        actions: [
          { label: "Yes, please", handler: () => enableFundraisingSuggestions() },
          { label: "Not now", handler: () => dismissProactiveSuggestion() }
        ]
      };
    }
    
    return null;
  }, [localUserPreferences.role, userInteractions, suggestionsHistory]);
  
  // Placeholder functions for the proactive suggestion handlers
  const adjustSuggestionPreferences = () => {
    setLocalUserPreferences(prev => ({
      ...prev,
      personalizedTips: true
    }));
    
    if (onPreferencesChange) {
      onPreferencesChange({
        ...localUserPreferences,
        personalizedTips: true
      });
    }
    
    setStatusMessage("I'll adjust my suggestions to better match your preferences");
    setTimeout(() => setStatusMessage(""), 3000);
  };
  
  const dismissProactiveSuggestion = () => {
    // Just dismiss the current proactive suggestion
    setStatusMessage("Suggestion dismissed");
    setTimeout(() => setStatusMessage(""), 2000);
  };
  
  const enableFundraisingSuggestions = () => {
    setLocalUserPreferences(prev => ({
      ...prev,
      favoriteFeatures: [...(prev.favoriteFeatures || []), 'Fundraising Suggestions']
    }));
    
    if (onPreferencesChange) {
      onPreferencesChange({
        ...localUserPreferences,
        favoriteFeatures: [...(localUserPreferences.favoriteFeatures || []), 'Fundraising Suggestions']
      });
    }
    
    setStatusMessage("Fundraising suggestions enabled");
    setTimeout(() => setStatusMessage(""), 3000);
  };
  
  // Natural language question handling
  const handleQuestionSubmit = async () => {
    if (!userQuestion.trim()) return;
    
    // Add user question to chat history
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    }]);
    
    // Track this interaction
    trackInteraction({
      timestamp: new Date(),
      actionType: 'Asked Question',
      context: `Asked: "${userQuestion}"`,
    });
    
    // Set thinking state
    setIsAssistantThinking(true);
    
    try {
      // In a real implementation, this would call an API to get the assistant's response
      // Simulate API call with timeout
      setTimeout(() => {
        const assistantResponse = generateAssistantResponse(userQuestion);
        
        // Add assistant response to chat history
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date()
        }]);
        
        setIsAssistantThinking(false);
      }, 1500);
    } catch (error) {
      console.error("Error getting assistant response:", error);
      setIsAssistantThinking(false);
      
      // Add error message to chat history
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I had trouble processing your question. Could you try rephrasing it?",
        timestamp: new Date()
      }]);
    }
    
    // Clear input
    setUserQuestion('');
  };
  
  // Simple placeholder function to generate responses based on question keywords
  const generateAssistantResponse = (question: string) => {
    const lowercaseQ = question.toLowerCase();
    
    if (lowercaseQ.includes('donor') || lowercaseQ.includes('fundraising')) {
      return "Based on my analysis of successful nonprofit fundraising campaigns, personalized donor acknowledgment can increase retention by up to 40%. Would you like me to suggest some donor-centric language for your content?";
    }
    
    if (lowercaseQ.includes('grant') || lowercaseQ.includes('funding')) {
      return "Grant applications are most successful when they clearly articulate impact metrics. I notice your organization focuses on " + (localOrgContext.focus?.[0] || "your mission area") + ". Would you like me to suggest some compelling impact statements related to this focus?";
    }
    
    if (lowercaseQ.includes('volunteer') || lowercaseQ.includes('recruit')) {
      return "Effective volunteer recruitment messaging should emphasize both the impact volunteers make and the benefits they receive. I can help you craft messaging that balances both aspects.";
    }
    
    // Default response with organization context if available
    return `I understand you're asking about "${question}". As your nonprofit assistant${localOrgContext.name ? ` for ${localOrgContext.name}` : ''}, I'm here to help you create impactful content${localOrgContext.mission ? ` that advances your mission: "${localOrgContext.mission}"` : ''}. Could you provide a bit more context about what you're working on?`;
  };

  // Helper function to safely format scores
  const formatScore = (score: number | undefined | null): string => {
    if (typeof score === 'number' && !isNaN(score)) {
      return score.toFixed(2);
    }
    return 'N/A';
  };

  // Render the enhanced Engie component
  return (
    <>
      {/* Onboarding Modal */}
      {isOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={handleOnboardingSkip} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">
                {onboardingStep === 0 && "Welcome to Engie!"}
                {onboardingStep === 1 && "Tell us about your role"}
                {onboardingStep === 2 && "What's your organization's mission?"}
                {onboardingStep === 3 && "Almost done!"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {onboardingStep === 0 && "Let's set up Engie to best assist your nonprofit organization. This will only take a minute."}
                {onboardingStep === 1 && "Knowing your role helps me provide relevant suggestions and insights."}
                {onboardingStep === 2 && "I'll tailor my assistance to support your organization's unique mission."}
                {onboardingStep === 3 && "Just a few more details to personalize your experience."}
              </p>
            </div>
            
            {/* Step content */}
            <div className="mb-6">
              {onboardingStep === 0 && (
                <div className="space-y-4">
                  <p className="text-sm">Engie is your AI nonprofit assistant that:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Provides intelligent writing suggestions</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Helps you craft compelling mission-driven content</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Learns from your interactions to better assist you</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Proactively suggests improvements based on nonprofit best practices</span>
                    </li>
                  </ul>
                </div>
              )}
              
              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm mb-2">Select your primary role:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Executive Director', 'Program Manager', 'Fundraising Manager', 'Volunteer Coordinator', 'Board Member', 'General Staff'].map(role => (
                      <button
                        key={role}
                        onClick={() => handleRoleSelection(role as UserPreferences['role'])}
                        className={`p-2 rounded-md text-sm text-left transition-colors ${
                          localUserPreferences.role === role 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm mb-2">What's your organization's mission? (1-2 sentences)</p>
                  <textarea
                    value={localOrgContext.mission || ''}
                    onChange={(e) => handleMissionInput(e.target.value)}
                    placeholder="e.g., We provide educational opportunities to underserved communities to break the cycle of poverty."
                    className="w-full h-24 p-2 text-sm border rounded-md resize-none"
                  />
                </div>
              )}
              
              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm mb-2">Organization size:</p>
                  <div className="flex space-x-2">
                    {['Small', 'Medium', 'Large'].map(size => (
                      <button
                        key={size}
                        onClick={() => handleOrgSizeSelection(size as OrganizationContext['size'])}
                        className={`flex-1 p-2 rounded-md text-sm transition-colors ${
                          localOrgContext.size === size 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm mb-2">Would you like to receive personalized tips?</p>
                    <div className="flex items-center">
                      <Switch
                        checked={localUserPreferences.personalizedTips !== false}
                        onCheckedChange={(checked) => 
                          setLocalUserPreferences(prev => ({...prev, personalizedTips: checked}))
                        }
                        id="personalized-tips"
                      />
                      <label htmlFor="personalized-tips" className="ml-2 text-sm">
                        Yes, help me with proactive suggestions
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                disabled={onboardingStep === 0}
                onClick={() => setOnboardingStep(prev => Math.max(0, prev - 1))}
              >
                Back
              </Button>
              <Button onClick={handleOnboardingNext}>
                {onboardingStep < 3 ? 'Next' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contextual Help Tooltip */}
      {contextualHelp.visible && (
        <div 
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-50 max-w-xs animate-in fade-in"
          style={{
            left: `${contextualHelp.position.x}px`,
            top: `${contextualHelp.position.y}px`,
          }}
        >
          <p className="text-xs">{contextualHelp.content}</p>
          <button 
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={() => setContextualHelp(prev => ({...prev, visible: false}))}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      
      {/* Main Engie UI */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end space-y-2">
        {/* Preview Mode */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 w-80"
          >
            <h3 className="text-sm font-medium mb-2">Preview Changes</h3>
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original:</p>
              <p className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded-md line-through">{previewContent.original}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 mt-2">Suggestion:</p>
              <p className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-md text-green-600 dark:text-green-400">{previewContent.suggestion}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button size="sm" onClick={handleApply}>Apply</Button>
            </div>
          </motion.div>
        )}
        
        {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 px-3 text-sm mb-2"
            >
              {statusMessage}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Undo Button */}
        {undoHistory.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 flex items-center justify-center"
            onClick={handleUndo}
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
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden w-[350px] sm:w-[450px] h-[500px] flex flex-col"
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-primary mr-2" />
                  <h2 className="font-medium">
                    Engie
                    {localUserPreferences.role && (
                      <span className="ml-1 text-xs text-gray-500">• {localUserPreferences.role} Mode</span>
                    )}
                  </h2>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b">
                  <TabsList className="w-full justify-start rounded-none h-10 bg-transparent p-0">
                    <TabsTrigger value="suggestions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      Suggestions {activeSuggestions.length > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">{activeSuggestions.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="assistant" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      Assistant
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                      Insights {activeInsights.length > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">{activeInsights.length}</Badge>}
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="flex-1 overflow-hidden flex flex-col p-0 m-0">
                  {isScanning && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">{statusMessage || "Analyzing your content..."}</p>
                    </div>
                  )}
                  
                  {!isScanning && activeSuggestions.length > 0 && currentSuggestion && (
                    <div className="flex-1 overflow-auto p-3">
                      <div className="mb-2 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                        <span>
                            Found {activeSuggestions.length - currentSuggestionIndex} suggestion(s):
                        </span>
                        <span className="text-xs">
                            {currentSuggestionIndex + 1} of {activeSuggestions.length}
                        </span>
                      </div>
                      
                      <Card className="mb-4">
                        <CardHeader className="flex flex-row items-center gap-2 p-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${severityColorMap[currentSuggestion.severity]}`}></span>
                          <CardTitle className="text-sm font-semibold">{currentSuggestion.type}</CardTitle>
                          <Badge variant="outline" className="font-normal text-xs">{currentSuggestion.severity}</Badge>
                          {currentSuggestion.impact && (
                            <Badge variant="secondary" className="font-normal text-xs ml-auto">{currentSuggestion.impact}</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-through">"{currentSuggestion.original}"</p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">"{currentSuggestion.suggestion}"</p>
                          <p className="text-xs text-muted-foreground mt-3">{currentSuggestion.explanation}</p>
                          
                          {currentSuggestion.contextualNote && (
                            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                <span className="font-medium">Nonprofit Context: </span>
                                {currentSuggestion.contextualNote}
                              </p>
                            </div>
                          )}
                          
                          {currentSuggestion.alternatives && currentSuggestion.alternatives.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium mb-1">Alternative options:</p>
                              <div className="flex flex-wrap gap-1">
                                {currentSuggestion.alternatives.map((alt, idx) => (
                                  <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-secondary">
                                    {alt}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      {/* If we have related resources, show them */}
                      {currentSuggestion.relatedResources && currentSuggestion.relatedResources.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-medium mb-2">Related Resources:</h4>
                          <ul className="space-y-1">
                            {currentSuggestion.relatedResources.map((resource, idx) => (
                              <li key={idx} className="text-xs">
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" 
                                   className="text-blue-600 dark:text-blue-400 hover:underline">
                                  {resource.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={handleNext}>
                          {currentSuggestionIndex < activeSuggestions.length - 1 ? 'Next' : 'Ignore'}
                        </Button>
                        
                        {/* Preview before applying */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="secondary" size="sm" onClick={handlePreview}>
                                Preview
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">See how this will look</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <Button variant="default" size="sm" onClick={handleApply}>Apply</Button>
                      </div>
                    </div>
                  )}
                  
                  {!isScanning && activeSuggestions.length === 0 && (
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
                <TabsContent value="assistant" className="flex-1 overflow-hidden flex flex-col p-0 m-0">
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-4">
                      {/* Chat messages */}
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                          <BrainCircuit className="h-10 w-10 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">Nonprofit Assistant</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto mb-6">
                            Ask me anything about nonprofit communications, fundraising, or strategy. I'm here to help!
                          </p>
                        </div>
                      ) : (
                        chatHistory.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm">{msg.content}</p>
                              {msg.timestamp && (
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* Thinking indicator */}
                      {isAssistantThinking && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                            <div className="flex space-x-1">
                              <span className="w-2 h-2 rounded-full bg-current animate-bounce"></span>
                              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                              <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  {/* Quick suggestion chips */}
                  {chatHistory.length > 0 && !isAssistantThinking && (
                    <div className="p-3 border-t">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => {
                          setUserQuestion("How can we improve our donor engagement?");
                          handleQuestionSubmit();
                        }}>
                          Donor engagement tips
                        </Button>
                        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => {
                          setUserQuestion("Suggest some volunteer recruitment language");
                          handleQuestionSubmit();
                        }}>
                          Volunteer recruitment
                        </Button>
                        <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => {
                          setUserQuestion("Give me impact metrics examples");
                          handleQuestionSubmit();
                        }}>
                          Impact metrics
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Input area */}
                  <div className="p-3 border-t">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleQuestionSubmit();
                    }} className="flex gap-2">
                      <Input
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" disabled={!userQuestion.trim() || isAssistantThinking}>
                        {isAssistantThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
                
                {/* Insights Tab */}
                <TabsContent value="insights" className="flex-1 overflow-hidden flex flex-col p-0 m-0">
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-4">
                      {activeInsights.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                          <BarChart className="h-10 w-10 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Insights Yet</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto mb-6">
                            As you work with Engie, I'll provide personalized insights to help improve your nonprofit's impact.
                          </p>
                        </div>
                      ) : (
                        activeInsights.map((insight) => (
                          <Card key={insight.id} className="mb-4">
                            <CardHeader className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-2">
                                  {categoryIconMap[insight.category] || <Lightbulb className="h-4 w-4 mt-1" />}
                                  <div>
                                    <CardTitle className="text-sm font-semibold">{insight.title}</CardTitle>
                                    <CardDescription className="text-xs">
                                      {insight.category} • {insight.priority} Priority
                                    </CardDescription>
                                  </div>
                                </div>
                                {insight.actionable && (
                                  <Badge variant="outline" className="text-xs">Actionable</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                              <p className="text-sm">{insight.description}</p>
                              
                              {insight.actions && insight.actions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {insight.actions.map((action, idx) => (
                                    <Button key={idx} variant="outline" size="sm" onClick={action.handler}>
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification badges for suggestions */}
        {activeSuggestions.length > 0 && !isChatOpen && !(isScanning || isIdeating) && (
          <div className="relative">
            <Badge variant="destructive" className="absolute -top-1 -right-1">{activeSuggestions.length}</Badge>
          </div>
        )}
        
        {/* Main Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-transform ${isChatOpen ? 'rotate-90' : ''}`}
        >
          {isChatOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
};

export default Engie;