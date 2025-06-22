import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Suggestion } from './engie/types';
import { useDebouncedCallback } from 'use-debounce';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import AnimatedEngieBot from './AnimatedEngieBot';
import EnhancedScanIndicator from './EnhancedScanIndicator';
import {
  TextFragment,
  assignPriorities,
  identifyPhrases, // identifyPhrases is used by performLocalAnalysis, so not directly called in EnhancedEditor usually
  performLocalAnalysis
} from '../lib/localTextAnalyzer';

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
  onSuggestionsFetched?: (suggestions: Suggestion[]) => void;
  onToneHighlightsFetched?: (toneHighlights: Array<{ startIndex: number; endIndex: number; tone: string; severity: string }>) => void;
}

export interface EnhancedEditorRef {
  focus: () => void;
  applySuggestion: (suggestion: Suggestion) => void;
  getElement: () => HTMLTextAreaElement | null;
  analyzeText: () => Promise<void>; // Updated to return Promise<void>
  toggleFragmentsVisibility: () => void;
  clearAnalysis: () => void; // Method to clear analysis
  undo: () => void;
  redo: () => void;
  toggleCountdownTimer: () => void; // Method to toggle the countdown timer visibility
}

// Import types at the top
interface TextHistory {
  text: string;
  cursorPosition: { start: number; end: number };
  scrollPosition: number;
}

