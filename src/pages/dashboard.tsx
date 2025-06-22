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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { useMediaQuery } from '@/hooks/use-media-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import EnhancedEditor, { EnhancedEditorRef } from '@/components/EnhancedEditor';
import ClientEngie from '@/components/ClientEngie';
import InteractiveOnboarding from '@/components/InteractiveOnboarding';

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

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const applySuggestionLogic = (
  suggestionToApply: Suggestion,
  setSuggestions: (updater: (currentSuggestions: Suggestion[]) => Suggestion[]) => void,
  editorRef?: React.RefObject<EnhancedEditorRef>
  // Parameters currentText, setText, activeDocument, and debouncedUpdateDocument removed
  // as their functionality is now handled via EnhancedEditor's onChange -> handleTextChange
) => {
  if (process.env.NODE_ENV === 'development') {
    console.log("Applying suggestion (ID):", suggestionToApply.id);
    console.log("Suggestion to apply (original):", suggestionToApply.original);
    console.log("Suggestion to apply (suggestion):", suggestionToApply.suggestion);
  }

  if (editorRef?.current) {
    if (process.env.NODE_ENV === 'development') {
      console.log("Using EnhancedEditor to apply suggestion via editorRef");
    }
    editorRef.current.applySuggestion(suggestionToApply);
    
    // Remove the suggestion from the list after attempting to apply it via editor
    // The editor's onChange will handle setText and debouncedUpdateDocument.
    setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionToApply.id));
  } else {
    // If editorRef is not available, log an error.
    // The primary mechanism for text update is through the editor.
    console.error("Error: editorRef is not available in applySuggestionLogic. Cannot apply suggestion.");
    // Optionally, you could still filter the suggestion if desired,
    // but the text itself won't be updated.
    // setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionToApply.id));
  }
  // No direct calls to setText or debouncedUpdateDocument here.
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
  const [autoSaveState, setAutoSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true); // Added loading state
  const [showDocumentHistory, setShowDocumentHistory] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoFragmentAnalysis, setAutoFragmentAnalysis] = useState(true); // Default to true
  const [showParts, setShowParts] = useState(false); // Default to false
  // Interactive onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Grok mode state and timer
  const [grokMode, setGrokMode] = useState(false);
  const [grokPowerRemaining, setGrokPowerRemaining] = useState(0); // seconds
  const grokTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Handle grok mode toggle
  const handleGrokToggle = () => {
    if (!grokMode) {
      setGrokMode(true);
      setGrokPowerRemaining(600); // 10 minutes
    } else {
      setGrokMode(false);
      setGrokPowerRemaining(0);
    }
  };

  // Grok timer effect
  useEffect(() => {
    if (grokMode && grokPowerRemaining > 0) {
      grokTimerRef.current = setInterval(() => {
        setGrokPowerRemaining(prev => {
          if (prev <= 1) {
            setGrokMode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!grokMode || grokPowerRemaining === 0) {
      if (grokTimerRef.current) {
        clearInterval(grokTimerRef.current);
        grokTimerRef.current = null;
      }
    }
    return () => {
      if (grokTimerRef.current) {
        clearInterval(grokTimerRef.current);
        grokTimerRef.current = null;
      }
    };
  }, [grokMode, grokPowerRemaining]);
  
  // Load preferences from localStorage only on client-side
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      // Load auto fragment analysis preference
      const savedAutoAnalysis = localStorage.getItem('autoFragmentAnalysis');
      if (savedAutoAnalysis !== null) {
        setAutoFragmentAnalysis(savedAutoAnalysis === 'true');
      }
      
      // Load show parts preference
      const savedShowParts = localStorage.getItem('showParts');
      if (savedShowParts !== null) {
        setShowParts(savedShowParts === 'true');
      }

      // Check if user has completed onboarding
      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      if (!hasCompletedOnboarding) {
        // Show onboarding for new users, but wait for documents to load
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDocumentSelected = activeDocument !== null;
  
  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch documents and parse error.' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const fetchedDocuments = await response.json();
        setDocuments(fetchedDocuments);
      } catch (error: any) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error Fetching Documents',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
        setDocuments([]); // Clear documents or handle as per desired UX
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [toast]); // Added toast to dependency array

  // Debounced document update
  const debouncedUpdateDocument = useCallback(
    async (docId: string, data: { content?: string; title?: string }) => {
      if (!docId) return; // Should not happen if called correctly
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting to update document:', docId, data);
      }
      setAutoSaveState('saving');

      try {
        const response = await fetch(`/api/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data), // Send whatever is in data (content or title)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to update document and parse error response.' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const updatedDocument: Document = await response.json();

        // Update local documents state
        setDocuments(prevDocs =>
          prevDocs.map(doc => (doc.id === updatedDocument.id ? updatedDocument : doc))
        );
        
        // If the active document was updated, refresh its state
        if (activeDocument && activeDocument.id === updatedDocument.id) {
          setActiveDocument(updatedDocument);
          if (data.content !== undefined) {
             // setText(updatedDocument.content); // Potentially avoid if editor is source of truth
          }
        }
        
        setAutoSaveState('saved');
        toast({ title: "Changes Saved", description: data.title ? "Title updated." : "Content saved."});

      } catch (error: any) {
        console.error('Error updating document:', error);
        setAutoSaveState('error');
        toast({
          title: 'Error Saving Changes',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    },
    [toast, activeDocument] // Added activeDocument to deps because it's used for potential update
  );

  // Handle text change
  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
      
      if (activeDocument) {
        debouncedUpdateDocument(activeDocument.id, { content: newText });
      }
    },
    [activeDocument, debouncedUpdateDocument]
  );

  // Select document
  const handleSelectDocument = useCallback((doc: Document) => {
    setActiveDocument(doc);
    setText(doc.content);
    setSuggestions([]);
    setToneHighlights([]);
  }, []);

  // Create document
  const handleCreateDocument = useCallback(async () => {
    const titleToCreate = newDocTitle.trim() || 'Untitled Document';
    setCreatingDoc(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: titleToCreate, content: '' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create document and parse error.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const newDocument = await response.json();

      // Option 1: Add to existing list (simpler, might have ordering issues if not careful)
      setDocuments(prevDocs => [newDocument, ...prevDocs]);
      // Option 2: Re-fetch list (ensures consistency but more overhead)
      // fetchDocuments(); // You'd need to make fetchDocuments available in this scope or pass it

      setActiveDocument(newDocument);
      setText(newDocument.content || '');
      setNewDocTitle('');
      setShowNewDocModal(false);
      
      toast({
        title: 'Document Created',
        description: `"${newDocument.title}" has been created successfully.`,
      });
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error Creating Document',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setCreatingDoc(false);
    }
  }, [newDocTitle, toast]); // Removed fetchDocuments from deps for now, if re-fetching, add it.

  // Save document title
  const handleTitleSave = useCallback(async () => {
    if (!activeDocument || !newTitle.trim() || newTitle.trim() === activeDocument.title) {
      setIsEditingTitle(false);
      return;
    }

    const trimmedTitle = newTitle.trim();
    // Optimistically update UI, or wait for API response
    // For now, we let debouncedUpdateDocument handle it if called directly,
    // or make a specific call here. The subtask asks for a direct fetch here.

    // To align with subtask, making a direct call instead of relying on debouncedUpdateDocument for title
    // This also means debouncedUpdateDocument should primarily focus on content.
    // Let's adjust debouncedUpdateDocument to only handle content if this is the case,
    // or ensure it can handle both distinctly. The current debouncedUpdateDocument can handle title.

    // For clarity and to meet subtask spec:
    setAutoSaveState('saving'); // Show saving indicator for title
    try {
      const response = await fetch(`/api/documents/${activeDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update title and parse error.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const updatedDocument : Document = await response.json();

      setActiveDocument(prev => prev ? { ...prev, title: updatedDocument.title, updatedAt: updatedDocument.updatedAt } : null);
      setDocuments(prevDocs =>
        prevDocs.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
      );
      setAutoSaveState('saved');
      toast({ title: "Title Updated", description: `Document title changed to "${updatedDocument.title}".` });

    } catch (error: any) {
      console.error('Error updating title:', error);
      setAutoSaveState('error'); // Reflect error state
      toast({
        title: 'Error Updating Title',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      // Optionally revert optimistic update if done
    } finally {
      setIsEditingTitle(false);
    }
  }, [activeDocument, newTitle, toast]);


  // Delete document
  const handleDeleteDocument = useCallback(async () => {
    if (!activeDocument) return;

    const docToDeleteTitle = activeDocument.title; // Store before clearing activeDocument

    try {
      const response = await fetch(`/api/documents/${activeDocument.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // For 204, response.ok is true, but no json body.
        // For other errors, try to parse json.
        let errorMsg = `HTTP error! status: ${response.status}`;
        if (response.status !== 204) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to delete document and parse error response.' }));
            errorMsg = errorData.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // If response.ok is true, and status is 204, it's a successful delete with no content.
      // If status is 200, it might have a success message (though 204 is more common for DELETE).

      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== activeDocument.id));
      setActiveDocument(null);
      setText('');
      setSuggestions([]); // Clear suggestions related to the deleted document
      setToneHighlights([]); // Clear tone highlights

      toast({
        title: 'Document Deleted',
        description: `"${docToDeleteTitle}" has been successfully deleted.`,
      });

    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error Deleting Document',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }, [activeDocument, toast]);

  const applySuggestion = (suggestionToApply: Suggestion) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Applying suggestion via Engie:", suggestionToApply);
    }
    
    // Apply the suggestion to the input editor
    applySuggestionLogic(
      suggestionToApply, 
      setSuggestions,
      editorRef
      // text, setText, activeDocument, debouncedUpdateDocument are no longer passed
    );
    
    // Clear analysis from analysis editor
    if (analysisEditorRef.current) {
      analysisEditorRef.current.clearAnalysis();
    }
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionId));
  };

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(async (userText: string, contentType: string) => {
    // Create a new document with the onboarding content
    const titleToCreate = `${contentType === 'linkedin' ? 'LinkedIn Post' : 
                           contentType === 'email' ? 'Email Draft' : 
                           contentType === 'instagram' ? 'Instagram Caption' : 
                           'New Document'} - ${new Date().toLocaleDateString()}`;
    
    setCreatingDoc(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: titleToCreate, content: userText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create document after onboarding.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const newDocument = await response.json();

      // Add to document list and select it
      setDocuments(prevDocs => [newDocument, ...prevDocs]);
      setActiveDocument(newDocument);
      setText(userText);
      
      // Mark onboarding as completed
      localStorage.setItem('hasCompletedOnboarding', 'true');
      setShowOnboarding(false);
      
      toast({
        title: '🎉 Welcome to Grammarly-est!',
        description: `Your ${contentType} content is ready to edit. Engie is here to help!`,
      });
    } catch (error: any) {
      console.error('Error creating document after onboarding:', error);
      toast({
        title: 'Error Creating Document',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      // Still mark onboarding as completed even if document creation fails
      localStorage.setItem('hasCompletedOnboarding', 'true');
      setShowOnboarding(false);
    } finally {
      setCreatingDoc(false);
    }
  }, [toast]);

  // Manual text analysis
  const handleAnalyzeText = () => {
    // Prevent multiple simultaneous analysis requests
    if (isAnalyzing) return;
    
    // Show loading indicator
    setIsAnalyzing(true);
    
    // Analyze in both editors to ensure they stay in sync
    const analysisPromises: Promise<void>[] = [];
    
    if (editorRef.current) {
      // Use the analyzeText method that now returns a Promise
      const promise = editorRef.current.analyzeText();
      analysisPromises.push(promise);
    }
    
    if (analysisEditorRef.current) {
      // Use the analyzeText method that now returns a Promise
      const promise = analysisEditorRef.current.analyzeText();
      analysisPromises.push(promise);
    }
    
    // Wait for both analyses to complete
    if (analysisPromises.length > 0) {
      Promise.all(analysisPromises)
        .catch(e => console.error('Analysis error:', e))
        .finally(() => {
          setIsAnalyzing(false);
        });
    } else {
      // Fallback if no promises returned
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 1500);
    }
  };

  // Toggle full screen
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Toggle auto fragment analysis
  const toggleAutoFragmentAnalysis = () => {
    const newValue = !autoFragmentAnalysis;
    setAutoFragmentAnalysis(newValue);
    
    // Save preference to localStorage only on client-side
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoFragmentAnalysis', newValue.toString());
    }
    
    // If turning on auto-analysis, trigger an immediate analysis
    if (newValue) {
      // Show loading indicator
      setIsAnalyzing(true);
      
      const analysisPromises: Promise<void>[] = [];
      
      // Run analysis on both editors and collect promises
      if (analysisEditorRef.current) {
        const promise = analysisEditorRef.current.analyzeText();
        analysisPromises.push(promise);
      }
      
      if (editorRef.current) {
        const promise = editorRef.current.analyzeText();
        analysisPromises.push(promise);
      }
      
      // Wait for all analyses to complete
      if (analysisPromises.length > 0) {
        Promise.all(analysisPromises)
          .catch(e => console.error('Analysis error:', e))
          .finally(() => {
            setIsAnalyzing(false);
          });
      } else {
        // Hide loading indicator after a reasonable timeout if no promises
        setTimeout(() => {
          setIsAnalyzing(false);
        }, 1500);
      }
    }
  };

  // Toggle showing parts of speech
  const toggleShowParts = () => {
    const newValue = !showParts;
    setShowParts(newValue);
    
    // Save preference to localStorage only on client-side
    if (typeof window !== 'undefined') {
      localStorage.setItem('showParts', newValue.toString());
    }
    
    // If we have an editor ref, toggle fragments visibility
    if (editorRef.current) {
      editorRef.current.toggleFragmentsVisibility();
    }
    if (analysisEditorRef.current) {
      analysisEditorRef.current.toggleFragmentsVisibility();
    }
  };

  // Sidebar component
  const sidebarComponent = useMemo(() => (
    <Sidebar 
      documents={documents}
      activeDocument={activeDocument}
      onSelectDocument={handleSelectDocument}
      onCreateDocument={() => setShowNewDocModal(true)}
    />
  ), [documents, activeDocument, handleSelectDocument]);

  // Header component
  const headerComponent = useMemo(() => (
    <DashboardHeader userName={user?.name || ''} userEmail={user?.email || ''} />
  ), [user]);

  return (
    <>
      <DashboardLayout sidebar={sidebarComponent} header={headerComponent}>
        <div className="p-4 sm:p-8 relative">
        {!activeDocument ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold">My Documents</h1>
              <Button 
                className="premium-button-gradient hidden sm:flex items-center shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30" 
                onClick={() => setShowNewDocModal(true)}
              >
                <FilePlus className="h-4 w-4 mr-1" />
                New Document
              </Button>
            </div>
            {isLoadingDocuments ? (
              <p>Loading documents...</p> // Basic loading indicator
            ) : documents.length === 0 ? (
              <div className="text-center py-10">
                <p className="mb-4 text-lg text-muted-foreground">No documents yet. Create your first one!</p>
                <Button 
                  className="premium-button-gradient shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30" 
                  onClick={() => setShowNewDocModal(true)}
                >
                  <FilePlus className="h-4 w-4 mr-1" />
                  Create Document
                </Button>
              </div>
            ) : (
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
                {/* Optional: Keep a dedicated "New Document" card if design prefers it, even with documents present */}
                <Card className="flex items-center justify-center border-2 border-dashed rounded-xl premium-document-card bg-muted/50 hover:border-primary transition-colors min-h-[180px]" onClick={() => setShowNewDocModal(true)}>
                   <Button 
                     variant="ghost" 
                     className="text-muted-foreground hover:text-blue-600 transition-colors duration-200"
                   >
                     <FilePlus className="h-4 w-4 mr-1" />
                     New Document
                   </Button>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Button variant="ghost" onClick={() => setActiveDocument(null)} className="mb-4 -ml-4"><ArrowLeft className="mr-2 h-4 w-4" />Back to Documents</Button>
            <div className="flex items-center gap-2 mb-4">
              {isEditingTitle ? (
                <Input value={newTitle} onChange={(e: any) => setNewTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e: any) => e.key === 'Enter' && handleTitleSave()} autoFocus />
              ) : (
                <h2 className="text-2xl sm:text-3xl font-bold" onClick={() => {setIsEditingTitle(true); setNewTitle(activeDocument.title)}}>{activeDocument.title}</h2>
              )}
              {autoSaveState === 'saving' && (
                <Badge variant="outline" className="ml-2">Saving...</Badge>
              )}
              {autoSaveState === 'saved' && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-200 bg-green-50">Saved</Badge>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="icon" onClick={toggleFullScreen} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                  {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><Menu className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {setIsEditingTitle(true); setNewTitle(activeDocument.title)}}><Edit className="h-4 w-4 mr-2" /> Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDocumentHistory(true)}><Book className="h-4 w-4 mr-2" /> Document History</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteDocument} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Analysis Options */}
            {isDesktop && (
              <Card className="mb-4">
                <CardHeader className="py-2 px-4">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Switch
                          id="auto-analysis"
                          checked={autoFragmentAnalysis}
                          onCheckedChange={toggleAutoFragmentAnalysis}
                          disabled={isAnalyzing}
                        />
                        {isAnalyzing && autoFragmentAnalysis && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="animate-ping h-2 w-2 rounded-full bg-primary opacity-75"></span>
                          </div>
                        )}
                      </div>
                      <label htmlFor="auto-analysis" className="text-sm font-medium flex items-center">
                        Auto Analysis {isAnalyzing && autoFragmentAnalysis && <span className="ml-1 text-xs text-muted-foreground">(analyzing...)</span>}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="show-parts"
                        checked={showParts}
                        onCheckedChange={toggleShowParts}
                      />
                      <label htmlFor="show-parts" className="text-sm font-medium">
                        Show Parts of Speech
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="grok-mode-toggle"
                        checked={grokMode}
                        onCheckedChange={handleGrokToggle}
                        disabled={grokMode && grokPowerRemaining === 0}
                      />
                      <label htmlFor="grok-mode-toggle" className="text-sm font-medium">
                        Grok Mode
                        {grokMode && (
                          <span className="ml-2 text-xs text-primary font-semibold">
                            {`Grok Power: ${Math.floor(grokPowerRemaining/60)}:${(grokPowerRemaining%60).toString().padStart(2,'0')}`}
                          </span>
                        )}
                      </label>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      <div className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">noun</div>
                      <div className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100">verb</div>
                      <div className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">adjective</div>
                      <div className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-100">adverb</div>
                      <div className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100">preposition</div>
                      <div className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded border border-teal-100">conjunction</div>
                      <div className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-100">article</div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        className={`analyze-button ${isAnalyzing ? 'loading-pulse' : ''}`}
                        onClick={handleAnalyzeText} 
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                              <circle 
                                className="opacity-25" 
                                cx="12" cy="12" r="10" 
                                stroke="currentColor" 
                                strokeWidth="4" 
                                fill="none" 
                              />
                              <path 
                                className="opacity-75" 
                                fill="currentColor" 
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                              />
                            </svg>
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BarChart2 className="h-4 w-4 mr-1" />
                            Analyze Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
            
            {/* Container for side-by-side editors */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Left Column: Input Editor */}
              <div className="md:w-1/2">
                <Card className="shadow-lg h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Write Your Text</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow">
                    <EnhancedEditor
                      ref={editorRef}
                      value={text}
                      onChange={handleTextChange}
                      suggestions={[]} // No highlighting in the input box
                      toneHighlights={[]}
                      autoAnalyze={false} // We'll manually sync with the analysis view
                      className="main-editor-textarea h-full text-base sm:text-lg border rounded-xl focus-visible:ring-0 bg-background"
                      placeholder="Start writing your masterpiece..."
                      showFragments={false} // Never show fragments in the input box
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Analysis Box */}
              <div className="md:w-1/2 flex flex-col gap-4">
                <Card className="shadow-lg flex-1 flex flex-col">
                  <CardHeader className="border-b pb-2">
                    <CardTitle className="text-sm font-medium">Text Analysis</CardTitle>
                    <CardDescription className="text-xs">
                      Analysis of the text on the left.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-b p-4 flex-grow">
                    <EnhancedEditor
                      ref={analysisEditorRef}
                      value={text}
                      onChange={(val: any) => {/* Read-only - no changes */}}
                      suggestions={suggestions || []} // Ensure suggestions is always an array
                      toneHighlights={toneHighlights || []} // Ensure toneHighlights is always an array
                      autoAnalyze={true}
                      readOnly={true}
                      className="analysis-editor h-full text-base sm:text-lg border rounded-xl focus-visible:ring-0 bg-muted/30"
                      placeholder="Analysis will appear here..."
                      showFragments={true}
                      isAnalysisBox={true}
                      reflectTextFrom={text}
                      onSuggestionsFetched={suggestions => setSuggestions(suggestions || [])}
                      onToneHighlightsFetched={highlights => setToneHighlights(highlights || [])}
                    />
                  </CardContent>
                </Card>

                {/* Priority Warnings Panel */}
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="text-red-500">⚠️</span>
                      Priority Issues
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Issues that need immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 max-h-32 overflow-y-auto">
                    {suggestions && suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {suggestions
                          .filter(s => s.type === 'Punctuation' && s.severity === 'High')
                          .map((suggestion, index) => (
                            <div 
                              key={suggestion.id || index}
                              className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                            >
                              <span className="text-red-600 font-medium text-xs mt-0.5">
                                PUNCTUATION
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                  "{suggestion.original}" → "{suggestion.suggestion}"
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {suggestion.explanation}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                onClick={() => applySuggestion(suggestion)}
                              >
                                ✓
                              </Button>
                            </div>
                          ))}
                        {suggestions
                          .filter(s => s.severity === 'High' && s.type !== 'Punctuation')
                          .map((suggestion, index) => (
                            <div 
                              key={suggestion.id || `other-${index}`}
                              className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                            >
                              <span className="text-amber-700 font-medium text-xs mt-0.5">
                                {suggestion.type.toUpperCase()}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                  "{suggestion.original}" → "{suggestion.suggestion}"
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {suggestion.explanation}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                                onClick={() => applySuggestion(suggestion)}
                              >
                                ✓
                              </Button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No priority issues found
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Great job! Your text looks clean.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      </DashboardLayout>
      
      {/* Engie is now always visible, regardless of document state */}
      <ClientEngie
        suggestions={suggestions || []}
        onApply={applySuggestion}
        onDismiss={dismissSuggestion}
        onIdeate={() => {}}
        targetEditorSelector=".main-editor-textarea" // Target the input box
        documents={documents.map((d: any) => ({ id: d.id, title: d.title }))}
        grokMode={grokMode}
        grokPowerRemaining={grokPowerRemaining}
      />
      
      <Dialog open={showNewDocModal} onOpenChange={setShowNewDocModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Document</DialogTitle></DialogHeader>
          <Input placeholder="Enter document title" value={newDocTitle} onChange={(e: any) => setNewDocTitle(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleCreateDocument()} />
          <DialogFooter>
            <Button 
              onClick={() => setShowNewDocModal(false)} 
              variant="outline" 
              className="transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDocument} 
              disabled={creatingDoc}
              className={`premium-button-gradient ${creatingDoc ? 'loading-pulse' : ''}`}
            >
              {creatingDoc ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" cy="12" r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none" 
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    />
                  </svg>
                  Creating...
                </>
              ) : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive Onboarding for new users */}
      <InteractiveOnboarding
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('hasCompletedOnboarding', 'true');
        }}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
};

export default DashboardPage;
