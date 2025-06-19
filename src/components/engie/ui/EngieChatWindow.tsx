import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuggestionsTab } from './tabs/SuggestionsTab';
import { ToneTab } from './tabs/ToneTab';
import { VoiceTab } from './tabs/VoiceTab';
import { IdeationCard } from './cards/IdeationCard';
import { EncouragementCard } from './cards/EncouragementCard';
import { ChatMessage, ToneAnalysis, Suggestion, EngieState } from '../types';

interface EngieChatWindowProps {
  state: EngieState;
  activeSuggestions: Suggestion[];
  currentSuggestion: Suggestion | null;
  documents: Array<{ id: string; title: string }>;
  onClose: () => void;
  onApply: () => void;
  onDismiss: () => void;
  onNext: () => void;
  onDismissIdeation: () => void;
  onManualIdeate: () => void;
  onAnalyzeStyle: () => void;
  onDocSelectionChange: (docId: string) => void;
  onTabChange: (tab: string) => void;
  onStyleModalOpenChange: (isOpen: boolean) => void;
  formatScore: (score: number | undefined | null) => string;
}

export const EngieChatWindow: React.FC<EngieChatWindowProps> = ({
  state,
  activeSuggestions,
  currentSuggestion,
  documents,
  onClose,
  onApply,
  onDismiss,
  onNext,
  onDismissIdeation,
  onManualIdeate,
  onAnalyzeStyle,
  onDocSelectionChange,
  onTabChange,
  onStyleModalOpenChange,
  formatScore,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="mb-4 w-[calc(100vw-2.5rem)] sm:w-80 max-w-xs rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <header className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className='flex items-center gap-2'>
          <Sparkles className="h-6 w-6 text-purple-500"/>
          <h3 className="font-semibold">Engie</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onClose}
          onTouchStart={state.isTouchDevice ? onClose : undefined}
          aria-label="Close Engie"
          style={{ touchAction: 'manipulation' }}
        >
          <X className="h-4 w-4"/>
        </Button>
      </header>

      <div className="p-4 max-h-[60vh] overflow-y-auto">
        {(state.isScanning || (state.isIdeating && state.statusMessage) || (!state.isIdeating && state.statusMessage && !state.ideationMessage)) && (
          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 italic text-center">
            {state.statusMessage}
          </div>
        )}

        {/* Ideation Message Display */}
        {state.ideationMessage && !activeSuggestions.length && !state.encouragementMessageApi && (
          <IdeationCard 
            message={state.ideationMessage}
            onDismiss={onDismissIdeation}
          />
        )}

        {/* Encouragement Message Display */}
        {state.encouragementMessageApi && !activeSuggestions.length && !state.toneAnalysisResult && !state.ideationMessage && (
          <EncouragementCard message={state.encouragementMessageApi} />
        )}

        {!state.ideationMessage && !state.encouragementMessageApi && (
          <Tabs value={state.activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="tone">Tone</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
            </TabsList>
            
            <TabsContent value="suggestions">
              <SuggestionsTab
                activeSuggestions={activeSuggestions}
                currentSuggestion={currentSuggestion}
                currentSuggestionIndex={state.currentSuggestionIndex}
                onApply={onApply}
                onDismiss={onDismiss}
                onNext={onNext}
              />
            </TabsContent>
            
            <TabsContent value="tone">
              <ToneTab
                toneAnalysisResult={state.toneAnalysisResult}
                overallPageToneAnalysis={state.overallPageToneAnalysis}
                formatScore={formatScore}
              />
            </TabsContent>
            
            <TabsContent value="voice">
              <VoiceTab
                documents={documents}
                selectedDocIds={state.selectedDocIds}
                isStyleModalOpen={state.isStyleModalOpen}
                onDocSelectionChange={onDocSelectionChange}
                onAnalyzeStyle={onAnalyzeStyle}
                onStyleModalOpenChange={onStyleModalOpenChange}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Fallback "Looking good" or "Brainstorm" button */}
        {!currentSuggestion && !state.toneAnalysisResult && !state.overallPageToneAnalysis && 
         !state.ideationMessage && !state.encouragementMessageApi && !state.isIdeating && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Looking good! No immediate suggestions or analysis.</p>
            <Button variant="link" size="sm" className="mt-2" onClick={onManualIdeate}>
              Want to brainstorm ideas?
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 