const EnhancedEditor = forwardRef<EnhancedEditorRef, EnhancedEditorProps>((
  props: EnhancedEditorProps,
  ref
) => {
  const {
    value,
    onChange,
    suggestions,
    className = props.className || '',
    placeholder = props.placeholder || 'Start writing...',
    toneHighlights = props.toneHighlights || [],
    autoAnalyze = typeof props.autoAnalyze === 'boolean' ? props.autoAnalyze : true,
    readOnly = typeof props.readOnly === 'boolean' ? props.readOnly : false,
    showFragments = typeof props.showFragments === 'boolean' ? props.showFragments : false,
    isAnalysisBox = typeof props.isAnalysisBox === 'boolean' ? props.isAnalysisBox : false,
    reflectTextFrom = props.reflectTextFrom || '',
    onSuggestionsFetched,
    onToneHighlightsFetched
  } = props;

  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [textFragments, setTextFragments] = useState<TextFragment[]>([]);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  
  // Engie Bot animation states
  const [showEngieBot, setShowEngieBot] = useState(false);
  const [engieBotPosition, setEngieBotPosition] = useState({ top: 0, left: 0 });
  const [engieBotDirection, setEngieBotDirection] = useState<'left' | 'right'>('right');
  const [engieBotAnimationState, setEngieBotAnimationState] = useState<'idle' | 'walking'>('idle');
  const [engieBotEmotion, setEngieBotEmotion] = useState<'happy' | 'excited' | 'concerned' | 'thoughtful' | 'neutral'>('neutral');
  const [wordBeingChanged, setWordBeingChanged] = useState<string | null>(null);
  
  // Add history state for undo/redo functionality
  const [history, setHistory] = useState<TextHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const maxHistorySize = 50; // Limit history size
  const isUndoRedoOperation = useRef<boolean>(false);
  
  // Countdown timer states
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [showCountdownTimer, setShowCountdownTimer] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const activeTextAnalysisControllerRef = useRef<AbortController | null>(null); // Added Ref
  
  // Text analysis function with smart batching as per co-developer brief
  // Now returns a Promise that resolves when analysis completes
  const analyzeText = useCallback(() => {
    if (!value || value.trim() === '') {
      setTextFragments([]);
      setShouldShowFragments(false);
      return Promise.resolve(); // Return a resolved promise for empty text
    }
    
    if (textFragments.length > 0 && lastAnalyzedTextRef.current === value) {
      setShouldShowFragments(true);
      return Promise.resolve(); // Return a resolved promise for cached analysis
    }
    
    setIsAnalyzingText(true);

    // Cancel any existing request
    if (activeTextAnalysisControllerRef.current) {
      activeTextAnalysisControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeTextAnalysisControllerRef.current = controller; // Store the new controller
    const signal = controller.signal; // Use its signal
    
    const callPerformLocalAnalysis = () => {
      const { fragments: localFragments, shouldShowFragments: localShouldShow } = performLocalAnalysis(value);
      setTextFragments(localFragments);
      setShouldShowFragments(localShouldShow);
      lastAnalyzedTextRef.current = value; // Update lastAnalyzedTextRef after local analysis too
    };

    return new Promise<void>((resolve) => {
      try {
        fetch('/api/correct-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: value }),
          signal: signal
        })
          .then(response => {
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return response.json();
          })
          .then(data => {
            if (signal.aborted) return resolve();
            
            if (data && data.textAnalysis) {
              if (Array.isArray(data.textAnalysis.fragments)) {
                const prioritizedFragments = assignPriorities(data.textAnalysis.fragments, value);
                prioritizedFragments.sort((a, b) => {
                  const priorityDiff = (a.priority || 3) - (b.priority || 3);
                  if (priorityDiff !== 0) return priorityDiff;
                  if (a.confidence && b.confidence) return b.confidence - a.confidence;
                  return a.startIndex - b.startIndex;
                });
                setTextFragments(prioritizedFragments);
                setShouldShowFragments(true);
              } else {
                setTextFragments([]); // Clear fragments if not provided
              }

              if (onSuggestionsFetched && Array.isArray(data.textAnalysis.suggestions)) {
                onSuggestionsFetched(data.textAnalysis.suggestions);
              } else if (onSuggestionsFetched) {
                onSuggestionsFetched([]); // Clear suggestions if not provided
              }

              if (onToneHighlightsFetched && Array.isArray(data.textAnalysis.toneHighlights)) {
                onToneHighlightsFetched(data.textAnalysis.toneHighlights);
              } else if (onToneHighlightsFetched) {
                onToneHighlightsFetched([]); // Clear tone highlights if not provided
              }

              lastAnalyzedTextRef.current = value;
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('API response missing or malformed, falling back to local analysis for fragments and clearing suggestions/tone.');
              }
              callPerformLocalAnalysis(); // For fragments
              if (onSuggestionsFetched) onSuggestionsFetched([]);
              if (onToneHighlightsFetched) onToneHighlightsFetched([]);
            }
            resolve();
          })
          .catch(error => {
            if (signal.aborted) return resolve();
            if (error.name !== 'AbortError') {
              console.error('Error fetching text analysis:', error);
              callPerformLocalAnalysis(); // For fragments
              if (onSuggestionsFetched) onSuggestionsFetched([]);
              if (onToneHighlightsFetched) onToneHighlightsFetched([]);
            }
            resolve();
          })
          .finally(() => {
            if (signal.aborted) return; // If aborted by a new request, the new request's controller is already in the ref.
            setIsAnalyzingText(false);
            // Clear the ref only if this controller is still the active one
            // (i.e., it wasn't aborted by a newer request starting)
            if (activeTextAnalysisControllerRef.current === controller) {
              activeTextAnalysisControllerRef.current = null;
            }
          });
      } catch (error) {
        console.error('Error in analyzeText:', error);
        setIsAnalyzingText(false);
        callPerformLocalAnalysis();
        resolve();
      }
    });
  }, [value, textFragments, onSuggestionsFetched, onToneHighlightsFetched]);
  
  // assignPriorities, identifyPhrases, and performLocalAnalysis are now imported from ../lib/localTextAnalyzer.ts
  // Their definitions are removed from this file.
  
  // Debounced analyze function to trigger after the user stops typing (2 seconds as per co-developer brief)
  const debouncedAnalyzeText = useDebouncedCallback(analyzeText, 2000, {
    // Configure maxWait to ensure the function is called eventually
    // even if the user keeps typing continuously
    maxWait: 5000,
    // Leading edge execution - ensures immediate response on first call
    leading: false,
    // Trailing edge execution - ensures execution after debounce period
    trailing: true
  });
  
  // Set up automatic checking for typos and grammar issues every 3 seconds
  useEffect(() => {
    // Only apply regular monitoring for the input editor (not the analysis box)
    // and only when not in readOnly mode
    if (readOnly || isAnalysisBox) return;
    
    // Don't start timer if there's no text to analyze
    if (!value || value.trim() === '') return;
    
    // Don't analyze if we're already analyzing (prevents overlapping analysis)
    if (isAnalyzingText) return;
    
    // Reference to keep track of the interval
    const intervalId = setInterval(() => {
      // Skip if already analyzing or if the text hasn't changed since last analysis
      if (isAnalyzingText || lastAnalyzedTextRef.current === value) return;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Running scheduled grammar and typo check (3s interval)');
      }
      
      // Run the analysis
      analyzeText();
    }, 3000); // Check every 3 seconds
    
    // Clean up the interval when component unmounts or dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [value, isAnalyzingText, readOnly, isAnalysisBox, analyzeText]);
  
  // Toggle fragments visibility
  const toggleFragmentsVisibility = useCallback(() => {
    setShouldShowFragments(prev => !prev);
  }, []);
  
  // Function to save the current state to history
  const saveToHistory = useCallback((currentText: string) => {
    if (isUndoRedoOperation.current) {
      isUndoRedoOperation.current = false;
      return;
    }

    if (!textareaRef.current) return;
    
    const currentState: TextHistory = {
      text: currentText,
      cursorPosition: {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      },
      scrollPosition: textareaRef.current.scrollTop
    };

    // If we're not at the end of the history, truncate forward history
    if (historyIndex !== history.length - 1) {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, currentState]);
    } else {
      // Add new state and trim if exceeding max size
      const newHistory = [...history, currentState];
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      setHistory(newHistory);
    }
    
    setHistoryIndex(prev => Math.min(history.length, maxHistorySize - 1));
  }, [history, historyIndex, maxHistorySize]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0 && history.length > 1) {
      isUndoRedoOperation.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      
      const previousState = history[newIndex];
      onChange(previousState.text);
      
      // Restore cursor and scroll position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.scrollTop = previousState.scrollPosition;
          textareaRef.current.setSelectionRange(
            previousState.cursorPosition.start,
            previousState.cursorPosition.end
          );
        }
      }, 0);
    }
  }, [history, historyIndex, onChange]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoOperation.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      
      const nextState = history[newIndex];
      onChange(nextState.text);
      
      // Restore cursor and scroll position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.scrollTop = nextState.scrollPosition;
          textareaRef.current.setSelectionRange(
            nextState.cursorPosition.start,
            nextState.cursorPosition.end
          );
        }
      }, 0);
    }
  }, [history, historyIndex, onChange]);

  // Method to clear analysis state
  const clearAnalysis = useCallback(() => {
    setTextFragments([]);
    setShouldShowFragments(false);
    lastAnalyzedTextRef.current = '';
    setHighlightedHtml('');
  }, []);

  // Animate Engie bot going through the text changes word by word
  const animateEngieBotThroughChanges = useCallback((originalText: string, newText: string, startIndex: number) => {
    // Only animate if this is the analysis view (right side)
    if (!readOnly || !editorRef.current) return;
    
    const originalWords = originalText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    
    // If there are no words to animate through, don't show animation
    if (originalWords.length === 0 && newWords.length === 0) return;
    
    // Find the position where the text starts
    const getPositionFromIndex = (index: number) => {
      const highlightElement = editorRef.current?.querySelector('.editor-highlights') as HTMLElement;
      if (!highlightElement) return { top: 0, left: 0 };
      
      // Create a range to find the position
      const textContent = value;
      const range = document.createRange();
      
      // Create a temporary span to position at the desired index
      const tempSpan = document.createElement('span');
      tempSpan.style.display = 'inline';
      tempSpan.style.visibility = 'hidden';
      tempSpan.textContent = '';
      tempSpan.id = 'temp-position-span';
      
      // Find the element that contains the text at the given index
      const fragmentSpans = highlightElement.querySelectorAll('span[class*="fragment-"]');
      let targetElement: HTMLElement | null = null;
      let localOffset = 0;
      
      // Try to find the exact span containing our target index
      for (const span of Array.from(fragmentSpans)) {
        const spanElement = span as HTMLElement;
        const startAttr = spanElement.getAttribute('data-start');
        const endAttr = spanElement.getAttribute('data-end');
        
        if (startAttr && endAttr) {
          const spanStart = parseInt(startAttr, 10);
          const spanEnd = parseInt(endAttr, 10);
          
          if (spanStart <= index && index < spanEnd) {
            targetElement = spanElement;
            localOffset = index - spanStart;
            break;
          }
        }
      }
      
      // If we couldn't find a specific span, just use the container
      if (!targetElement) {
        targetElement = highlightElement;
        
        // Insert the temporary span at the start of the container
        targetElement.insertBefore(tempSpan, targetElement.firstChild);
      } else {
        // Found a specific element, now we need to find the exact position
        const textNode = targetElement.firstChild;
        
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            // If the offset is within the text node's length
            if (localOffset <= (textNode as Text).textContent!.length) {
              // Split the text node at the offset
              targetElement.insertBefore(tempSpan, (textNode as Text).splitText(localOffset));
            } else {
              // If offset is beyond the text length, just append it
              targetElement.appendChild(tempSpan);
            }
          } else {
          // No text node, just append it
          targetElement.appendChild(tempSpan);
        }
      }
      
      // Get the position of the span
      const rect = tempSpan.getBoundingClientRect();
      const highlightRect = highlightElement.getBoundingClientRect();
      
      // Calculate position relative to the highlight container
      const position = {
        top: rect.top - highlightRect.top + highlightElement.scrollTop,
        left: rect.left - highlightRect.left + highlightElement.scrollLeft
      };
      
      // Remove the temporary span
      tempSpan.remove();
      
      return position;
    };
    
    // Get the position where we should start the animation
    const startPosition = getPositionFromIndex(startIndex);
    
    // Determine the direction based on whether we're adding or removing text
    const direction = newText.length >= originalText.length ? 'right' : 'left';
    
    // Start the animation
    setEngieBotPosition(startPosition);
    setEngieBotDirection(direction);
    setEngieBotAnimationState('walking');
    setEngieBotEmotion(newText.length >= originalText.length ? 'excited' : 'thoughtful');
    setShowEngieBot(true);
    
    // Animate through each word with a delay
    let currentIndex = 0;
    const totalWords = Math.max(originalWords.length, newWords.length);
    
    const animateNextWord = () => {
      if (currentIndex >= totalWords) {
        // Animation complete
        setTimeout(() => {
          setEngieBotAnimationState('idle');
          setTimeout(() => {
            setShowEngieBot(false);
          }, 1000); // Hide Engie after 1 second of idle
        }, 500);
        return;
      }
      
      const currentWord = currentIndex < originalWords.length ? originalWords[currentIndex] : '';
      const newWord = currentIndex < newWords.length ? newWords[currentIndex] : '';
      
      // Highlight the word being changed
      setWordBeingChanged(currentWord || newWord);
      
      // Calculate position for the current word
      let wordPosition = { ...startPosition };
      
      // If we're beyond the first word, adjust position
      if (currentIndex > 0) {
        // Approximate position based on previous words
        const previousWordsLength = originalWords.slice(0, currentIndex).join(' ').length + currentIndex; // +currentIndex for spaces
        const wordStartIndex = startIndex + previousWordsLength;
        const calculatedPosition = getPositionFromIndex(wordStartIndex);
        
        // Only update if we got a valid position
        if (calculatedPosition.top > 0 || calculatedPosition.left > 0) {
          wordPosition = calculatedPosition;
        } else {
          // If we couldn't get exact position, approximate it
          wordPosition.left += (previousWordsLength * 8); // Approximate character width
        }
      }
      
      // Update Engie's position
      setEngieBotPosition(wordPosition);
      
      // Change Engie's emotion based on the word change
      if (currentWord && newWord) {
        setEngieBotEmotion(currentWord.length <= newWord.length ? 'excited' : 'thoughtful');
      } else if (currentWord && !newWord) {
        setEngieBotEmotion('concerned'); // Removing a word
      } else if (!currentWord && newWord) {
        setEngieBotEmotion('happy'); // Adding a new word
      }
      
      // Move to next word after a delay
      currentIndex++;
      setTimeout(animateNextWord, 800); // 800ms per word
    };
    
    // Start the animation
    animateNextWord();
    
  }, [readOnly, value, editorRef]);
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    applySuggestion: (suggestion: Suggestion) => {
      if (!textareaRef.current) return;
      
      // Save current scroll position and cursor position
      const scrollTop = textareaRef.current.scrollTop;
      const selectionStart = textareaRef.current.selectionStart;
      const selectionEnd = textareaRef.current.selectionEnd;
      const wasSelectionActive = selectionStart !== selectionEnd;
      
      // Get the current value and create a history point for undo/redo
      const currentValue = value;
      const originalText = suggestion.original;
      let startIndex = -1;
      let endIndex = -1;
      let newText = currentValue;

      // Use indices if available with validation
      if (
        typeof suggestion.startIndex === 'number' &&
        typeof suggestion.endIndex === 'number' &&
        suggestion.startIndex >= 0 &&
        suggestion.endIndex >= suggestion.startIndex &&
        suggestion.endIndex <= currentValue.length
      ) {
        startIndex = suggestion.startIndex;
        endIndex = suggestion.endIndex;
        
        // Double-check that text at these indices matches the suggestion's original text
        const textAtIndices = currentValue.substring(startIndex, endIndex);
        if (textAtIndices.toLowerCase() !== originalText.toLowerCase()) {
          // If case doesn't match but content does, use the indices anyway
          console.warn("Text case mismatch but proceeding with replacement");
        }
      } else {
        // If no indices or invalid indices, try exact match first
        startIndex = currentValue.indexOf(originalText);
        
        // If exact match fails, try case-insensitive match
        if (startIndex === -1) {
          const lowerValue = currentValue.toLowerCase();
          const lowerOriginal = originalText.toLowerCase();
          const lowerIndex = lowerValue.indexOf(lowerOriginal);
          
          if (lowerIndex !== -1) {
            startIndex = lowerIndex;
          }
        }
        
        if (startIndex !== -1) {
          endIndex = startIndex + originalText.length;
        }
      }
      
      // If we found a valid position for replacement
      if (startIndex !== -1 && endIndex !== -1) {
        const extractedOriginal = currentValue.substring(startIndex, endIndex);
        
        // Perform the replacement
        newText = 
          currentValue.substring(0, startIndex) +
          suggestion.suggestion +
          currentValue.substring(endIndex);
        
        // Calculate new cursor position
        const cursorOffset = suggestion.suggestion.length - (endIndex - startIndex);
        let newCursorPos = selectionStart;
        
        // Adjust cursor position based on whether it was before, in, or after the edit
        if (selectionStart > endIndex) {
          // Cursor was after the edit, adjust by the difference in length
          newCursorPos += cursorOffset;
        } else if (selectionStart >= startIndex && selectionStart <= endIndex) {
          // Cursor was inside the edit, place it at the end of the new text
          newCursorPos = startIndex + suggestion.suggestion.length;
        }
        // If cursor was before the edit, leave it unchanged
        
        // Apply the change and prepare for animation
        onChange(newText);
        
        // Animate Engie bot going through the changes if this is in read-only (analysis) mode
        if (readOnly) {
          animateEngieBotThroughChanges(extractedOriginal, suggestion.suggestion, startIndex);
        }
        
        // Clear text fragments and analysis to force a fresh analysis
        clearAnalysis();
        
        // Focus and restore cursor/selection position after state update
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.scrollTop = scrollTop; // Restore scroll position
            
            if (wasSelectionActive && selectionStart < startIndex && selectionEnd > endIndex) {
              // If there was a selection that encompassed the edit, adjust the end position
              textareaRef.current.setSelectionRange(selectionStart, selectionEnd + cursorOffset);
            } else {
              textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          }
        }, 0);
      } else {
        console.warn("Could not find the text to replace:", originalText);
      }
    },
    getElement: () => textareaRef.current,
    analyzeText: () => analyzeText(),
    toggleFragmentsVisibility: toggleFragmentsVisibility,
    clearAnalysis: clearAnalysis,
    undo: undo,
    redo: redo,
    toggleCountdownTimer: () => {
      setShowCountdownTimer(prev => !prev);
      // Additional logic for EnhancedScanIndicator could be added here if needed
    }
  }), [analyzeText, toggleFragmentsVisibility, clearAnalysis, undo, redo, animateEngieBotThroughChanges, onChange, readOnly, value]);
  
  // Trigger analysis when user stops typing or when showFragments prop changes
  useEffect(() => {
    if (autoAnalyze) {
      debouncedAnalyzeText();
    }
    
    return () => {
      debouncedAnalyzeText.cancel();
    };
  }, [value, autoAnalyze, debouncedAnalyzeText]);
  
  // Sync with showFragments prop and ensure proper styling based on readOnly mode
  useEffect(() => {
    // Override fragment visibility if showFragments prop is provided
    setShouldShowFragments(showFragments);
    
    // For read-only mode (analysis view), perform analysis if we don't have fragments
    if (readOnly && showFragments && textFragments.length === 0 && value.trim() !== '') {
      // Call the imported performLocalAnalysis and update state
      const { fragments: localFragments, shouldShowFragments: localShouldShow } = performLocalAnalysis(value);
      setTextFragments(localFragments);
      setShouldShowFragments(localShouldShow); // This will usually be true from performLocalAnalysis
      if (localFragments.length > 0) lastAnalyzedTextRef.current = value;
    }
  }, [showFragments, readOnly, value, textFragments.length]);
  
  // Update editor content and highlights
  useEffect(() => {
    if (!editorRef.current || !textareaRef.current) return;
    
    // Skip creating highlights for the input editor unless explicitly showing fragments
    if (!readOnly && !shouldShowFragments) {
      setHighlightedHtml(''); // Clear highlights for input editor
      return;
    }
    
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
      textFragments.forEach((fragment: TextFragment) => {
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
        
        if (fragment.partOfSpeech) {
          fragmentClass += ` pos-${fragment.partOfSpeech.toLowerCase()}`;
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
    
    // Add suggestion highlights
    suggestions.forEach((suggestion: Suggestion) => {
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
          highlightMarkers.push({
            index: index + suggestion.original.length,
            isStart: false,
            class: `suggestion-${suggestion.type?.toLowerCase() || 'general'} suggestion-${suggestion.severity?.toLowerCase() || 'medium'}`,
            suggestion
          });
        }
      }
    });
    
  // Add tone highlights
    if (toneHighlights && Array.isArray(toneHighlights) && toneHighlights.length > 0) {
      toneHighlights.forEach((tone: {
        startIndex: number;
        endIndex: number;
        tone: string;
        severity: string;
      }) => {
        highlightMarkers.push({
          index: tone.startIndex,
          isStart: true,
          class: `tone-highlight tone-${tone.tone?.toLowerCase() || 'neutral'} tone-${tone.severity?.toLowerCase() || 'medium'}`
        });
        highlightMarkers.push({
          index: tone.endIndex,
          isStart: false,
          class: `tone-highlight tone-${tone.tone?.toLowerCase() || 'neutral'} tone-${tone.severity?.toLowerCase() || 'medium'}`
        });
      });
    }
    
    // Sort markers by index
    highlightMarkers.sort((a, b) => {
      // Sort by index, with end tags coming before start tags at the same position
      if (a.index === b.index) {
        return a.isStart ? 1 : -1;
      }
      return a.index - b.index;
    });
    
    // Build HTML with highlight spans
    let html = '';
    let lastIndex = 0;
    let openTags: string[] = [];
    const fragmentTexts = new Map<number, {text: string, endIndex: number}>();
    
    // First pass: collect all fragment text
    highlightMarkers
      .filter(marker => marker.isStart && (marker.fragment || marker.suggestion))
      .forEach(marker => {
        if (marker.index >= 0 && marker.index <= processedText.length) {
          const endIndex = marker.fragment?.endIndex || 
                          (marker.suggestion?.endIndex || 
                           marker.index + (marker.suggestion?.original.length || 0));
          
          if (endIndex > marker.index) {
            const text = processedText.substring(marker.index, endIndex);
            fragmentTexts.set(marker.index, {text, endIndex});
          }
        }
      });
    
    // Second pass: build the HTML
    highlightMarkers.forEach(marker => {
      if (marker.index >= 0 && marker.index <= processedText.length) {
        // Add text since last marker
        if (!readOnly) {
          // For input box, we don't need the actual text in highlights
          html += processedText.substring(lastIndex, marker.index).replace(/\n/g, '<br>');
        } else if (lastIndex < marker.index && !fragmentTexts.has(lastIndex)) {
          // For analysis view, add text that's not part of any fragment
          const textToAdd = processedText.substring(lastIndex, marker.index);
          if (textToAdd.trim()) {
            // If this is plain text not in a fragment, wrap it in a default fragment
            html += `<span class="fragment-word default-fragment">${textToAdd.replace(/\n/g, '<br>')}</span>`;
          } else {
            html += textToAdd.replace(/\n/g, '<br>');
          }
        }
        lastIndex = marker.index;
        
        if (marker.isStart) {
          let attributesString = '';
          
          // Add suggestion-specific attributes
          if (marker.suggestion) {
            attributesString = ` data-id="${marker.suggestion.id}" data-suggestion="${encodeURIComponent(marker.suggestion.suggestion)}"`;
          }
          
          // Add fragment-specific attributes
          if (marker.attributes) {
            Object.entries(marker.attributes).forEach(([key, value]) => {
              attributesString += ` ${key}="${encodeURIComponent(value)}"`;
            });
          }
          
          // Start the span tag
          html += `<span class="${marker.class}"${attributesString}>`;
          
          // For analysis view, always add the text directly inside the span
          if (readOnly && fragmentTexts.has(marker.index)) {
            const fragmentInfo = fragmentTexts.get(marker.index);
            if (fragmentInfo) {
              // Ensure the text is safely rendered inside the span
              html += fragmentInfo.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
              lastIndex = fragmentInfo.endIndex; // Skip to end of this fragment
            }
          }
          
          openTags.push('</span>');
        } else {
          if (openTags.length > 0) {
            html += openTags.pop();
          }
        }
      }
    });
    
    // Add any remaining text
    html += processedText.substring(lastIndex).replace(/\n/g, '<br>');
    
    // Close any open tags
    while (openTags.length > 0) {
      html += openTags.pop();
    }
    
    // If empty, add placeholder
    if (!html.trim()) {
      html = `<span class="text-muted-foreground">${placeholder}</span>`;
    }
    
    setHighlightedHtml(html);
  }, [value, suggestions, toneHighlights, textFragments, shouldShowFragments, placeholder]);
  
  // Sync scroll position between textarea and highlight div
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlighter = editorRef.current;
    
    if (!textarea || !highlighter) return;
    
    const syncScroll = () => {
      highlighter.scrollTop = textarea.scrollTop;
      highlighter.scrollLeft = textarea.scrollLeft;
    };
    
    textarea.addEventListener('scroll', syncScroll);
    window.addEventListener('resize', syncScroll);
    
    return () => {
      textarea.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', syncScroll);
    };
  }, [readOnly]);
  
  // Ensure cursor remains visible and text boxes handle input properly
  useEffect(() => {
    // Find the text boxes and adjust their styles to ensure text remains visible
    const adjustTextBoxVisibility = () => {
      const editorHighlights = editorRef.current?.querySelector('.editor-highlights') as HTMLElement | null;
      const editorTextarea = textareaRef.current;
      
      if (!editorHighlights || !editorTextarea) return;
      
      // Synchronize exact position and dimensions
      const textareaRect = editorTextarea.getBoundingClientRect();
      editorHighlights.style.width = `${textareaRect.width}px`;
      editorHighlights.style.height = `${textareaRect.height}px`;
      
      // Ensure textarea has proper focus handling
      editorTextarea.addEventListener('focus', () => {
        if (editorRef.current) {
          editorRef.current.classList.add('textarea-focused');
          // Make textarea fully visible when focused
          editorTextarea.style.opacity = '0.9';
        }
      });
      
      editorTextarea.addEventListener('blur', () => {
        if (editorRef.current) {
          editorRef.current.classList.remove('textarea-focused');
          // Make textarea semi-transparent when not focused so highlight text shows through
          editorTextarea.style.opacity = '0.2';
        }
      });
      
      // Improve text visibility in highlight boxes
      const fragmentSpans = editorHighlights.querySelectorAll('span[class*="fragment-"]');
      fragmentSpans.forEach(span => {
        // Ensure text in the highlight matches text in the textarea
        const spanElement = span as HTMLElement;
        const startIndex = Number(spanElement.getAttribute('data-start'));
        const endIndex = Number(spanElement.getAttribute('data-end'));
        
        if (!isNaN(startIndex) && !isNaN(endIndex) && startIndex >= 0 && endIndex <= value.length) {
          // Get the text that should be inside this span
          const spanText = value.substring(startIndex, endIndex);
          // This ensures the text actually appears inside the highlight box
          spanElement.textContent = spanText;
          // This ensures that the text position in the highlight div perfectly matches the textarea
          spanElement.style.lineHeight = getComputedStyle(editorTextarea).lineHeight;
          spanElement.style.fontFamily = getComputedStyle(editorTextarea).fontFamily;
          spanElement.style.fontSize = getComputedStyle(editorTextarea).fontSize;
          spanElement.style.letterSpacing = getComputedStyle(editorTextarea).letterSpacing;
        }
      });
    };
    
    // Call once and add a resize listener
    adjustTextBoxVisibility();
    window.addEventListener('resize', adjustTextBoxVisibility);
    
    return () => {
      window.removeEventListener('resize', adjustTextBoxVisibility);
    };
  }, [value, shouldShowFragments, readOnly]);
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Set user typing state to true
    setIsUserTyping(true);
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a timeout to detect when user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
    }, 500); // 500ms delay to consider user stopped typing
    
    // Reset the fragment display when user starts typing again
    if (shouldShowFragments) {
      setShouldShowFragments(false);
    }
  };

  // Handle keyboard shortcuts for undo/redo
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Only handle shortcuts if not in read-only mode
    if (readOnly) return;
    
    // Handle Ctrl/Cmd+Z for Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    
    // Handle Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y for Redo
    if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) || 
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
      e.preventDefault();
      redo();
      return;
    }
  }, [readOnly, undo, redo]);

  // Modify the existing applySuggestion function to save history properly
  // Note: This edit is already applied separately with the replace_string_in_file tool

  // After applying a suggestion, save to history
  useEffect(() => {
    if (value && history.length > 0 && history[history.length - 1]?.text !== value) {
      saveToHistory(value);
    }
  }, [value, history, saveToHistory]);

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const editorClass = `enhanced-editor ${className} ${isAnalyzingText ? 'is-analyzing' : ''} ${shouldShowFragments ? 'show-fragments' : ''} ${readOnly ? 'analysis-view' : 'input-view'}`;

