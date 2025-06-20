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
import Engie from '@/components/Engie';

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

  // Fallback logic for applying suggestions manually (if needed)
  let newText = currentText;
  
  // If we have start and end indices, use them for precise replacement
  if (typeof suggestionToApply.startIndex === 'number' && typeof suggestionToApply.endIndex === 'number') {
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
  const [autoSaveState, setAutoSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [showDocumentHistory, setShowDocumentHistory] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoFragmentAnalysis, setAutoFragmentAnalysis] = useState(() => {
    // Load preference from localStorage or default to true
    const savedPreference = localStorage.getItem('autoFragmentAnalysis');
    return savedPreference !== null ? savedPreference === 'true' : true;
  });
  const [showParts, setShowParts] = useState(() => {
    // Load preference from localStorage or default to false
    const savedPreference = localStorage.getItem('showParts');
    return savedPreference !== null ? savedPreference === 'true' : false;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDocumentSelected = activeDocument !== null;
  
  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        // Mock data
        const mockDocuments = [
          {
            id: '1',
            title: 'Welcome Guide',
            content: 'Welcome to Grammarly! This is a sample document to help you get started. Just start typing to see how our advanced writing assistant works.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Meeting Notes',
            content: 'Team meeting agenda:\n- Project updates\n- Timeline review\n- Action items for next week',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ];
        
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  // Debounced document update
  const debouncedUpdateDocument = useCallback(
    (docId: string, data: { content?: string; title?: string }) => {
      console.log('Updating document:', docId, data);
      setAutoSaveState('saving');
      
      // Simulate API call
      setTimeout(() => {
        setDocuments(prevDocs => 
          prevDocs.map(doc => 
            doc.id === docId 
              ? { 
                  ...doc, 
                  ...(data.content !== undefined ? { content: data.content } : {}),
                  ...(data.title !== undefined ? { title: data.title } : {}),
                  updatedAt: new Date().toISOString()
                } 
              : doc
          )
        );
        
        // If we're updating the active document, also update that
        if (activeDocument && activeDocument.id === docId) {
          setActiveDocument(prev => 
            prev ? { 
              ...prev, 
              ...(data.content !== undefined ? { content: data.content } : {}),
              ...(data.title !== undefined ? { title: data.title } : {}),
              updatedAt: new Date().toISOString() 
            } : null
          );
        }
        
        setAutoSaveState('saved');
        console.log('Document updated successfully');
      }, 500);
    },
    [activeDocument]
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
  const handleCreateDocument = useCallback(() => {
    const title = newDocTitle || 'Untitled Document';
    setCreatingDoc(true);
    
    // Simulate API call
    setTimeout(() => {
      const newDoc = {
        id: Date.now().toString(),
        title,
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setDocuments(prevDocs => [...prevDocs, newDoc]);
      setActiveDocument(newDoc);
      setText('');
      setSuggestions([]);
      setToneHighlights([]);
      setNewDocTitle('');
      setShowNewDocModal(false);
      setCreatingDoc(false);
      
      toast({
        title: 'Document Created',
        description: `"${title}" has been created successfully.`,
      });
    }, 500);
  }, [newDocTitle, toast]);

  // Save document title
  const handleTitleSave = useCallback(() => {
    if (activeDocument && newTitle.trim()) {
      debouncedUpdateDocument(activeDocument.id, { title: newTitle });
    }
    setIsEditingTitle(false);
  }, [activeDocument, debouncedUpdateDocument, newTitle]);

  // Delete document
  const handleDeleteDocument = useCallback(() => {
    if (!activeDocument) return;
    
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== activeDocument.id));
    setActiveDocument(null);
    setText('');
    setSuggestions([]);
    setToneHighlights([]);
    
    toast({
      title: 'Document Deleted',
      description: `"${activeDocument.title}" has been deleted.`,
    });
  }, [activeDocument, toast]);

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
    
    // Save preference to localStorage
    localStorage.setItem('autoFragmentAnalysis', newValue.toString());
    
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
    
    // Save preference to localStorage
    localStorage.setItem('showParts', newValue.toString());
    
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
      documents={documents.map(doc => ({ id: doc.id, title: doc.title }))} 
      activeDocumentId={activeDocument?.id}
      onSelectDocument={id => {
        const doc = documents.find(d => d.id === id);
        if (doc) handleSelectDocument(doc);
      }}
      onCreateDocument={() => setShowNewDocModal(true)}
    />
  ), [documents, activeDocument?.id, handleSelectDocument]);

  // Header component
  const headerComponent = useMemo(() => (
    <DashboardHeader 
      user={user} 
      onNewDocument={() => setShowNewDocModal(true)}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />
  ), [user, sidebarOpen]);

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
                      <Button size="sm" onClick={handleAnalyzeText} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                          <>
                            <span className="animate-spin h-4 w-4 mr-1">&#8635;</span>
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
            
            <div className="grid grid-cols-1 gap-4">
              {/* Main Writing Card with Two Text Boxes */}
              <Card className="shadow-lg">
                {/* Analysis Box (Read-only) */}
                <CardHeader className="border-b pb-2">
                  <CardTitle className="text-sm font-medium">Text Analysis</CardTitle>
                  <CardDescription className="text-xs">
                    Auto-updates every 3 seconds
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-b p-4">
                  <EnhancedEditor 
                    ref={analysisEditorRef}
                    value={text} 
                    onChange={(val: any) => {/* Read-only - no changes */}} 
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
                
                {/* Input Box (Editable) */}
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Write Your Text</CardTitle>
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
        documents={documents.map((d: any) => ({ id: d.id, title: d.title }))}
      />
      
      <Dialog open={showNewDocModal} onOpenChange={setShowNewDocModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Document</DialogTitle></DialogHeader>
          <Input placeholder="Enter document title" value={newDocTitle} onChange={(e: any) => setNewDocTitle(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && handleCreateDocument()} />
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
