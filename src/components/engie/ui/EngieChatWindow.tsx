import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Zap, Users, Code, Briefcase, MessageSquare, Eye, EyeOff, Timer, Coffee } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuggestionsTab } from './tabs/SuggestionsTab';
import { ToneTab } from './tabs/ToneTab';
import { GrokTab } from './tabs/GrokTab'; // Import GrokTab
import { IdeationCard } from './cards/IdeationCard';
import { EncouragementCard } from './cards/EncouragementCard';
import { ChatMessage, ToneAnalysis, Suggestion, EngieState } from '../types';
import { Switch } from '@/components/ui/switch'; // Import Switch
import { Input } from '@/components/ui/input'; // Import Input
import { Label } from '@/components/ui/label'; // Import Label
import AnimatedEngieBot from '../../AnimatedEngieBot';
import styles from './EngieChatWindow.module.css'; // Import CSS module


interface EngieChatWindowProps {
  // popupPositionClass?: string; // Optional: if specific styles needed on the window itself based on position
  state: EngieState;
  grokChatHistory: ChatMessage[];
  activeSuggestions: Suggestion[];
  currentSuggestion: Suggestion | null;
  documents: Array<{ id: string; title: string }>;
  onClose: () => void;
  onApply: () => void;
  onDismiss: () => void;
  onNext: () => void;
  onDismissIdeation: () => void;
  onManualIdeate: () => void;
  onTabChange: (tab: string) => void;
  formatScore: (score: number | undefined | null) => string;
  handleToggleGrokMode: () => void;
  handleResearchWithGrok: (topic: string) => void;
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
  handleToggleGrokMode,
  handleResearchWithGrok,
  onSendGrokMessage,
  grokLoading,
  grokError,
}) => {
  const [researchTopic, setResearchTopic] = React.useState('');
  const [grokInput, setGrokInput] = React.useState('');
        {/* Grok chat input for arbitrary prompts */}
        {state.isGrokActive && (
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
      // If Grok is active, prefer its history, potentially mixed with main for context
      // For now, let's just show Grok history when it's active and has messages.
      // Or, show a mix depending on your logic.
      // This example prioritizes Grok history if active, otherwise main chat.
      combined = [...grokChatHistory];
    } else if (state.chatHistory.length > 0) {
      combined = [...state.chatHistory];
    }
    // You might want to merge and sort by a timestamp if messages had them.
    // For now, if Grok is active, its history is shown.
    // If Grok is not active, the normal chat history is shown.
    // If Grok is active but its history is empty, nothing from Grok is shown yet.
    return combined;
  }, [state.isGrokActive, grokChatHistory, state.chatHistory]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      // Apply the base class from the CSS module
      // The specific position classes (e.g., popup-top-left) are on the parent div in EngieBot.tsx
      // The styles in EngieChatWindow.module.css use these parent classes to position the ::before pseudo-element for the arrow
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

        {/* Ideation Message Display */}
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


        {state.ideationMessage && !activeSuggestions.length && !state.encouragementMessageApi && !state.isGrokActive && (
          <IdeationCard 
            message={state.ideationMessage}
            onDismiss={onDismissIdeation}
          />
        )}

        {/* Encouragement Message Display */}
        {state.encouragementMessageApi && !activeSuggestions.length && !state.toneAnalysisResult && !state.ideationMessage && !state.isGrokActive && (
          <EncouragementCard message={state.encouragementMessageApi} />
        )}

        {!state.ideationMessage && !state.encouragementMessageApi && (
          <Tabs value={state.activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3"> {/* Updated to grid-cols-3 */}
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="tone">Tone</TabsTrigger>
              <TabsTrigger value="grok">Grok</TabsTrigger> {/* New Grok Tab Trigger */}
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

            {/* Grok Tab Content */}
            <TabsContent value="grok">
              <GrokTab
                isGrokActive={state.isGrokActive}
                grokEndTime={state.grokEndTime}
                researchTopic={researchTopic}
                onResearchTopicChange={setResearchTopic}
                onToggleGrokMode={handleToggleGrokMode}
                onResearchWithGrok={handleResearchWithGrok}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Fallback "Looking good" or "Brainstorm" button - Conditionally render if Grok not active */}
        {!currentSuggestion && !state.toneAnalysisResult && !state.overallPageToneAnalysis && 
         !state.ideationMessage && !state.encouragementMessageApi && !state.isIdeating && !state.isGrokActive && (
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