import ExportButton from './ExportButton'; // Added import

  // Enhanced rendering with proper text placement
  return (
    <div className={editorClass}>
      {!readOnly && !isAnalysisBox && value && value.trim().length > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
          <ExportButton content={value} />
        </div>
      )}
      <div
        ref={editorRef}
        className="editor-highlights"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        style={{
          // Only show highlights in readOnly mode or when fragments are explicitly shown
          // This ensures the left text box doesn't show any highlighting
          visibility: readOnly || shouldShowFragments ? 'visible' : 'hidden',
          opacity: readOnly || shouldShowFragments ? '1' : '0',
          display: (!readOnly && !shouldShowFragments) ? 'none' : 'block', // Don't even render in input mode
          position: 'relative' // Added to enable absolute positioning of Engie bot
        }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        className={`editor-textarea ${readOnly ? 'read-only' : 'input-mode'}`}
        placeholder={placeholder}
        style={{ 
          opacity: readOnly ? '0' : '1', // Hide completely in read-only mode
          caretColor: 'currentColor', // Ensure cursor is visible
          // Ensure text entry box is always fully opaque in input mode
          backgroundColor: readOnly ? 'transparent' : 'var(--background, #ffffff)'
        }}
        readOnly={readOnly}
        spellCheck={false} // We're handling our own error highlighting
        onFocus={() => {
          // Keep input box clean with no ghosting
          if (textareaRef.current && !readOnly) {
            textareaRef.current.style.opacity = '1';
            
            // Ensure the highlight div doesn't interfere with editing
            if (editorRef.current) {
              const highlights = editorRef.current.querySelector('.editor-highlights') as HTMLElement;
              if (highlights) {
                highlights.style.pointerEvents = 'none';
                
                // For input mode, make highlights fully transparent and invisible
                if (!readOnly && !showFragments) {
                  highlights.style.opacity = '0';
                  highlights.style.visibility = 'hidden';
                }
              }
            }
          }
        }}
        onBlur={() => {
          // Keep input box clean with no ghosting
          if (textareaRef.current && !readOnly) {
            textareaRef.current.style.opacity = '1';
          }
        }}
        onKeyUp={() => {
          // Ensure text boxes and cursor stay aligned on text input
          const textarea = textareaRef.current;
          const highlights = editorRef.current?.querySelector('.editor-highlights') as HTMLElement;
          if (textarea && highlights) {
            // Synchronize scroll position to ensure alignment
            highlights.scrollTop = textarea.scrollTop;
            highlights.scrollLeft = textarea.scrollLeft;
            
            // Force update of fragments after typing
            setTimeout(() => {
              const fragmentSpans = highlights.querySelectorAll('span[class*="fragment-"]');
              fragmentSpans.forEach(span => {
                const spanElement = span as HTMLElement;
                const startIndex = Number(spanElement.getAttribute('data-start'));
                const endIndex = Number(spanElement.getAttribute('data-end'));
                
                if (!isNaN(startIndex) && !isNaN(endIndex) && startIndex >= 0 && endIndex <= value.length) {
                  // Update the text content of each span
                  const spanText = value.substring(startIndex, endIndex);
                  spanElement.textContent = spanText;
                }
              });
            }, 10);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      
      {/* Enhanced Scan Indicator - only show in the main editor, not analysis box */}
      {!isAnalysisBox && !readOnly && autoAnalyze && showCountdownTimer && value.trim().length > 0 && (
        <EnhancedScanIndicator 
          scanInterval={3}
          isTyping={isUserTyping}
          isAnalyzing={isAnalyzingText}
          isProcessing={isAnalyzingText}
          suggestionCount={suggestions.length}
          onScanNow={() => {
            // Trigger immediate scan
            if (activeTextAnalysisControllerRef.current) {
              activeTextAnalysisControllerRef.current.abort();
            }
            analyzeText();
          }}
          onToggleAutoScan={(enabled) => {
            // Handle auto scan toggle here
            if (!enabled && inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
              inactivityTimerRef.current = null;
            }
          }}
          onIntervalChange={(seconds) => {
            // Handle interval change here
            console.log(`Scan interval changed to ${seconds} seconds`);
            // This would typically update a configuration setting
          }}
        />
      )}

      {/* AnimatedEngieBot area */}
      {/* AnimatedEngieBot area - only shown in read-only (analysis) mode when applying suggestions */}
      {showEngieBot && readOnly && (
        <div 
          className="engie-bot-animation-layer" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          {/* Word being changed highlight */}
          {wordBeingChanged && (
            <div 
              className="word-highlight-animation"
              style={{
                position: 'absolute',
                top: engieBotPosition.top - 5,
                left: engieBotPosition.left,
                backgroundColor: 'rgba(255, 217, 102, 0.5)',
                borderRadius: '3px',
                padding: '0 2px',
                zIndex: 5,
                pointerEvents: 'none',
                animation: 'pulse 1s infinite alternate'
              }}
            >
              {wordBeingChanged}
            </div>
          )}
          
          {/* Engie Bot */}
          <div 
            className="engie-bot-container"
            style={{
              position: 'absolute',
              top: engieBotPosition.top - 40, // Position above the text
              left: engieBotPosition.left,
              transition: 'all 0.5s ease-in-out',
              transform: 'scale(0.6)', // Make Engie smaller to fit in the editor
              transformOrigin: 'bottom center',
              zIndex: 10
            }}
          >
            <AnimatedEngieBot 
              animationState={engieBotAnimationState} 
              speed="normal" 
              direction={engieBotDirection}
              emotion={engieBotEmotion}
            />
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedEditor.displayName = 'EnhancedEditor';

export default EnhancedEditor;

// Removed global window interface extension
