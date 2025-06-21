import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, BarChart2, Plus } from 'lucide-react';

export default function ButtonShowcase() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => setIsCreating(false), 2000);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-10 text-center">Button Style Showcase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6">New Document Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Header Button</h3>
              <Button 
                className="premium-button-gradient shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30" 
                onClick={handleCreate}
              >
                <FilePlus className="h-4 w-4 mr-1" />
                New Document
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Sidebar Button</h3>
              <Button 
                className="premium-button-gradient shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30" 
                onClick={handleCreate}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Document
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Empty State Button</h3>
              <Button 
                className="premium-button-gradient shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30" 
                onClick={handleCreate}
              >
                <FilePlus className="h-4 w-4 mr-1" />
                Create Document
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Ghost Button</h3>
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-blue-600 transition-colors duration-200"
              >
                <FilePlus className="h-4 w-4 mr-1" />
                New Document
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-6">Action Buttons</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Analyze Button (Default)</h3>
              <Button 
                size="sm" 
                className="analyze-button"
                onClick={handleAnalyze}
              >
                <BarChart2 className="h-4 w-4 mr-1" />
                Analyze Now
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Analyze Button (Loading)</h3>
              <Button 
                size="sm" 
                className="analyze-button loading-pulse"
                disabled
              >
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
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Create Button (Default)</h3>
              <Button 
                className="premium-button-gradient"
                onClick={handleCreate}
              >
                Create
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Create Button (Loading)</h3>
              <Button 
                className="premium-button-gradient loading-pulse"
                disabled
              >
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
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Cancel Button</h3>
              <Button 
                variant="outline" 
                className="transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
