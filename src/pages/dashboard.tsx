import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { 
  ClipboardPaste, 
  FileUp, 
  Share2, 
  Sparkles, 
  FilePlus, 
  Menu, 
  Save, 
  Trash2, 
  Edit,
  LayoutGrid,
  Pen,
  Book,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  BarChart2,
  Type,
  Text,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignJustify,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import Header from '@/components/Header';
import Engie from '@/components/Engie';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/hooks/use-media-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import EnhancedEditor, { EnhancedEditorRef } from '@/components/EnhancedEditor';

// Type definitions
interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
  startIndex?: number;
  endIndex?: number;
}

interface ToneHighlight {
  startIndex: number;
  endIndex: number;
  tone: string;
  severity: string;
}

interface TextFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'word' | 'phrase' | 'punctuation' | 'space' | 'paragraph';
  partOfSpeech?: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
}

// Helper function to escape strings for use in a regular expression
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const FONT_OPTIONS = [
  { label: 'Serif', value: 'serif', className: 'font-serif' },
  { label: 'Sans', value: 'sans', className: 'font-sans' },
  { label: 'Mono', value: 'mono', className: 'font-mono' },
];
const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0];
const FONT_SIZES = [16, 18, 20, 22, 24];
const TEXT_WIDTHS = ["40ch", "60ch", "80ch", "100ch"];

export const applySuggestionLogic = (
  currentText: string,
  suggestionToApply: Suggestion,
  setText: (newText: string) => void,
  setSuggestions: (updater: (currentSuggestions: Suggestion[]) => Suggestion[]) => void,
  activeDocument: Document | null,
  debouncedUpdateDocument: (docId: string, data: { content?: string }) => void,
  editorRef?: React.RefObject<EnhancedEditorRef>
) => {
  console.log("Original text:", currentText);
  console.log("Suggestion to apply (original):", suggestionToApply.original);
  console.log("Suggestion to apply (suggestion):", suggestionToApply.suggestion);
  console.log("Suggestion indices:", suggestionToApply.startIndex, suggestionToApply.endIndex);

  // Use the enhanced editor's applySuggestion method if available
  if (editorRef?.current) {
    console.log("Using EnhancedEditor to apply suggestion");
    editorRef.current.applySuggestion(suggestionToApply);
    
    // Remove the suggestion from the list
    setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionToApply.id));
    
    // Update the document if needed
    if (activeDocument) {
      // The editor will call onChange which will update the text and trigger debouncedUpdateDocument
    }
    return;
  }

  // Fallback to the original logic
  if (suggestionToApply.original === "" && (suggestionToApply.startIndex === undefined || suggestionToApply.endIndex === undefined)) {
    // If original is empty AND we don't have indices, it's ambiguous.
    // If original is empty but we DO have indices, it means "insert suggestion at this point".
    console.error("Error: suggestionToApply.original is empty and no start/end indices provided. Skipping replacement.");
    return;
  }

  let newText = currentText;

  if (
    typeof suggestionToApply.startIndex === 'number' &&
    typeof suggestionToApply.endIndex === 'number' &&
    suggestionToApply.startIndex >= 0 &&
    suggestionToApply.endIndex >= suggestionToApply.startIndex &&
    suggestionToApply.endIndex <= currentText.length
  ) {
    // Prioritize using startIndex and endIndex if available and valid
    newText =
      currentText.substring(0, suggestionToApply.startIndex) +
      suggestionToApply.suggestion +
      currentText.substring(suggestionToApply.endIndex);
    console.log("Applied suggestion using start/end indices.");
  } else {
    // Try to find the original text in the content
    const index = currentText.indexOf(suggestionToApply.original);
    if (index >= 0) {
      // We found the exact text to replace
      newText =
        currentText.substring(0, index) +
        suggestionToApply.suggestion +
        currentText.substring(index + suggestionToApply.original.length);
      
      // Update the suggestion with the correct indices for future use
      suggestionToApply.startIndex = index;
      suggestionToApply.endIndex = index + suggestionToApply.original.length;
      
      console.log("Applied suggestion by finding original text at index:", index);
    } else {
      // Couldn't find the exact text, use simple replace as last resort
      // This replaces only the first occurrence
      if (suggestionToApply.original === "") {
        console.error("Error: suggestionToApply.original is empty and could not be found in text. Skipping replacement.");
        return;
      }
      newText = currentText.replace(suggestionToApply.original, suggestionToApply.suggestion);
      console.log("Applied suggestion using string replace (first occurrence).");
    }
  }

  console.log("New text after replacement:", newText);

  setText(newText);
  setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionToApply.id));

  if (activeDocument) {
    debouncedUpdateDocument(activeDocument.id, { content: newText });
  }
};

const DashboardPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const editorRef = useRef<EnhancedEditorRef>(null);
  const analysisEditorRef = useRef<EnhancedEditorRef>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [text, setText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [toneHighlights, setToneHighlights] = useState<ToneHighlight[]>([]);
  const [textFragments, setTextFragments] = useState<TextFragment[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState<boolean>(true);
  const [autoFragmentAnalysis, setAutoFragmentAnalysis] = useState<boolean>(true);
  const lastAnalyzedTextRef = useRef<string>('');

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // For document sidebar
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState<boolean>(false); // For AI assistant sidebar
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarView, setSidebarView] = useState<'documents' | 'suggestions'>('documents');

  const [font, setFont] = useState('serif');
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [textWidth, setTextWidth] = useState('60ch');
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selection, setSelection] = useState<{start: number, end: number} | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [writingGoal, setWritingGoal] = useState(1000);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showAnalysisSettings, setShowAnalysisSettings] = useState(false);

  // New document state
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Engie Idea Corner state
  const [showIdeaCorner, setShowIdeaCorner] = useState(false);
  const [engieIdea, setEngieIdea] = useState<string | null>(null);
  const [engieHasNewIdea, setEngieHasNewIdea] = useState(false);

  // Fetch User
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const docs = await response.json();
      setDocuments(docs || []);
      if (docs.length > 0 && !activeDocument) {
        // Automatically select the first document if none is active
        // setActiveDocument(docs[0]);
        // setText(docs[0].content);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not fetch documents.", variant: "destructive" });
    }
  }, [toast, activeDocument]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  // Document Management
  const debouncedUpdateDocument = useDebouncedCallback(async (docId: string, data: { title?: string, content?: string }) => {
    try {
      setAutoSaveState('saving');
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update document');
      
      setAutoSaveState('saved');
      fetchDocuments(); // Refresh list on update
    } catch (error) {
      console.error('Failed to update document:', error);
      setAutoSaveState('error');
    }
  }, 1500);

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // Trigger analysis whenever text changes to update the analysis view
    if (analysisEditorRef.current && autoFragmentAnalysis) {
      // Use a short delay to ensure the analysis view updates
      setTimeout(() => {
        analysisEditorRef.current?.analyzeText();
      }, 100);
    }
    
    if (activeDocument) {
      setAutoSaveState('saving');
      debouncedUpdateDocument(activeDocument.id, { content: newText });
    }
  };

  const handleTitleSave = () => {
    if (activeDocument && newTitle.trim()) {
      debouncedUpdateDocument(activeDocument.id, { title: newTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleCreateDocument = async () => {
    setCreatingDoc(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDocTitle || 'Untitled Document', content: '' }),
      });
      if (!response.ok) throw new Error('Failed to create document');
      const newDoc = await response.json();
      await fetchDocuments();
      setActiveDocument(newDoc);
      setText(newDoc.content);
      setShowNewDocModal(false);
      setNewDocTitle('');
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not create a new document.", variant: "destructive" });
    } finally {
      setCreatingDoc(false);
    }
  };
  
  const handleSelectDocument = (doc: Document) => {
    setActiveDocument(doc);
    setText(doc.content);
    setSuggestions([]);
    setToneHighlights([]);
    setTextFragments([]);
    lastAnalyzedTextRef.current = doc.content;
  };
  
  // Engie Suggestions Logic
  const debouncedCheckText = useDebouncedCallback(async (currentText: string) => {
    if (lastAnalyzedTextRef.current === currentText || !currentText.trim()) return;
    lastAnalyzedTextRef.current = currentText;
    
    setIsSuggestionsLoading(true);
    
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText }),
      });
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      
      // Process suggestions to add indices if not present
      const processedSuggestions = data.suggestions.map((suggestion: Suggestion) => {
        if (suggestion.startIndex === undefined || suggestion.endIndex === undefined) {
          const index = currentText.indexOf(suggestion.original);
          if (index >= 0) {
            suggestion.startIndex = index;
            suggestion.endIndex = index + suggestion.original.length;
          }
        }
        return suggestion;
      });
      
      setSuggestions(processedSuggestions || []);
      
      // Process tone highlights if available
      if (data.toneAnalysis && data.toneAnalysis.highlightedSentences) {
        const newToneHighlights = data.toneAnalysis.highlightedSentences
          .map((highlight: any) => {
            // Find each sentence in the text to get its indices
            const index = currentText.indexOf(highlight.sentence);
            if (index >= 0) {
              return {
                startIndex: index,
                endIndex: index + highlight.sentence.length,
                tone: highlight.tone,
                severity: highlight.score > 0.7 ? 'high' : highlight.score > 0.4 ? 'medium' : 'low'
              };
            }
            return null;
          })
          .filter(Boolean);
        
        setToneHighlights(newToneHighlights);
      }
      
      // Process text fragments if available
      if (data.textAnalysis && data.textAnalysis.fragments) {
        setTextFragments(data.textAnalysis.fragments);
        // Trigger the editor to show fragments
        if (editorRef.current && autoFragmentAnalysis) {
          setTimeout(() => {
            editorRef.current?.analyzeText();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Failed to get suggestions', error);
      toast({ title: "Error", description: "Could not check text for suggestions.", variant: "destructive" });
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, 2000); // 2 seconds as per co-developer brief

  useEffect(() => {
    if (activeDocument) {
      debouncedCheckText(text);
    }
  }, [text, activeDocument, debouncedCheckText]);

  useEffect(() => {
    console.log('Dashboard state update:', {
      hasActiveDocument: !!activeDocument,
      suggestionsCount: suggestions.length,
      documentsCount: documents.length,
      toneHighlightsCount: toneHighlights.length,
      fragmentsCount: textFragments.length
    });
  }, [activeDocument, suggestions, documents, toneHighlights, textFragments]);

  const applySuggestion = (suggestionToApply: Suggestion) => {
    console.log("Applying suggestion via Engie:", suggestionToApply);
    
    // Apply the suggestion to the input editor
    applySuggestionLogic(
      text, 
      suggestionToApply, 
      setText, 
      setSuggestions, 
      activeDocument, 
      debouncedUpdateDocument,
      editorRef
    );
    
    // Clear analysis from analysis editor
    if (analysisEditorRef.current) {
      analysisEditorRef.current.clearAnalysis();
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionId));
  };

  // Manual text analysis
  const handleAnalyzeText = () => {
    // Analyze in both editors to ensure they stay in sync
    if (editorRef.current) {
      editorRef.current.analyzeText();
    }
    
    if (analysisEditorRef.current) {
      analysisEditorRef.current.analyzeText();
      // Always show fragments in analysis view
      setTimeout(() => {
        analysisEditorRef.current?.toggleFragmentsVisibility();
      }, 100);
    }
  };
  
  // Keep analysis view in sync with input text
  useEffect(() => {
    if (analysisEditorRef.current && editorRef.current) {
      // Ensure fragments are always shown in analysis view
      analysisEditorRef.current.analyzeText();
      
      // Handle any pending suggestions
      if (suggestions.length > 0) {
        // Force fragment display
        setTimeout(() => {
          analysisEditorRef.current?.toggleFragmentsVisibility();
        }, 200);
      }
    }
  }, [text, suggestions, toneHighlights]);

  if (!user) return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;

  const sidebarComponent = (
    <Sidebar 
      documents={documents}
      activeDocument={activeDocument}
      onSelectDocument={handleSelectDocument}
      onCreateDocument={() => setShowNewDocModal(true)}
    />
  );

  const headerComponent = (
    <DashboardHeader userName={user.email} userEmail={user.email} />
  );
  
  return (
    <>
      <DashboardLayout sidebar={sidebarComponent} header={headerComponent}>
        <div className="p-4 sm:p-8 relative">
        {!activeDocument ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold">My Documents</h1>
              <Button className="premium-button-gradient hidden sm:flex" onClick={() => setShowNewDocModal(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {documents.map(doc => (
                <Card key={doc.id} className="premium-document-card cursor-pointer" onClick={() => handleSelectDocument(doc)}>
                  <CardHeader>
                    <CardTitle className="truncate">{doc.title}</CardTitle>
                    <CardDescription>{new Date(doc.updatedAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent><p className="line-clamp-3 text-sm text-muted-foreground">{doc.content?.substring(0, 100) || "No content"}</p></CardContent>
                </Card>
              ))}
              <Card className="flex items-center justify-center border-2 border-dashed rounded-xl premium-document-card bg-muted/50 hover:border-primary transition-colors min-h-[180px]" onClick={() => setShowNewDocModal(true)}>
                 <Button variant="ghost" className="text-muted-foreground"><FilePlus className="mr-2 h-4 w-4" />New Document</Button>
              </Card>
            </div>
          </div>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setActiveDocument(null)} className="mb-4 -ml-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Documents</Button>
            <div className="flex items-center gap-2 mb-4">
              {isEditingTitle ? (
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={e => e.key === 'Enter' && handleTitleSave()} autoFocus />
              ) : (
                <h2 className="text-2xl sm:text-3xl font-bold" onClick={() => {setIsEditingTitle(true); setNewTitle(activeDocument.title)}}>{activeDocument.title}</h2>
              )}
              {autoSaveState === 'saving' && (
                <Badge variant="outline" className="ml-2">Saving...</Badge>
              )}
              {autoSaveState === 'saved' && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Saved</Badge>
              )}
              {autoSaveState === 'error' && (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">Error saving</Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant={showAnalysisSettings ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowAnalysisSettings(!showAnalysisSettings)}
                className="transition-all"
              >
                <Sparkles className={`h-4 w-4 mr-1 ${showAnalysisSettings ? "text-primary" : ""}`} />
                Text Analysis {showAnalysisSettings ? 'Settings' : ''}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAnalyzeText}
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900"
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                Analyze Now
              </Button>
              
              {autoFragmentAnalysis && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Auto-Analysis On
                </Badge>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => editorRef.current?.toggleFragmentsVisibility()}
                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:text-purple-800 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900"
              >
                <Text className="h-4 w-4 mr-1" />
                Toggle Highlights
              </Button>
            </div>
            
            {showAnalysisSettings && (
              <Card className="mb-4 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-medium">Auto Fragment Analysis</div>
                  <Switch
                    checked={autoFragmentAnalysis}
                    onCheckedChange={setAutoFragmentAnalysis}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  When enabled, text will be automatically analyzed after 2 seconds of inactivity. 
                  Words, phrases, and punctuation will be highlighted with color-coded boxes, making it easier 
                  to identify different parts of your writing. Items are prioritized based on their importance.
                </p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Fragment Types:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <div className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded border border-blue-200">
                      <span className="font-semibold">Word</span> - Individual words
                    </div>
                    <div className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded border border-green-200">
                      <span className="font-semibold">Phrase</span> - Word groups
                    </div>
                    <div className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded border border-purple-200">
                      <span className="font-semibold">Punctuation</span> - Marks
                    </div>
                    <div className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs rounded border border-orange-200">
                      <span className="font-semibold">Part of Speech</span> - Roles
                    </div>
                  </div>
                  
                  <h4 className="text-sm font-medium mb-2">Priority Levels:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <div className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded border-2 border-red-500 flex items-center">
                      <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                      <span className="font-semibold">Priority 1</span> - Grammar, spelling
                    </div>
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded border border-yellow-400 flex items-center">
                      <span className="h-2 w-2 bg-yellow-500 rounded-full mr-1"></span>
                      <span className="font-semibold">Priority 2</span> - Style, clarity
                    </div>
                    <div className="px-2 py-1 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded border border-blue-300 opacity-80 flex items-center">
                      <span className="h-2 w-2 bg-blue-500 rounded-full mr-1"></span>
                      <span className="font-semibold">Priority 3</span> - Word choice, tone
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">noun</div>
                  <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100">verb</div>
                  <div className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">adjective</div>
                  <div className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">adverb</div>
                  <div className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100">preposition</div>
                  <div className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded border border-teal-100">conjunction</div>
                  <div className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-100">article</div>
                </div>
                
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAnalyzeText}>
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Analyze Now
                  </Button>
                </div>
              </Card>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {/* Analysis Display Box - Shows analyzed text with tone highlights */}
              <Card className="shadow-md bg-slate-50 dark:bg-slate-900">
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-medium">Analysis View</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Text with analysis highlights
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-normal">
                      Read-only
                    </Badge>
                  </div>
                </CardHeader>
                <div className="p-4 pt-0 min-h-[200px] max-h-[300px] overflow-auto">
                  <EnhancedEditor 
                    ref={analysisEditorRef}
                    value={text}
                    onChange={() => {}} // Read-only
                    suggestions={suggestions}
                    toneHighlights={toneHighlights}
                    autoAnalyze={autoFragmentAnalysis}
                    className="analysis-view h-full text-base sm:text-lg border-0 p-2 rounded-xl focus-visible:ring-0 bg-slate-50 dark:bg-slate-900"
                    placeholder="Your analyzed text will appear here..." 
                    readOnly={true}
                    showFragments={true} // Always show fragments in analysis view
                  />
                </div>
              </Card>
              
              {/* Input Box - Where user types */}
              <Card className="shadow-lg">
                <CardHeader className="py-2 px-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-sm font-medium">Write Here</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Type your text in this box
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Pen className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Type here - analysis will appear above</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <div className="min-h-[calc(100vh-550px)] space-y-4">
                  {/* Analysis Editor (Read-only) */}
                  <Card>
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Text Analysis View</CardTitle>
                        <Badge variant="outline">Auto-updates every 3 seconds</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <EnhancedEditor 
                        ref={analysisEditorRef}
                        value={text} 
                        onChange={(val) => {/* Read-only - no changes */}} 
                        suggestions={suggestions}
                        toneHighlights={toneHighlights}
                        autoAnalyze={true}
                        readOnly={true}
                        className="analysis-editor h-40 text-base sm:text-lg border rounded-xl focus-visible:ring-0 bg-muted/30" 
                        placeholder="Analysis will appear here..." 
                        showFragments={true}
                        isAnalysisBox={true}
                        reflectTextFrom={text}
                      />
                    </CardContent>
                  </Card>
                
                  {/* Input Editor (Editable) */}
                  <Card>
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Input Text</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Pen className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Type here to edit your text</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <EnhancedEditor 
                        ref={editorRef}
                        value={text} 
                        onChange={handleTextChange} 
                        suggestions={[]} // No highlighting in the input box
                        toneHighlights={[]}
                        autoAnalyze={false} // We'll manually sync with the analysis view
                        className="main-editor-textarea h-40 text-base sm:text-lg border rounded-xl focus-visible:ring-0 bg-background" 
                        placeholder="Start writing your masterpiece..." 
                        showFragments={false} // Never show fragments in the input box
                      />
                    </CardContent>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      </DashboardLayout>
      
      {/* Engie is now always visible, regardless of document state */}
      <Engie
        suggestions={suggestions}
        onApply={applySuggestion}
        onDismiss={dismissSuggestion}
        onIdeate={() => {}}
        targetEditorSelector=".main-editor-textarea" // Target the input box
        documents={documents.map(d => ({ id: d.id, title: d.title }))}
      />
      
      <Dialog open={showNewDocModal} onOpenChange={setShowNewDocModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Document</DialogTitle></DialogHeader>
          <Input placeholder="Enter document title" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateDocument()} />
          <DialogFooter>
            <Button onClick={() => setShowNewDocModal(false)} variant="ghost">Cancel</Button>
            <Button onClick={handleCreateDocument} disabled={creatingDoc}>{creatingDoc ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPage;