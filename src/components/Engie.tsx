import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
}

interface EngieProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
}

const severityColorMap: { [key in Suggestion['severity']]: string } = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-blue-500',
};

const Engie: React.FC<EngieProps> = ({ suggestions, onApply, onDismiss, onIdeate }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  useEffect(() => {
    // When the list of suggestions changes (e.g., one is applied/dismissed), reset to the first one.
    setCurrentSuggestionIndex(0);
  }, [suggestions]);

  const currentSuggestion = suggestions.length > 0 ? suggestions[currentSuggestionIndex] : null;

  const handleApply = () => {
    if (currentSuggestion) {
      onApply(currentSuggestion);
    }
  };

  const handleDismiss = () => {
    if (currentSuggestion) {
      onDismiss(currentSuggestion.id);
    }
  };

  const handleNext = () => {
    if(currentSuggestionIndex < suggestions.length - 1) {
        setCurrentSuggestionIndex(prev => prev + 1);
    } else {
        // If it's the last one, dismissing it will clear the list.
        handleDismiss();
    }
  }

  const nodeRef = React.useRef(null);

  return (
    <Draggable handle=".handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className="fixed bottom-10 right-10 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="mb-4 w-80 rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <header className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className='flex items-center gap-2'>
                    <Sparkles className="h-6 w-6 text-purple-500"/>
                    <h3 className="font-semibold">Engie</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsChatOpen(false)}><X className="h-4 w-4"/></Button>
              </header>

              <div className="p-4">
                {currentSuggestion ? (
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                      I have {suggestions.length - currentSuggestionIndex} suggestion(s) for you. Here is the next one:
                    </p>
                    <Card key={currentSuggestion.id}>
                      <CardHeader className="flex flex-row items-center gap-2 p-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${severityColorMap[currentSuggestion.severity]}`}></span>
                        <CardTitle className="text-sm font-semibold">{currentSuggestion.type}</CardTitle>
                        <Badge variant="outline" className="font-normal text-xs">{currentSuggestion.severity}</Badge>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-through">"{currentSuggestion.original}"</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">"{currentSuggestion.suggestion}"</p>
                        <p className="text-xs text-muted-foreground mt-3">{currentSuggestion.explanation}</p>
                      </CardContent>
                    </Card>
                     <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" size="sm" onClick={handleNext}>
                            {currentSuggestionIndex < suggestions.length - 1 ? 'Next' : 'Ignore'}
                        </Button>
                        <Button variant="default" size="sm" onClick={handleApply}>Apply</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Looking good! I don't see any suggestions right now.</p>
                    <Button variant="link" size="sm" className="mt-2" onClick={onIdeate}>Want to brainstorm ideas?</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          className="handle relative p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50 cursor-grab"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9, cursor: 'grabbing' }}
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <Sparkles className="h-8 w-8" />
          {suggestions.length > 0 && !isChatOpen && (
            <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                <Badge variant="destructive" className="absolute -top-1 -right-1">{suggestions.length}</Badge>
            </motion.div>
          )}
        </motion.button>
      </div>
    </Draggable>
  );
};

export default Engie; 