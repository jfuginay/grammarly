import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Suggestion } from './engie/types';
import { useDebouncedCallback } from 'use-debounce';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

interface TextFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'word' | 'phrase' | 'punctuation' | 'space' | 'paragraph';
  partOfSpeech?: string;
  priority?: 1 | 2 | 3; // Priority level as per co-developer brief
  confidence?: number; // Confidence score for the suggestion
}

interface EnhancedEditorProps {
  value: string;
  onChange: (text: string) => void;
  suggestions: Suggestion[];
  className?: string;
  placeholder?: string;
  toneHighlights?: Array<{
    startIndex: number;
    endIndex: number;
    tone: string;
    severity: string;
  }>;
  autoAnalyze?: boolean; // Whether to automatically analyze text after typing pauses
  readOnly?: boolean; // Whether the editor is read-only (for analysis display)
  showFragments?: boolean; // Whether to always show fragments (for analysis display)
  isAnalysisBox?: boolean; // Whether this is the top analysis box
  reflectTextFrom?: string; // Text to reflect in the analysis box
  posEnabled?: boolean; // External control for POS highlighting
  suggestionsEnabled?: boolean; // External control for suggestions
  onPosToggle?: (enabled: boolean) => void; // Callback for POS toggle
  onSuggestionsToggle?: (enabled: boolean) => void; // Callback for suggestions toggle
}

export interface EnhancedEditorRef {
  focus: () => void;
  applySuggestion: (suggestion: Suggestion) => void;
  getElement: () => HTMLTextAreaElement | null;
  analyzeText: () => Promise<void>; // Updated to return Promise<void>
  toggleFragmentsVisibility: () => void;
  clearAnalysis: () => void; // Method to clear analysis
  togglePOS: () => void; // Toggle POS highlighting
  toggleSuggestions: () => void; // Toggle suggestions
}

