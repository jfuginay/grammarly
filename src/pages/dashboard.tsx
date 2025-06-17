import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FilePlus, Menu, Save, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import Header from '@/components/Header';

// Type definitions
interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style';
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

const DashboardPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  const [text, setText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState<boolean>(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
        setIsAuthLoading(false);
      }
    };
    checkSession();
  }, [router, supabase]);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    try {
        const response = await fetch('/api/documents');
        if (!response.ok) throw new Error('Could not fetch documents');
        let docs: Document[] = await response.json();

        if (docs.length === 0) {
            // This is a new user or a user with no documents. Create one.
            const createResponse = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Untitled Document', content: '' }),
            });
            if (!createResponse.ok) throw new Error('Could not create initial document');
            docs = [await createResponse.json()];
        }
        
        const sortedDocs = docs.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setDocuments(sortedDocs);
        
        const activeDocStillExists = activeDocument && sortedDocs.some(d => d.id === activeDocument.id);
        if (!activeDocStillExists && sortedDocs.length > 0) {
            setActiveDocument(sortedDocs[0]);
            setText(sortedDocs[0].content);
        }

    } catch (error) {
        console.error("Failed to fetch documents:", error);
        toast({ title: "Error", description: "Could not load your documents.", variant: "destructive" });
    }
  }, [user, activeDocument]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

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

  const debouncedUpdateDocument = useDebouncedCallback(async (docId: string, data: { content?: string; title?: string }) => {
    try {
      await fetch(`/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      toast({ title: "Saved", duration: 2000 });

      setDocuments((docs: Document[]) =>
        docs.map((d: Document) => d.id === docId ? { ...d, ...data, updatedAt: new Date().toISOString() } : d)
            .sort((a: Document, b: Document) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

    } catch (error) {
      console.error(error);
      toast({ title: "Save Error", description: "Failed to save changes.", variant: "destructive" });
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
    if (activeDocument && newTitle.trim() && newTitle.trim() !== activeDocument.title) {
      setActiveDocument((doc: Document | null) => doc ? {...doc, title: newTitle.trim()} : null);
      debouncedUpdateDocument(activeDocument.id, { title: newTitle.trim() });
    }
    setIsEditingTitle(false);
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      // After deleting, just refetch the document list from the server
      await fetchDocuments();
      toast({ title: "Success", description: "Document deleted." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not delete the document.", variant: "destructive" });
    }
  };

  const fetchSuggestions = useCallback(async (currentText: string) => {
    if (!currentText.trim() || !showAiSuggestions) {
      setSuggestions([]);
      return;
    }
    setIsSuggestionsLoading(true);
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText }),
      });
      const data = await response.json();
      if (response.ok) {
        const suggestionsWithIds = (data.suggestions || []).map((s: Omit<Suggestion, 'id'>, index: number) => ({
          ...s,
          id: `${s.original}-${index}`,
        }));
        setSuggestions(suggestionsWithIds);
      } else {
        throw new Error(data.message || 'Failed to fetch suggestions');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [showAiSuggestions]);

  const debouncedFetchSuggestions = useDebouncedCallback(fetchSuggestions, 1000);

  useEffect(() => {
    if (text) {
        debouncedFetchSuggestions(text);
    } else {
        setSuggestions([]);
    }
  }, [text, debouncedFetchSuggestions]);

  const applySuggestion = (suggestionToApply: Suggestion) => {
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

    setText(newText);
    setSuggestions(prevSuggestions => prevSuggestions.filter(s => s.id !== suggestionToApply.id));

    if (activeDocument) {
        debouncedUpdateDocument(activeDocument.id, { content: newText });
    }
    debouncedFetchSuggestions(newText);
  };

  // Components
  const DocumentSidebar = () => (
    <div className="bg-gray-50 dark:bg-gray-950/50 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button size="sm" variant="outline" onClick={() => handleNewDocument()}><FilePlus className="h-4 w-4 mr-2" />New</Button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {documents.map((doc: Document) => (
          <div
            key={doc.id}
            className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${activeDocument?.id === doc.id ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
            onClick={() => handleSelectDocument(doc)}
          >
            <div className="font-medium truncate">{doc.title}</div>
            <div className="text-xs text-gray-500 truncate">{doc.content || 'No content'}</div>
            <div className="text-xs text-gray-400 mt-1">{new Date(doc.updatedAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const severityColorMap: { [key in Suggestion['severity']]: string } = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-blue-500',
  };

  if (isAuthLoading) {
    return (
        <div className="h-screen w-screen flex justify-center items-center">
            <div>Loading...</div>
        </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-white dark:bg-gray-950 flex flex-col">
       <Header user={user} />
       <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block md:w-72 lg:w-80 h-full">
            <DocumentSidebar />
          </div>

          <main className="flex-1 flex flex-col p-4 md:p-6 h-full overflow-hidden">
            <header className="flex-grow-0 flex justify-between items-center mb-4">
              {activeDocument && isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()} autoFocus className="text-2xl font-bold bg-transparent border-b"/>
                  <Button size="sm" onClick={handleTitleSave}><Save className="h-4 w-4"/></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold">{activeDocument?.title || 'Loading...'}</h1>
                  {activeDocument && <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                      if (activeDocument) {
                        setNewTitle(activeDocument.title);
                        setIsEditingTitle(true);
                      }
                  }}>
                    <Edit className="h-5 w-5"/>
                  </Button>}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Writing Settings</Button>
                <Button variant="outline" size="sm">Analysis</Button>
                <Button variant="outline" size="sm" className='bg-purple-100 text-purple-700'>AI Assistant</Button>
                 {activeDocument && <Button size="icon" variant="ghost" className='text-red-500 hover:bg-red-100 hover:text-red-600' onClick={() => handleDeleteDocument(activeDocument.id)}><Trash2 className="h-4 w-4"/></Button>}
              </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0">
                <Card className="flex-1 flex flex-col">
                  <CardContent className="flex-1 flex p-1">
                    <Textarea
                      value={text}
                      onChange={handleTextChange}
                      placeholder="Create your first document to get started or select one from the sidebar."
                      className="w-full h-full text-base resize-none border-0 focus:ring-0 p-4"
                      disabled={!activeDocument}
                    />
                  </CardContent>
                </Card>
              </div>

              <aside className={`w-80 lg:w-96 flex-col gap-4 ${showAiSuggestions ? 'flex' : 'hidden'}`}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold">AI Writing Assistant</CardTitle>
                        <Switch
                            checked={showAiSuggestions}
                            onCheckedChange={setShowAiSuggestions}
                            aria-label="Toggle AI Suggestions"
                        />
                    </CardHeader>
                </Card>
                <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                  {isSuggestionsLoading && <p className='text-center text-gray-500'>Loading suggestions...</p>}
                  {!isSuggestionsLoading && suggestions.length === 0 && showAiSuggestions && text && <div className="text-center text-gray-500 pt-10">No suggestions found.</div>}
                  {!isSuggestionsLoading && !text && <div className="text-center text-gray-500 pt-10">Start typing to get suggestions.</div>}
                  {suggestions.map((s) => (
                    <Card key={s.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className={`h-2.5 w-2.5 rounded-full ${severityColorMap[s.severity]}`}></span>
                          {s.type}
                          <Badge variant="outline" className="font-normal">{s.severity}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-through">"{s.original}"</p>
                        <p className="text-sm font-medium text-green-600 mb-3">"{s.suggestion}"</p>
                        <p className="text-xs text-gray-500 mb-4">{s.explanation}</p>
                        <Button onClick={() => applySuggestion(s)} size="sm" className="w-full">Apply Suggestion</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </aside>
            </div>
          </main>

          <div className="md:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-20 bg-white dark:bg-gray-800 shadow-lg">
                <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <DocumentSidebar />
            </SheetContent>
            </Sheet>
          </div>
       </div>
    </div>
  );
};

export default DashboardPage;