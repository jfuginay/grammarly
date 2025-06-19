import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
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

interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [userMetadata, setUserMetadata] = useState<User | null>(null);
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

  const handleShareText = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeDocument?.title || 'Shared text',
          text: text,
        });
        toast({
          title: "Success",
          description: "Text shared successfully.",
        });
      } catch (error) {
        console.error("Error sharing:", error);
        if (error instanceof Error && error.name !== 'AbortError') {
          toast({
            title: "Error",
            description: "Failed to share text.",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Info",
        description: "Web Share API not available. You can manually copy the text.",
        variant: "default",
      });
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (isAuthenticated && user) {
      // Set user data from Auth0
      setUserMetadata({
        id: user.sub || '',
        email: user.email || '',
        name: user.name,
        picture: user.picture
      });
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
        const token = await getAccessTokenSilently();
        const response = await fetch('/api/documents', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const docs = await response.json();
        
        // Sort by most recently updated
        const sortedDocs = docs.sort((a: Document, b: Document) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setDocuments(sortedDocs);
        
        const activeDocStillExists = activeDocument && sortedDocs.some((d: Document) => d.id === activeDocument.id);
        if (!activeDocStillExists && sortedDocs.length > 0) {
            setActiveDocument(sortedDocs[0]);
            setText(sortedDocs[0].content);
        }

    } catch (error) {
        console.error("Failed to fetch documents:", error);
        toast({ title: "Error", description: "Could not load your documents.", variant: "destructive" });
    }
  }, [isAuthenticated, user, activeDocument, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDocuments();
    }
  }, [isAuthenticated, user, fetchDocuments]);

  const handleNewDocument = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
  }, [fetchDocuments, isAuthenticated, getAccessTokenSilently]);

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

  const debouncedUpdateDocument = useDebouncedCallback(async (docId: string, data: { content?: string; title?: string }) => {
    if (!isAuthenticated) return;
    
    try {
      setAutoSaveState('saving');
      const token = await getAccessTokenSilently();
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update document');
      
      setAutoSaveState('saved');
      toast({ title: "Saved", duration: 2000 });

      setDocuments((docs: Document[]) =>
        docs.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : doc
        )
      );
    } catch (error) {
      console.error("Failed to update document:", error);
      setAutoSaveState('error');
      toast({
        title: "Error",
        description: "Could not save your changes.",
        variant: "destructive",
      });
    }
  }, 1000);

  const handleDeleteDocument = async (docId: string) => {
    if (!isAuthenticated) return;
    
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete document');
      
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
  const DocumentSidebar = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-inner">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">My Documents</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => handleNewDocument()}
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200 shadow hover:shadow-md"
              >
                <FilePlus className="h-4 w-4 mr-1" />
                New
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new document</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500 dark:text-gray-400">
            <FilePlus className="h-12 w-12 mb-4 text-blue-500 dark:text-blue-400" />
            <p className="mb-4">No documents yet</p>
            <Button 
              size="sm" 
              onClick={() => handleNewDocument()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              Create your first document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((doc: Document) => (
              <div
                key={doc.id}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 ${activeDocument?.id === doc.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}`}
                onClick={() => handleSelectDocument(doc)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (doc.id === activeDocument?.id) {
                          setNewTitle(doc.title);
                          setIsEditingTitle(true);
                        }
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{doc.content.substring(0, 60) || 'No content'}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500">{new Date(doc.updatedAt).toLocaleDateString()}</div>
                  {doc.id === activeDocument?.id && (
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
        <div className="animate-pulse bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent text-3xl font-bold mb-4">
          WriteMaster
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen bg-gray-50 dark:bg-gray-950 flex flex-col ${isDistractionFree ? 'z-50 fixed inset-0 bg-background' : ''}`}> 
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: stats, goals, charts */}
        <aside className={`hidden lg:flex flex-col w-80 xl:w-96 border-r border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-all duration-300 ${isDistractionFree ? 'opacity-0 pointer-events-none' : ''}`}>
          <div className="p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-semibold premium-text-gradient mb-2">Writing Stats</h2>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-2xl font-bold">{wordCount}</span>
                <span className="text-xs text-gray-500">words</span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-lg font-semibold">{readingTime} min</span>
                <span className="text-xs text-gray-500">read</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="range" min={100} max={5000} step={100} value={writingGoal} onChange={e => setWritingGoal(Number(e.target.value))} className="w-32" />
                <span className="text-xs text-gray-500">Goal: {writingGoal} words</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full mt-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Writing Dashboard</h3>
              <div className="h-32 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">(Charts coming soon)</div>
            </div>
          </div>
        </aside>
        {/* Main writing area */}
        <main className={`flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900 shadow-xl rounded-tl-xl md:rounded-none transition-all duration-300 ${isDistractionFree ? 'z-50' : ''}`}> 
          <header className="flex-grow-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
            {activeDocument && isEditingTitle ? (
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded">
                <input 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  onBlur={handleTitleSave} 
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()} 
                  autoFocus 
                  className="text-xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none px-1 py-0.5"
                />
                <Button size="sm" onClick={handleTitleSave} variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Save className="h-4 w-4"/>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <Pen className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{activeDocument?.title || 'Select a document'}</h1>
                {activeDocument && 
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full" 
                    onClick={() => {
                      if (activeDocument) {
                        setNewTitle(activeDocument.title);
                        setIsEditingTitle(true);
                      }
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                  </Button>
                }
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".txt,.md"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleFileUploadClick} className="h-9 w-9 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <FileUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Import file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handlePasteFromClipboard} className="h-9 w-9 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <ClipboardPaste className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Paste from clipboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleShareText} className="h-9 w-9 rounded-full border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share document</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </header>
          {/* Writing area with floating toolbar */}
          <div className="flex-1 flex flex-col items-center justify-center relative transition-all duration-300" style={{ minHeight: 0 }}>
            <div className="w-full flex justify-center">
              <div className={`relative w-full`} style={{ maxWidth: textWidth }}>
                <Textarea
                  id="dashboard-editor-textarea"
                  ref={textareaRef}
                  value={text}
                  onChange={e => {
                    setText(e.target.value);
                    setAutoSaveState('saving');
                    if (activeDocument) {
                      debouncedUpdateDocument(activeDocument.id, { content: e.target.value });
                    }
                  }}
                  placeholder="Start writing or paste your text here..."
                  className={`flex-1 resize-none border-0 text-base focus-visible:ring-0 shadow-none rounded-xl p-6 bg-white dark:bg-gray-900 transition-all duration-300 ${FONT_OPTIONS.find(f => f.value === font)?.className} `}
                  style={{ fontSize, lineHeight }}
                  rows={18}
                  spellCheck
                  autoFocus
                />
                {/* Floating toolbar on selection */}
                {showToolbar && selection && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 z-20 flex gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-2 animate-fade-in">
                    <Button variant="ghost" size="icon"><Type className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Text className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><AlignLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><AlignJustify className="h-4 w-4" /></Button>
                  </div>
                )}
                {/* Auto-save indicator */}
                <div className="absolute right-4 bottom-4 flex items-center gap-2 text-xs">
                  {autoSaveState === 'saving' && <span className="animate-pulse text-blue-500">Saving...</span>}
                  {autoSaveState === 'saved' && <span className="text-green-500 transition-all duration-300">Saved</span>}
                  {autoSaveState === 'error' && <span className="text-red-500">Error</span>}
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* Right Sidebar - Desktop */}
        <aside className="hidden lg:flex w-80 xl:w-96 flex-col gap-4 pl-4">
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 px-4 py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span>AI Writing Assistant</span>
              </CardTitle>
              <Switch
                checked={showAiSuggestions}
                onCheckedChange={setShowAiSuggestions}
                aria-label="Toggle AI Suggestions"
              />
            </CardHeader>
            <CardContent className="px-4 py-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {showAiSuggestions ? 
                  "AI analysis is enabled. Your writing will be analyzed for grammar, style, and clarity improvements." :
                  "AI analysis is disabled. Enable to get writing suggestions."
                }
              </div>
            </CardContent>
          </Card>
          
          {showAiSuggestions && (
            <div className="overflow-y-auto flex-1 space-y-3 pr-2">
              {isSuggestionsLoading && (
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                    <p className='text-gray-600 dark:text-gray-300'>Analyzing your writing...</p>
                  </CardContent>
                </Card>
              )}
              
              {!isSuggestionsLoading && suggestions.length === 0 && showAiSuggestions && text && (
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className='text-gray-600 dark:text-gray-300'>Your writing looks good! No suggestions found.</p>
                  </CardContent>
                </Card>
              )}
              
              {!isSuggestionsLoading && !text && (
                <Card className="border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Pen className="h-5 w-5 text-blue-500" />
                    <p className='text-gray-600 dark:text-gray-300'>Start typing to get writing suggestions.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </aside>
      </div>
      {/* Mobile Sidebars */}
      <div className="md:hidden">
        {/* Document Sidebar Sheet */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="fixed top-20 left-4 z-20 bg-white dark:bg-gray-900 shadow-lg rounded-full h-10 w-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 border-r border-gray-200 dark:border-gray-800">
            <Tabs defaultValue="documents" className="h-full flex flex-col">
              <TabsList className="w-full h-12 rounded-none border-b border-gray-200 dark:border-gray-800 bg-transparent gap-4 px-6">
                <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none rounded-none">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-none rounded-none">
                  Suggestions
                </TabsTrigger>
              </TabsList>
              <TabsContent value="documents" className="h-full overflow-hidden flex-1 m-0 p-0">
                <DocumentSidebar />
              </TabsContent>
              <TabsContent value="suggestions" className="h-full overflow-hidden flex-1 m-0 p-0">
                <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-inner p-4">
                  <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Writing Suggestions</h2>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">AI Suggestions</span>
                    <Switch
                      checked={showAiSuggestions}
                      onCheckedChange={setShowAiSuggestions}
                      aria-label="Toggle AI Suggestions"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                    {/* Suggestions content here */}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>
      {/* Engie Assistant */}
      <Engie
        suggestions={suggestions}
        onApply={applySuggestion}
        onDismiss={dismissSuggestion}
        onIdeate={() => { /* TODO */ }}
        targetEditorSelector="#dashboard-editor-textarea"
      />
    </div>
  );
};

export default DashboardPage;