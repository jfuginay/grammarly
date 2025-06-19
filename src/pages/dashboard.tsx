import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  AlignJustify
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

// Type definitions
interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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

const DashboardPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  const [text, setText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState<boolean>(true);
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

  // New document state
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Engie Idea Corner state
  const [showIdeaCorner, setShowIdeaCorner] = useState(false);
  const [engieIdea, setEngieIdea] = useState<string | null>(null);
  const [engieHasNewIdea, setEngieHasNewIdea] = useState(false);

  const handlePasteFromClipboard = async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      toast({
        title: "Error",
        description: "Clipboard API not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText); // Update local state for textarea
        if (activeDocument) {
          // Persist the change to the backend
          debouncedUpdateDocument(activeDocument.id, { content: clipboardText });
        }
        toast({
          title: "Success",
          description: "Text pasted from clipboard.",
        });
      } else {
        toast({
          title: "Info",
          description: "Clipboard is empty or contains no text.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
           toast({
            title: "Error",
            description: "Permission to read clipboard denied. Please allow access in your browser settings.",
            variant: "destructive",
            duration: 7000,
          });
      } else {
          toast({
            title: "Error",
            description: "Failed to paste text from clipboard.",
            variant: "destructive",
          });
      }
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Reset file input to allow uploading the same file again
    event.target.value = '';

    const allowedTypes = ['text/plain', 'text/markdown'];
    const allowedExtensions = ['.txt', '.md'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Error: Invalid File Type",
        description: "Please upload a plain text file (.txt, .md).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxFileSize) {
      toast({
        title: "Error: File Too Large",
        description: `File size cannot exceed ${maxFileSize / (1024 * 1024)}MB.`,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        setText(fileContent);
        if (activeDocument) {
          debouncedUpdateDocument(activeDocument.id, { content: fileContent });
        }
        toast({
          title: "Success",
          description: "File content uploaded successfully.",
        });
      } catch (readError) {
        console.error("Error processing file content:", readError);
        toast({
          title: "Error",
          description: "Could not process file content.",
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      console.error("Error reading file:", reader.error);
      toast({
        title: "Error",
        description: "Failed to read the file.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
  };

  const handleShare = async () => {
    if (!text.trim()) {
      toast({
        title: "Info",
        description: "Nothing to share. Write some text first!",
        variant: "default",
      });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeDocument?.title || 'My Engie Document',
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({
          title: "Error",
          description: "Failed to share the content.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Info",
        description: "Web Share API not available. You can manually copy the text.",
        variant: "default",
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const docs = await response.json();
        setDocuments(docs);
        if (docs.length > 0) {
          // If there's no active document, or the active one is no longer in the list, set one.
          if (!activeDocument || !docs.find((d: Document) => d.id === activeDocument.id)) {
            handleSelectDocument(docs[0]);
          }
        } else {
          setActiveDocument(null);
          setText('');
        }
      } else {
        console.error('Failed to fetch documents');
        toast({ title: "Error", description: "Could not load your documents.", variant: "destructive" });
      }
    } catch (error) {
      console.error('An error occurred while fetching documents:', error);
      toast({ title: "Error", description: "An unexpected error occurred while loading documents.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleNewDocument = useCallback(async () => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document', content: '' }),
      });
      if (!response.ok) throw new Error('Failed to create document');
      const newDoc = await response.json();
      
      // After creating, refetch the list and set the new one as active
      await fetchDocuments();
      setActiveDocument(newDoc);
      setText(newDoc.content);
      setSuggestions([]);

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not create a new document.", variant: "destructive" });
    }
  }, [fetchDocuments]);

  const handleSelectDocument = (doc: Document) => {
    setActiveDocument(doc);
    setText(doc.content);
    setSuggestions([]);
    setIsSidebarOpen(false);
  };

  const handleTitleSave = () => {
    if (activeDocument && newTitle.trim()) {
      debouncedUpdateDocument(activeDocument.id, { title: newTitle.trim() });
      setIsEditingTitle(false);
    }
  };

  const debouncedUpdateDocument = useDebouncedCallback(async (docId: string, data: { title?: string, content?: string }) => {
    setAutoSaveState('saving');
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setAutoSaveState('saved');
        // Refresh documents list to reflect changes like title updates
        fetchDocuments();
      } else {
        setAutoSaveState('error');
        toast({ title: "Save Error", description: "Could not save changes.", variant: "destructive" });
      }
    } catch (error) {
      setAutoSaveState('error');
      console.error('Failed to update document:', error);
    }
  }, 1500);

  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });
      
      // Update the local state
      setDocuments(docs => {
        const newDocs = docs.filter(doc => doc.id !== docId);
        
        // If the deleted document was active, select another one
        if (activeDocument?.id === docId && newDocs.length > 0) {
          const newActiveDoc = newDocs[0];
          setActiveDocument(newActiveDoc);
          setText(newActiveDoc.content);
        } else if (newDocs.length === 0) {
          setActiveDocument(null);
          setText('');
        }
        
        return newDocs;
      });
      
      toast({ title: "Document deleted" });
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({ 
        title: "Error", 
        description: "Could not delete the document.", 
        variant: "destructive" 
      });
    }
  };

  const fetchSuggestions = useCallback(async (currentText: string) => {
    // Don't fetch suggestions if the text is the same as the last analyzed text
    if (currentText === lastAnalyzedTextRef.current || !currentText.trim() || !showAiSuggestions) {
      return;
    }

    setIsSuggestionsLoading(true);
    lastAnalyzedTextRef.current = currentText;

    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: currentText }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add unique IDs to each suggestion
        const suggestionsWithIds = data.suggestions.map((suggestion: Omit<Suggestion, 'id'>, index: number) => ({
          ...suggestion,
          id: `suggestion-${Date.now()}-${index}`,
        }));
        setSuggestions(suggestionsWithIds);
      } else {
        toast({
          title: "Error fetching suggestions",
          description: data.message || "Something went wrong",
          variant: "destructive"
        });
        throw new Error(data.message || 'Failed to fetch suggestions');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // If the API fails, we don't want to constantly retry for the same text.
      // The user will need to change the text to trigger a new attempt.
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [showAiSuggestions]);

  const debouncedFetchSuggestions = useDebouncedCallback(fetchSuggestions, 1000);

  useEffect(() => {
    if (text) {
      // Only use debounced fetch for normal typing
      // Applied suggestions trigger immediate fetch in the applySuggestion function
      debouncedFetchSuggestions(text);
    } else {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
    }
  }, [text, debouncedFetchSuggestions]);

  const applySuggestion = (suggestionToApply: Suggestion) => {
    console.log("Applying suggestion:", suggestionToApply);
    console.log("Current suggestions count:", suggestions.length);
    
    // Find the Nth occurrence of the original text that this suggestion corresponds to.
    const suggestionIndex = suggestions.findIndex(s => s.id === suggestionToApply.id);
    let n = 0;
    if (suggestionIndex > -1) {
        for (let i = 0; i < suggestionIndex; i++) {
            if (suggestions[i].original === suggestionToApply.original) {
                n++;
            }
        }
    }

    // Replace only the Nth match in the text
    let count = 0;
    const newText = text.replace(
        new RegExp(escapeRegExp(suggestionToApply.original), 'g'), 
        (match) => {
            if (count === n) {
                count++;
                return suggestionToApply.suggestion;
            }
            count++;
            return match;
        }
    );

    console.log("Text updated from length", text.length, "to", newText.length);
    
    // Update text first
    setText(newText);
    
    // Clear all suggestions immediately since the document has changed
    setSuggestions([]);
    
    // Show loading state while fetching new suggestions
    setIsSuggestionsLoading(true);

    // Update document
    if (activeDocument) {
        debouncedUpdateDocument(activeDocument.id, { content: newText });
    }
    
    // Immediately fetch new suggestions for the entire updated document
    console.log("Fetching new suggestions for updated document");
    fetchSuggestions(newText);
  };

  const dismissSuggestion = (suggestionId: string) => {
    console.log("Dismissing suggestion:", suggestionId);
    setSuggestions(prev => {
      const filteredSuggestions = prev.filter(s => s.id !== suggestionId);
      console.log("Suggestions reduced from", prev.length, "to", filteredSuggestions.length);
      return filteredSuggestions;
    });
  };

  // Components
  const DocumentSidebar = ({
    handlePromptNewDocument,
    handleCreateDocument,
    showNewDocModal,
    newDocTitle,
    setNewDocTitle,
    creatingDoc,
    setShowNewDocModal
  }: {
    handlePromptNewDocument: () => void;
    handleCreateDocument: () => void;
    showNewDocModal: boolean;
    newDocTitle: string;
    setNewDocTitle: (v: string) => void;
    creatingDoc: boolean;
    setShowNewDocModal: (v: boolean) => void;
  }) => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-inner relative">
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-semibold premium-text-gradient">My Documents</h2>
        <Button size="sm" className="premium-button-gradient" onClick={handlePromptNewDocument}>
          <FilePlus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
            <FilePlus className="h-12 w-12 mb-4 text-blue-500 dark:text-blue-400" />
            <p className="mb-4">No documents yet</p>
            <Button size="sm" onClick={handlePromptNewDocument} className="premium-button-gradient">Create your first document</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`premium-document-card group ${activeDocument?.id === doc.id ? 'premium-document-card-active' : ''}`}
                onClick={() => handleSelectDocument(doc)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => {e.stopPropagation(); setNewTitle(doc.title); setIsEditingTitle(true);}}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => {e.stopPropagation(); handleDeleteDocument(doc.id);}}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{doc.content.substring(0, 60) || 'No content'}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(doc.updatedAt).toLocaleDateString()}</div>
                  {doc.id === activeDocument?.id && (
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">Active</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Hide sidebar button */}
      <Button variant="ghost" size="icon" className="absolute top-4 right-2 z-20" onClick={handleSidebarToggle} aria-label="Hide sidebar"><Minimize2 className="h-5 w-5" /></Button>
      {/* New Document Modal */}
      <Dialog open={showNewDocModal} onOpenChange={setShowNewDocModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Document</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Document name"
            value={newDocTitle}
            onChange={e => setNewDocTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateDocument(); }}
            disabled={creatingDoc}
          />
          <DialogFooter>
            <Button onClick={handleCreateDocument} disabled={creatingDoc || !newDocTitle.trim()} className="premium-button-gradient">Create</Button>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const severityColorMap: { [key in Suggestion['severity']]: string } = {
    High: 'bg-red-500 dark:bg-red-600',
    Medium: 'bg-amber-500 dark:bg-amber-600',
    Low: 'bg-blue-500 dark:bg-blue-600',
  };

  const severityIconMap: { [key in Suggestion['severity']]: React.ReactNode } = {
    High: <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />,
    Medium: <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
    Low: <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />,
  };

  // Word/reading time calculation
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const readingTime = useMemo(() => Math.ceil(wordCount / 200), [wordCount]);
  const progress = Math.min(100, Math.round((wordCount / writingGoal) * 100));

  // Auto-save indicator logic
  useEffect(() => {
    if (autoSaveState === 'saving') {
      const timeout = setTimeout(() => setAutoSaveState('saved'), 1200);
      return () => clearTimeout(timeout);
    }
  }, [autoSaveState]);

  // Show toolbar on text selection
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleSelect = () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setShowToolbar(start !== end);
      setSelection(start !== end ? { start, end } : null);
    };
    textarea.addEventListener('select', handleSelect);
    return () => textarea.removeEventListener('select', handleSelect);
  }, []);

  // Sidebar toggle for desktop and mobile
  function handleSidebarToggle() {
    setIsSidebarVisible((v) => !v);
  }

  // Emersive mode exit handler
  function handleExitImmersive() {
    setIsDistractionFree(false);
  }

  // Handler to receive new idea from Engie
  const handleEngieIdea = (idea: string) => {
    setEngieIdea(idea);
    setEngieHasNewIdea(true);
  };

  // Handler to open the idea corner
  const openIdeaCorner = () => {
    setShowIdeaCorner(true);
    setEngieHasNewIdea(false);
  };
  // Handler to close the idea corner
  const closeIdeaCorner = () => setShowIdeaCorner(false);

  const isMobile = useMediaQuery ? useMediaQuery('(max-width: 768px)') : false;

  // Move this above all sidebar render code so it is in scope
  const handlePromptNewDocument = () => {
    setShowNewDocModal(true);
    setNewDocTitle('');
  };

  const handleSelect = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        setSelection({ start, end });
      } else {
        setSelection(null);
      }
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
    if (activeDocument) {
      setAutoSaveState('saving');
      debouncedUpdateDocument(activeDocument.id, { content: newText });
    }
  };

  return (
    <div className={`dashboard-grid ${isSidebarVisible ? 'sidebar-visible' : ''} ${isDistractionFree ? 'distraction-free' : ''}`}>
      <Header />
      <div className={`document-sidebar-container ${isSidebarVisible ? 'visible' : ''}`}>
        <DocumentSidebar 
          handlePromptNewDocument={handlePromptNewDocument}
          handleCreateDocument={handleNewDocument}
          showNewDocModal={showNewDocModal}
          newDocTitle={newDocTitle}
          setNewDocTitle={setNewDocTitle}
          creatingDoc={creatingDoc}
          setShowNewDocModal={setShowNewDocModal}
        />
      </div>
      
      <main className="main-content">
        <div className="editor-container">
          {activeDocument ? (
            <>
              <div className="editor-header">
                {isEditingTitle ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); }}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={handleTitleSave}><Save className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <h1 className="text-2xl font-semibold" onClick={() => setIsEditingTitle(true)}>{activeDocument.title}</h1>
                )}
              </div>
              
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onSelect={handleSelect}
                className={`editor-textarea font-${font}`}
                style={{ fontSize: `${fontSize}px`, lineHeight, maxWidth: textWidth }}
                placeholder="Start writing your masterpiece..."
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Book size={48} className="text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold">No Document Selected</h2>
              <p className="text-gray-500 mt-2">Create a new document or select one from the sidebar to begin.</p>
              <Button onClick={handlePromptNewDocument} className="mt-6">Create Your First Document</Button>
            </div>
          )}
        </div>
      </main>

      <div className={`ai-sidebar-container ${isAiSidebarOpen ? 'visible' : ''}`}>
        {/* This is where the AI sidebar content would go */}
      </div>

      <Engie
        suggestions={showAiSuggestions ? suggestions : []}
        onApply={applySuggestion}
        onDismiss={dismissSuggestion}
        onIdeate={openIdeaCorner}
        targetEditorSelector=".editor-textarea"
        onIdea={handleEngieIdea}
      />
    </div>
  );
};

export default DashboardPage;