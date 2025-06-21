import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Suggestion } from './engie/types';
import { useDebouncedCallback } from 'use-debounce';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
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
}

const EnhancedEditor = forwardRef<EnhancedEditorRef, EnhancedEditorProps>(({
  value,
  onChange,
  suggestions,
  className = '',
  placeholder = 'Start writing...',
  // toneHighlights prop is received but local analysis results will be pushed up
  // suggestions prop is received for display, but local analysis results will be pushed up
  autoAnalyze = true,
  readOnly = false,
  showFragments = false,
  isAnalysisBox = false,
  reflectTextFrom = '',
  onSuggestionsFetched,
  onToneHighlightsFetched
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [textFragments, setTextFragments] = useState<TextFragment[]>([]);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  
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
  }, [value, textFragments]); // Removed assignPriorities and performLocalAnalysis from deps, they are imported now
  
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
  
  // Toggle fragments visibility
  const toggleFragmentsVisibility = useCallback(() => {
    setShouldShowFragments((prev: boolean) => !prev);
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
    clearAnalysis // Use the consistent implementation defined earlier
  }));
  
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
  }, [showFragments, readOnly, value, textFragments.length]); // performLocalAnalysis removed from deps
  
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
    if (toneHighlights && toneHighlights.length > 0) {
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
    // Reset the fragment display when user starts typing again
    if (shouldShowFragments) {
      setShouldShowFragments(false);
    }
  };
  
  const editorClass = `enhanced-editor ${className} ${isAnalyzingText ? 'is-analyzing' : ''} ${shouldShowFragments ? 'show-fragments' : ''}`;
  
  // Enhanced rendering with proper text placement
  return (
    <div className={editorClass}>
      <div
        ref={editorRef}
        className="editor-highlights"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        className={`editor-textarea ${readOnly ? 'read-only' : 'input-mode'}`}
        placeholder={placeholder}
        style={{ 
          opacity: readOnly ? '0' : '1', // Hide completely in read-only mode
          caretColor: 'currentColor' // Ensure cursor is visible
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
                
                // For input mode, make highlights fully transparent
                if (!readOnly && !showFragments) {
                  highlights.style.opacity = '0';
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
      />
      {isAnalyzingText && (
        <div className="editor-loading-indicator">
          <span className="loading-spinner"></span>
          <span className="loading-text">Analyzing text...</span>
        </div>
      )}
      {shouldShowFragments && (
        <div className="fragment-analysis-indicator">
          Text analysis active
        </div>
      )}
    </div>
  );
});

EnhancedEditor.displayName = 'EnhancedEditor';

export default EnhancedEditor;

// Removed global window interface extension
