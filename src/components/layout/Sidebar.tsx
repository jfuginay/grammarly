import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Book, Settings, LifeBuoy, FileText } from 'lucide-react';
import Logo from '../Logo';

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  documents: Document[];
  activeDocument: Document | null;
  onSelectDocument: (doc: Document) => void;
  onCreateDocument: () => void;
}

const Sidebar = ({ documents, activeDocument, onSelectDocument, onCreateDocument }: SidebarProps) => {
  return (
    <aside className="w-72 flex flex-col h-screen p-4 border-r bg-card text-card-foreground">
      <div className="px-2 mb-8">
        <Logo />
      </div>
      
      <Button 
        className="premium-button-gradient mb-8 shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30" 
        onClick={onCreateDocument}
      >
        <Plus className="h-4 w-4 mr-1" />
        New Document
      </Button>

      <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents</h2>
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {documents.map(doc => (
          <a 
            key={doc.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectDocument(doc);
            }} 
            className={`premium-sidebar-item ${activeDocument?.id === doc.id ? 'premium-sidebar-item-active' : ''}`}
          >
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{doc.title}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <a href="#" className="premium-sidebar-item">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </a>
        <a href="#" className="premium-sidebar-item">
          <LifeBuoy className="h-4 w-4" />
          <span>Help & Support</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar; 