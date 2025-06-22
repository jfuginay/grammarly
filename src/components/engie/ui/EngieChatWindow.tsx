import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Zap, Users, Code, Briefcase, MessageSquare, Eye, EyeOff, Timer, Coffee } from 'lucide-react';
// Removed Tabs and SuggestionsTab imports - suggestions now handled by Priority Issues panel
import { ToneTab } from './tabs/ToneTab';
// import { GrokTab } from './tabs/GrokTab'; // GrokTab import removed
import { IdeationCard } from './cards/IdeationCard';
import { EncouragementCard } from './cards/EncouragementCard';
import { ChatMessage, ToneAnalysis, Suggestion, EngieState } from '../types';
// import { Switch } from '@/components/ui/switch'; // Removed unused import
import { Input } from '@/components/ui/input'; // Import Input
// import { Label } from '@/components/ui/label'; // Removed unused import
import AnimatedEngieBot from '../../AnimatedEngieBot';
import styles from './EngieChatWindow.module.css'; // Import CSS module


interface EngieChatWindowProps {
  state: EngieState;
  grokChatHistory: ChatMessage[];
  activeSuggestions: Suggestion[]; // Keep for compatibility but not used in UI
  currentSuggestion: Suggestion | null; // Keep for compatibility but not used in UI
  documents: Array<{ id: string; title: string }>;
  onClose: () => void;
  onApply: () => void; // Keep for compatibility but not used in UI
  onDismiss: () => void; // Keep for compatibility but not used in UI
  onNext: () => void; // Keep for compatibility but not used in UI
  onDismissIdeation: () => void;
  onManualIdeate: () => void;
  onTabChange: (tab: string) => void; // Keep for compatibility but not used in UI
  formatScore: (score: number | undefined | null) => string;
  // handleToggleGrokMode: () => void; // Removed as Grok toggle is removed
  handleResearchWithGrok: (topic: string) => void; // This might be removed if research UI is fully gone
  onSendGrokMessage?: (prompt: string) => void;
  grokLoading?: boolean;
  grokError?: string | null;
}


export const EngieChatWindow: React.FC<EngieChatWindowProps> = ({
  state,
  grokChatHistory,
  activeSuggestions,
  currentSuggestion,
  documents,
  onClose,
  onApply,
  onDismiss,
  onNext,
  onDismissIdeation,
  onManualIdeate,
  onTabChange,
  formatScore,
  // handleToggleGrokMode, // Removed
  handleResearchWithGrok, // Keep for now, though its UI in GrokTab is gone
  onSendGrokMessage,
  grokLoading,
  grokError,
}) => {
  const [researchTopic, setResearchTopic] = React.useState(''); // Keep for now, though its UI in GrokTab is gone
  const [grokInput, setGrokInput] = React.useState('');
        {/* Grok chat input for arbitrary prompts */}
        {state.isGrokActive && ( // This condition might need re-evaluation based on how 'isGrokActive' is used post-toggle-removal
          <form
            className="flex gap-2 mt-2"
            onSubmit={e => {
              e.preventDefault();
              if (grokInput.trim() && onSendGrokMessage) {
                onSendGrokMessage(grokInput.trim());
                setGrokInput('');
              }
            }}
          >
            <Input
              value={grokInput}
              onChange={e => setGrokInput(e.target.value)}
              placeholder="Ask Grok anything..."
              disabled={grokLoading}
              className="flex-1"
              aria-label="Grok chat input"
            />
            <Button type="submit" disabled={grokLoading || !grokInput.trim()}>
              {grokLoading ? 'Sending...' : 'Send'}
            </Button>
          </form>
        )}
        {grokError && (
          <div className="text-xs text-red-500 mt-1">{grokError}</div>
        )}

  const combinedChatHistory = React.useMemo(() => {
    let combined: ChatMessage[] = [];
    if (state.isGrokActive && grokChatHistory.length > 0) {
      combined = [...grokChatHistory];
    } else if (state.chatHistory.length > 0) {
      combined = [...state.chatHistory];
    }
    return combined;
  }, [state.isGrokActive, grokChatHistory, state.chatHistory]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${styles.chatWindow} mb-4 w-[calc(100vw-2.5rem)] sm:w-80 max-w-xs rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden`}
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

        {/* Display Grok Chat History if active */}
        {state.isGrokActive && grokChatHistory.length > 0 && (
          <div className="mb-4 space-y-2">
            {grokChatHistory.map((msg, index) => (
              <div key={`grok-msg-${index}`} className={`p-2 rounded-md text-sm ${
                msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-auto' : 'bg-purple-100 dark:bg-purple-900'
              } max-w-[85%]`}>
                <span className="font-bold capitalize">{msg.role === 'assistant' ? 'Grok' : msg.role}: </span>
                {msg.content}
              </div>
            ))}
          </div>
        )}

        {/* Display normal chat history if Grok is not active or its history is empty */}
        {!state.isGrokActive && state.chatHistory.length > 0 && (
           <div className="mb-4 space-y-2">
            {state.chatHistory.map((msg, index) => (
              <div key={`chat-msg-${index}`} className={`p-2 rounded-md text-sm ${
                msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-auto' : 'bg-gray-100 dark:bg-gray-700'
              } max-w-[85%]`}>
                <span className="font-bold capitalize">{msg.role}: </span>
                {msg.content}
              </div>
            ))}
          </div>
        )}

        {/* DEBUG: Log ideation message rendering conditions */}
        {(() => {
          console.log('🔍 EngieChatWindow - Ideation Message Debug:', {
            hasIdeationMessage: !!state.ideationMessage,
            ideationContent: state.ideationMessage?.content?.substring(0, 50) || 'none',
            activeSuggestionsLength: activeSuggestions.length,
            hasEncouragementMessage: !!state.encouragementMessageApi,
            isGrokActive: state.isGrokActive,
            shouldShowIdeation: !!(state.ideationMessage && !activeSuggestions.length && !state.encouragementMessageApi && !state.isGrokActive)
          });
          return null;
        })()}

        {state.ideationMessage && !state.encouragementMessageApi && !state.isGrokActive && (
          <IdeationCard 
            message={state.ideationMessage}
            onDismiss={onDismissIdeation}
          />
        )}

        {state.encouragementMessageApi && !state.toneAnalysisResult && !state.ideationMessage && !state.isGrokActive && (
          <EncouragementCard message={state.encouragementMessageApi} />
        )}

        {!state.ideationMessage && !state.encouragementMessageApi && (
          <div className="w-full">
            {/* Only show tone analysis - no tabs needed */}
            <ToneTab
              toneAnalysisResult={state.toneAnalysisResult}
              overallPageToneAnalysis={state.overallPageToneAnalysis}
              formatScore={formatScore}
            />
          </div>
        )}

        {/* Fallback "Looking good" or "Brainstorm" button - Show when no tone analysis available */}
        {!state.toneAnalysisResult && !state.overallPageToneAnalysis && 
         !state.ideationMessage && !state.encouragementMessageApi && !state.isIdeating && !state.isGrokActive && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Looking good! No tone analysis available yet.</p>
            <Button variant="link" size="sm" className="mt-2" onClick={onManualIdeate}>
              Want to brainstorm ideas?
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};