const EnhancedEditor = forwardRef<EnhancedEditorRef, EnhancedEditorProps>(({
  value,
  onChange,
  suggestions,
  className = '',
  placeholder = 'Start writing...',
  toneHighlights = [],
  autoAnalyze = true,
  readOnly = false,
  showFragments = false,
  isAnalysisBox = false,
  reflectTextFrom = '',
  posEnabled: externalPosEnabled,
  suggestionsEnabled: externalSuggestionsEnabled,
  onPosToggle,
  onSuggestionsToggle
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [textFragments, setTextFragments] = useState<TextFragment[]>([]);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  
  // Internal toggle states (can be controlled externally)
  const [internalPosEnabled, setInternalPosEnabled] = useState(false);
  const [internalSuggestionsEnabled, setInternalSuggestionsEnabled] = useState(true);
  
  // Use external control if provided, otherwise use internal state
  const posEnabled = externalPosEnabled !== undefined ? externalPosEnabled : internalPosEnabled;
  const suggestionsEnabled = externalSuggestionsEnabled !== undefined ? externalSuggestionsEnabled : internalSuggestionsEnabled;
  
  // Use our custom hook to handle auto-resizing
  useAutoResizeTextarea(
    textareaRef, 
    value, 
    isAnalysisBox ? 100 : 150,  // Different min heights for analysis box vs main editor
    isAnalysisBox ? 300 : undefined  // Set max height only for analysis box
  );
  const [shouldShowFragments, setShouldShowFragments] = useState(showFragments);
  const lastAnalyzedTextRef = useRef<string>('');
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Text analysis function with smart batching as per co-developer brief
  // Now returns a Promise that resolves when analysis completes
  const analyzeText = useCallback(() => {
    if (!value || value.trim() === '') {
      setTextFragments([]);
      setShouldShowFragments(false);
      return Promise.resolve(); // Return a resolved promise for empty text
    }
    
    // If we already have fragments and the text hasn't changed significantly, 
    // just toggle visibility instead of re-analyzing
    if (textFragments.length > 0 && lastAnalyzedTextRef.current === value) {
      setShouldShowFragments(true);
      return Promise.resolve(); // Return a resolved promise for cached analysis
    }
    
    setIsAnalyzingText(true);
    
    // Store current request reference for cancellation
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Cancel any previous in-flight requests as mentioned in the co-developer brief
    if (window.activeTextAnalysisRequest) {
      window.activeTextAnalysisRequest.abort();
    }
    window.activeTextAnalysisRequest = controller;
    
    // Return a promise for synchronization
    return new Promise<void>((resolve, reject) => {
      try {
        // Smart batching - send the entire document (as per co-developer brief)
        fetch('/api/correct-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: value }),
          signal: signal
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.textAnalysis && data.textAnalysis.fragments) {
              // Process fragments based on the priority system defined in the co-developer brief
              const prioritizedFragments = assignPriorities(data.textAnalysis.fragments);
              
              // Sort by priority for rendering (higher priority on top)
              prioritizedFragments.sort((a, b) => {
                // Sort by priority first (lower number = higher priority)
                const priorityDiff = (a.priority || 3) - (b.priority || 3);
                if (priorityDiff !== 0) return priorityDiff;
                
                // Then sort by confidence if available
                if (a.confidence && b.confidence) {
                  return b.confidence - a.confidence;
                }
                
                // Default sort by position
                return a.startIndex - b.startIndex;
              });
              
              setTextFragments(prioritizedFragments);
              setShouldShowFragments(true);
              lastAnalyzedTextRef.current = value;
              resolve(); // Resolve when analysis is complete
            } else {
              // Fallback to local analysis if API doesn't return fragments
              performLocalAnalysis();
              resolve(); // Resolve even with local analysis
            }
          })
          .catch(error => {
            if (error.name !== 'AbortError') {
              console.error('Error fetching text analysis:', error);
              performLocalAnalysis();
              resolve(); // Resolve even with error (after local analysis)
            } else {
              resolve(); // Resolve on abort - this is expected behavior
            }
          })
          .finally(() => {
            if (signal.aborted) return;
            setIsAnalyzingText(false);
            if (window.activeTextAnalysisRequest === controller) {
              window.activeTextAnalysisRequest = null;
            }
          });
      } catch (error) {
        console.error('Error analyzing text:', error);
        setIsAnalyzingText(false);
        reject(error); // Reject on critical errors
      }
    });
  }, [value, textFragments]);
  
  // Assign priorities to fragments based on the type and content
  const assignPriorities = useCallback((fragments: TextFragment[]): TextFragment[] => {
    return fragments.map(fragment => {
      let priority: 1 | 2 | 3 | undefined = undefined;
      let confidence = 0;
      
      // Assign priorities based on the type of fragment
      if (fragment.type === 'word') {
        // Check for spelling and grammar issues (highest priority)
        if (/[A-Z]/.test(fragment.text[0]) && fragment.startIndex > 0 && 
            !/[.!?]$/.test(value.charAt(fragment.startIndex - 2))) {
          // Capitalization issues in the middle of a sentence
          priority = 1;
          confidence = 0.9;
        } else if (/[^a-zA-Z0-9']/.test(fragment.text)) {
          // Possible spelling errors with non-standard characters
          priority = 1;
          confidence = 0.8;
        } else if (fragment.partOfSpeech === 'verb' || fragment.partOfSpeech === 'noun') {
          // Style issues with verbs and nouns (medium priority)
          priority = 2;
          confidence = 0.7;
        } else {
          // Minor word choice issues (low priority)
          priority = 3;
          confidence = 0.5;
        }
      } else if (fragment.type === 'phrase') {
        // Clarity issues with phrases (medium priority)
        priority = 2;
        confidence = 0.6;
      } else if (fragment.type === 'punctuation') {
        // Punctuation issues (high priority)
        priority = 1;
        confidence = 0.85;
      }
      
      return {
        ...fragment,
        priority,
        confidence
      };
    });
  }, [value]);

  // Local text analysis as fallback with priority assignments based on co-developer brief
  const performLocalAnalysis = useCallback(() => {
    try {
      // Simple tokenization of the text into words, punctuation, etc.
      const fragments: TextFragment[] = [];
      
      // Regular expression to match words, punctuation, spaces, and newlines
      // Enhanced to better separate words and ensure every word gets a fragment
      const tokenRegex = /(\b\w+\b|\s+|[^\w\s]+)/g;
      let match;
      
      while ((match = tokenRegex.exec(value)) !== null) {
        const text = match[0];
        const startIndex = match.index;
        const endIndex = startIndex + text.length;
        
        // Determine the type of fragment
        let type: TextFragment['type'] = 'word';
        let partOfSpeech: string | undefined = undefined;
        let priority: 1 | 2 | 3 | undefined = undefined;
        let confidence: number | undefined = undefined;
        
        if (/^\s+$/.test(text)) {
          type = text.includes('\n') ? 'paragraph' : 'space';
        } else if (/^\w+$/.test(text)) {
          type = 'word';
          
          // Improved part-of-speech guessing
          const lower = text.toLowerCase();
          if (["the", "a", "an"].includes(lower)) {
            partOfSpeech = "article";
          } else if (["is", "am", "are", "was", "were", "be", "been", "do", "does", "did", "have", "has", "had", "can", "could", "will", "would", "shall", "should", "may", "might", "must"].includes(lower)) {
            partOfSpeech = "verb";
          } else if (["in", "on", "at", "by", "for", "with", "about", "against", "between", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "into", "onto"].includes(lower)) {
            partOfSpeech = "preposition";
          } else if (["and", "but", "or", "nor", "for", "yet", "so"].includes(lower)) {
            partOfSpeech = "conjunction";
          } else if (["this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their"].includes(lower)) {
            partOfSpeech = "determiner";
          } else if (["i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them"].includes(lower)) {
            partOfSpeech = "pronoun";
          } else if (lower.endsWith("ly")) {
            partOfSpeech = "adverb";
          } else if (
            lower.endsWith("ed") ||
            lower.endsWith("en") ||
            lower.endsWith("ing") ||
            lower.endsWith("ify") ||
            lower.endsWith("ise") ||
            lower.endsWith("ize")
          ) {
            partOfSpeech = "verb";
          } else if (
            lower.endsWith("ous") || lower.endsWith("ful") || lower.endsWith("able") || lower.endsWith("ible") || lower.endsWith("al") || lower.endsWith("ive") || lower.endsWith("ic") || lower.endsWith("ary") || lower.endsWith("less") || lower.endsWith("est")
          ) {
            partOfSpeech = "adjective";
          } else if (
            lower.endsWith("ment") || lower.endsWith("ness") || lower.endsWith("tion") || lower.endsWith("sion") || lower.endsWith("ity") || lower.endsWith("hood") || lower.endsWith("ship") || lower.endsWith("ence") || lower.endsWith("ance")
          ) {
            partOfSpeech = "noun";
          } else if (text.length > 0) {
            partOfSpeech = "noun"; // Default
          }
          
          // Priority and confidence assignment based on the co-developer brief
          // Critical (Priority 1): Grammar errors, spelling mistakes
          if (/[A-Z]/.test(text[0]) && startIndex > 0 && 
              !/[.!?]$/.test(value.charAt(startIndex - 2))) {
            // Capitalization issues in the middle of a sentence
            priority = 1;
            confidence = 0.9;
          } else if (text.length > 3 && !/^[a-zA-Z]+$/.test(text)) {
            // Possible spelling errors
            priority = 1;
            confidence = 0.8;
          }
          // Important (Priority 2): Style improvements, clarity issues  
          else if (['very', 'really', 'basically', 'actually'].includes(text.toLowerCase())) {
            // Style improvements for common filler words
            priority = 2;
            confidence = 0.7;
          }
          // Minor (Priority 3): Word choice, tone suggestions
          else {
            priority = 3;
            confidence = 0.5;
          }
        } else if (/^[^\w\s]+$/.test(text)) {
          type = 'punctuation';
          
          // Check for missing spaces after punctuation
          if ([',', '.', '!', '?', ';', ':'].includes(text) && 
              startIndex + 1 < value.length && 
              /\S/.test(value[startIndex + 1])) {
            priority = 1;
            confidence = 0.95;
          }
        }
        
        fragments.push({
          text,
          startIndex,
          endIndex,
          type,
          partOfSpeech,
          priority,
          confidence
        });
      }
      
      // Try to identify phrases by looking for common patterns
      // This is a very basic approach - a real NLP library would do better
      identifyPhrases(fragments);
      
      // Sort by priority (higher priority should be rendered on top)
      fragments.sort((a, b) => {
        // Sort by priority first (lower number = higher priority)
        const priorityDiff = (a.priority || 3) - (b.priority || 3);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by confidence if available
        if (a.confidence && b.confidence) {
          return b.confidence - a.confidence;
        }
        
        // Default sort by position
        return a.startIndex - b.startIndex;
      });
      
      lastAnalyzedTextRef.current = value;
      setTextFragments(fragments);
      setShouldShowFragments(true);
    } catch (error) {
      console.error('Error in local text analysis:', error);
    }
  }, [value]);
  
  // Enhanced phrase detection function with priority assignments
  const identifyPhrases = useCallback((fragments: TextFragment[]) => {
    // Common problematic phrases that should get higher priority
    const wordyPhrases = [
      'in order to', 'due to the fact that', 'at this point in time', 
      'for the purpose of', 'in the event that', 'in spite of the fact that',
      'with regard to', 'in the process of'
    ];
    
    // Try to identify prepositional phrases (preposition + article/adjective? + noun)
    for (let i = 0; i < fragments.length - 2; i++) {
      if (
        fragments[i].partOfSpeech === 'preposition' &&
        (fragments[i+1].partOfSpeech === 'article' || fragments[i+1].partOfSpeech === 'adjective') &&
        fragments[i+2].partOfSpeech === 'noun'
      ) {
        // Mark this sequence as a phrase
        const startIndex = fragments[i].startIndex;
        const endIndex = fragments[i+2].endIndex;
        const phraseText = value.substring(startIndex, endIndex);
        
        // Check if this is a common wordy phrase (Priority 2)
        let priority: 1 | 2 | 3 = 3;
        let confidence = 0.6;
        
        if (wordyPhrases.some(wordyPhrase => 
            phraseText.toLowerCase().includes(wordyPhrase))) {
          priority = 2;
          confidence = 0.8;
        }
        
        // Create a new phrase fragment
        fragments.push({
          text: phraseText,
          startIndex,
          endIndex,
          type: 'phrase',
          partOfSpeech: 'prepositional phrase',
          priority,
          confidence
        });
      }
    }
    
    // Try to identify noun phrases (article/adjective + noun)
    for (let i = 0; i < fragments.length - 1; i++) {
      if (
        (fragments[i].partOfSpeech === 'article' || fragments[i].partOfSpeech === 'adjective') &&
        fragments[i+1].partOfSpeech === 'noun'
      ) {
        // Mark this sequence as a phrase
        const startIndex = fragments[i].startIndex;
        const endIndex = fragments[i+1].endIndex;
        
        // Create a new phrase fragment with priority 3 (minor - word choice)
        fragments.push({
          text: value.substring(startIndex, endIndex),
          startIndex,
          endIndex,
          type: 'phrase',
          partOfSpeech: 'noun phrase',
          priority: 3,
          confidence: 0.5
        });
      }
    }
    
    // Try to identify verb phrases (verb + adverb?)
    for (let i = 0; i < fragments.length - 1; i++) {
      if (
        fragments[i].partOfSpeech === 'verb' &&
        fragments[i+1].partOfSpeech === 'adverb'
      ) {
        // Mark this sequence as a phrase
        const startIndex = fragments[i].startIndex;
        const endIndex = fragments[i+1].endIndex;
        const phraseText = value.substring(startIndex, endIndex);
        
        // Check for passive voice (priority 2)
        let priority: 1 | 2 | 3 = 3;
        let confidence = 0.6;
        
        if (/\b(is|are|was|were|be|been|being)\s+\w+ed\b/i.test(phraseText)) {
          priority = 2; // Important (Priority 2): Style improvements
          confidence = 0.75;
        }
        
        // Create a new phrase fragment
        fragments.push({
          text: phraseText,
          startIndex,
          endIndex,
          type: 'phrase',
          partOfSpeech: 'verb phrase',
          priority,
          confidence
        });
      }
    }
    
    // Look for passive voice constructions across longer spans
    const passiveRegex = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
    let passiveMatch;
    while ((passiveMatch = passiveRegex.exec(value)) !== null) {
      fragments.push({
        text: passiveMatch[0],
        startIndex: passiveMatch.index,
        endIndex: passiveMatch.index + passiveMatch[0].length,
        type: 'phrase',
        partOfSpeech: 'passive voice',
        priority: 2,
        confidence: 0.8
      });
    }
  }, [value]);
  
  // Debounced analyze function to trigger after the user stops typing (3 seconds as per co-developer brief)
  const debouncedAnalyzeText = useDebouncedCallback(analyzeText, 3000, { // Fixed: Changed from 2000 to 3000
    // Configure maxWait to ensure the function is called eventually
    // even if the user keeps typing continuously
    maxWait: 6000, // Increased proportionally
    // Leading edge execution - ensures immediate response on first call
    leading: false,
    // Trailing edge execution - ensures execution after debounce period
    trailing: true
  });
  
  // Toggle functions
  const togglePOS = useCallback(() => {
    const newState = !posEnabled;
    if (onPosToggle) {
      onPosToggle(newState);
    } else {
      setInternalPosEnabled(newState);
    }
  }, [posEnabled, onPosToggle]);
  
  const toggleSuggestions = useCallback(() => {
    const newState = !suggestionsEnabled;
    if (onSuggestionsToggle) {
      onSuggestionsToggle(newState);
    } else {
      setInternalSuggestionsEnabled(newState);
    }
  }, [suggestionsEnabled, onSuggestionsToggle]);
  
  // Toggle fragments visibility
  const toggleFragmentsVisibility = useCallback(() => {
    setShouldShowFragments(prev => !prev);
  }, []);
  
  // Method to clear analysis state
  const clearAnalysis = useCallback(() => {
    setTextFragments([]);
    setShouldShowFragments(false);
    lastAnalyzedTextRef.current = '';
    setHighlightedHtml('');
  }, []);
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    applySuggestion: (suggestion: Suggestion) => {
      if (!textareaRef.current) return;
      
      // Use indices if available, otherwise try to find the text
      if (
        typeof suggestion.startIndex === 'number' &&
        typeof suggestion.endIndex === 'number' &&
        suggestion.startIndex >= 0 &&
        suggestion.endIndex >= suggestion.startIndex &&
        suggestion.endIndex <= value.length
      ) {
        const newText =
          value.substring(0, suggestion.startIndex) +
          suggestion.suggestion +
          value.substring(suggestion.endIndex);
        
        onChange(newText);
        
        // Clear text fragments and analysis to force a fresh analysis
        clearAnalysis();
        
        // Focus and set cursor position after the replacement
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = (suggestion.startIndex as number) + suggestion.suggestion.length;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      } else {
        // Try to find the text if no indices
        const index = value.indexOf(suggestion.original);
        if (index >= 0) {
          const newText =
            value.substring(0, index) +
            suggestion.suggestion +
            value.substring(index + suggestion.original.length);
          
          onChange(newText);
          
          // Clear text fragments and analysis to force a fresh analysis
          clearAnalysis();
          
          // Focus and set cursor position
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              const newCursorPos = index + suggestion.suggestion.length;
              textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          }, 0);
        }
      }
    },
    getElement: () => textareaRef.current,
    analyzeText, // Already returns Promise<void>
    toggleFragmentsVisibility,
    clearAnalysis: () => {
      setTextFragments([]);
      setShouldShowFragments(false);
      lastAnalyzedTextRef.current = '';
    },
    togglePOS,
    toggleSuggestions
  }));
  
  // Trigger analysis when user stops typing or when showFragments prop changes
  useEffect(() => {
    if (autoAnalyze && suggestionsEnabled) { // Only auto-analyze if suggestions are enabled
      debouncedAnalyzeText();
    }
    
    return () => {
      debouncedAnalyzeText.cancel();
    };
  }, [value, autoAnalyze, suggestionsEnabled, debouncedAnalyzeText]);
  
  // Sync with showFragments prop and ensure proper styling based on readOnly mode
  useEffect(() => {
    // Override fragment visibility if showFragments prop is provided
    setShouldShowFragments(showFragments);
    
    // For read-only mode (analysis view), perform analysis if we don't have fragments
    if (readOnly && showFragments && textFragments.length === 0 && value.trim() !== '') {
      performLocalAnalysis();
    }
  }, [showFragments, readOnly, value, textFragments.length, performLocalAnalysis]);
  
  // Update editor content and highlights
  useEffect(() => {
    if (!editorRef.current || !textareaRef.current) return;
    
  // Process the text content to add highlight markers
  let processedText = value;
  const highlightMarkers: Array<{ 
    index: number, 
    isStart: boolean, 
    class: string, 
    suggestion?: Suggestion,
    fragment?: TextFragment,
    attributes?: Record<string, string>,
    text?: string // Store actual text content
  }> = [];
  
  // Clear any previous rendered text
  if (editorRef.current) {
    const highlights = editorRef.current.querySelector('.editor-highlights');
    if (highlights) {
      // We'll rebuild all the highlights from scratch
      // No need to clear here as we'll set innerHTML later
    }
  }
    
    // Add text fragment highlights if analysis is active
    if (shouldShowFragments && textFragments.length > 0) {
      textFragments.forEach((fragment) => {
        // Skip whitespace for highlighting
        if (fragment.type === 'space') return;
        
        // Get the actual text content for this fragment
        const fragmentText = value.substring(fragment.startIndex, fragment.endIndex);
        
        // Determine style class based on fragment type
        let fragmentClass = '';
        const attributes: Record<string, string> = {
          'data-fragment-type': fragment.type,
          'data-start': fragment.startIndex.toString(),
          'data-end': fragment.endIndex.toString(),
          'data-text': encodeURIComponent(fragmentText) // Store the actual fragment text for better rendering
        };
        
        // Determine style class based on fragment type
        switch (fragment.type) {
          case 'word':
            fragmentClass = 'fragment-word';
            break;
          case 'phrase':
            fragmentClass = 'fragment-phrase';
            break;
          case 'punctuation':
            fragmentClass = 'fragment-punctuation';
            break;
          case 'paragraph':
            fragmentClass = 'fragment-paragraph';
            break;
        }
        
        // Add priority class if available (from co-developer brief)
        if (fragment.priority) {
          fragmentClass += ` priority-${fragment.priority}`;
          attributes['data-priority'] = fragment.priority.toString();
          
          // Add confidence score if available
          if (fragment.confidence) {
            attributes['data-confidence'] = fragment.confidence.toString();
          }
        }
        
        // Add POS highlighting only if enabled
        if (posEnabled && fragment.partOfSpeech) {
          fragmentClass += ` pos-${fragment.partOfSpeech.toLowerCase().replace(/\s+/g, '-')}`;
          attributes['data-pos'] = fragment.partOfSpeech;
        }
        
        highlightMarkers.push({
          index: fragment.startIndex,
          isStart: true,
          class: fragmentClass,
          fragment,
          attributes
        });
        
        highlightMarkers.push({
          index: fragment.endIndex,
          isStart: false,
          class: fragmentClass,
          fragment
        });
      });
    }
    
    // Add suggestion highlights only if suggestions are enabled
    if (suggestionsEnabled) {
      suggestions.forEach(suggestion => {
        if (typeof suggestion.startIndex === 'number' && typeof suggestion.endIndex === 'number') {
          const suggestionText = processedText.substring(suggestion.startIndex, suggestion.endIndex);
          highlightMarkers.push({
            index: suggestion.startIndex,
            isStart: true,
            class: `suggestion-${suggestion.type?.toLowerCase() || 'general'} suggestion-${suggestion.severity?.toLowerCase() || 'medium'}`,
            suggestion,
            text: suggestionText // Include the actual text
          });
          highlightMarkers.push({
            index: suggestion.endIndex,
            isStart: false,
            class: `suggestion-${suggestion.type?.toLowerCase() || 'general'} suggestion-${suggestion.severity?.toLowerCase() || 'medium'}`,
            suggestion
          });
        } else {
          // If no indices, try to find the suggestion text in the content
          const index = processedText.indexOf(suggestion.original);
          if (index >= 0) {
            highlightMarkers.push({
              index,
              isStart: true,
              class: `suggestion-${suggestion.type?.toLowerCase() || 'general'} suggestion-${suggestion.severity?.toLowerCase() || 'medium'}`,
              suggestion
            });