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
  currentText: string, // Renamed from 'text' to avoid conflict with state variable 'text'
  suggestionToApply: Suggestion,
  setText: (newText: string) => void,
  setSuggestions: (updater: (currentSuggestions: Suggestion[]) => Suggestion[]) => void,
  activeDocument: Document | null,
  debouncedUpdateDocument: (docId: string, data: { content?: string }) => void // Ensure content is optional if title can also be updated
) => {
  console.log("Original text:", currentText);
  console.log("Suggestion to apply (original):", suggestionToApply.original);
  console.log("Suggestion to apply (suggestion):", suggestionToApply.suggestion);

  if (suggestionToApply.original === "") { // Check for empty string specifically
    console.error("Error: suggestionToApply.original is empty. Skipping replacement.");
    return;
  }

  const newText = currentText.replace(suggestionToApply.original, suggestionToApply.suggestion);
  console.log("New text after replacement:", newText);

  setText(newText);
  setSuggestions(currentSuggestions => currentSuggestions.filter(s => s.id !== suggestionToApply.id));
  if (activeDocument) {
    // Ensure that debouncedUpdateDocument is called with a compatible data object.
    // If debouncedUpdateDocument expects `content` to always be a string, this is fine.
    // If it can also update `title`, then the call should reflect that,
    // but here we are only updating content.
    debouncedUpdateDocument(activeDocument.id, { content: newText });
  }
};

const DashboardPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
       await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      fetchDocuments(); // Refresh list on update
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  }, 1500);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (activeDocument) {
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
    lastAnalyzedTextRef.current = doc.content;
  };
  
  // Engie Suggestions Logic
  const debouncedCheckText = useDebouncedCallback(async (currentText: string) => {
    if (lastAnalyzedTextRef.current === currentText || !currentText.trim()) return;
    lastAnalyzedTextRef.current = currentText;
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText }),
      });
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to get suggestions', error);
    }
  }, 1500);

  useEffect(() => {
    if (activeDocument) {
      debouncedCheckText(text);
    }
  }, [text, activeDocument, debouncedCheckText]);

  const applySuggestion = (suggestionToApply: Suggestion) => {
    applySuggestionLogic(text, suggestionToApply, setText, setSuggestions, activeDocument, debouncedUpdateDocument);
  };

  const dismissSuggestion = (suggestionId: string) => {

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // const [text, setText] = useState<string>(''); // This will be defined in the primary DashboardPage component
  // const [suggestions, setSuggestions] = useState<Suggestion[]>([]); // This will be defined in the primary DashboardPage component
  // Note: The second DashboardPage component definition and its contents are removed by this diff.
  // The primary DashboardPage component, defined earlier in the file, is retained.
  // The applySuggestion, dismissSuggestion, and useEffect for debug logging
  // are part of the primary DashboardPage component.
  useEffect(() => {
    console.log('Dashboard state update:', {
      hasActiveDocument: !!activeDocument,
      suggestionsCount: suggestions.length,
      documentsCount: documents.length
    });
  }, [activeDocument, suggestions, documents]);
  
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
            </div>
            <Card className="shadow-lg">
              <Textarea value={text} onChange={handleTextChange} className="main-editor-textarea min-h-[calc(100vh-240px)] text-base sm:text-lg border-0 p-4 sm:p-6 rounded-xl focus-visible:ring-0 bg-background" placeholder="Start writing your masterpiece..." />
            </Card>
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
        targetEditorSelector=".main-editor-textarea"
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