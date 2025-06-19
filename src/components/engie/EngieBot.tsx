import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import AnimatedEngieBot from '../AnimatedEngieBot';
import { EngieController } from './core/EngieController';
import { EngieNotifications } from './ui/EngieNotifications';
import { EngieChatWindow } from './ui/EngieChatWindow';
import { EngieProps } from './types';

export const EngieBot: React.FC<EngieProps> = (props) => {
  const [controller] = useState(() => new EngieController(props));
  const [state, setState] = useState(controller.getStateManager().getState());
  const engieRef = useRef<HTMLDivElement>(null);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = controller.getStateManager().subscribe(setState);
    return unsubscribe;
  }, [controller]);

  // Cleanup on unmount
  useEffect(() => {
    return () => controller.cleanup();
  }, [controller]);

  // Computed values
  const activeSuggestions = controller.getStateManager().getActiveSuggestions(props.suggestions);
  const currentSuggestion = controller.getStateManager().getCurrentSuggestion(props.suggestions);
  const unreadCount = controller.getStateManager().getUnreadCount();

  // Event handlers
  const handleEngieTrigger = () => controller.handleEngieTrigger();
  const handleEngieClose = () => controller.handleEngieClose();
  const handleApply = () => controller.handleApply();
  const handleDismiss = () => controller.handleDismiss();
  const handleNext = () => controller.handleNext();
  const handleDismissIdeation = () => controller.handleDismissIdeation();
  const handleManualIdeate = () => controller.handleManualIdeate();
  const handleAnalyzeStyle = () => controller.handleAnalyzeStyle();
  const handleDocSelectionChange = (docId: string) => controller.handleDocSelectionChange(docId);
  const handleTabChange = (tab: string) => controller.getStateManager().setActiveTab(tab);
  const handleStyleModalOpenChange = (isOpen: boolean) => controller.getStateManager().setStyleModalOpen(isOpen);
  const dismissNotification = (index: number) => controller.dismissNotification(index);
  const handleDrag = (e: any, data: any) => controller.handleDrag(e, data);
  const onStartDrag = () => controller.onStartDrag();
  const onStopDrag = () => controller.onStopDrag();
  const formatScore = (score: number | undefined | null) => controller.formatScore(score);

  return (
    <div id="engie-container">
      <Draggable
        nodeRef={engieRef}
        bounds="parent"
        onStart={onStartDrag}
        onDrag={handleDrag}
        onStop={onStopDrag}
        handle=".engie-handle"
      >
        <div ref={engieRef} className="fixed z-50" style={{ left: state.engiePos.x, top: state.engiePos.y }}>
          <div className="relative">
            {/* The Bot */}
            <div 
              className={`engie-handle engie-bot-wrapper facing-${state.botDirection}`}
              onClick={handleEngieTrigger}
              role="button"
              tabIndex={0}
              aria-label="Open Engie Assistant"
            >
              <AnimatedEngieBot 
                animationState={state.botAnimation} 
                speed={state.botSpeed} 
                direction={state.botDirection} 
              />
              
              {/* Status indicators overlaid on the bot */}
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                {(state.isScanning || state.isIdeating) && !state.isChatOpen && (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                )}
                {activeSuggestions.length > 0 && !state.isChatOpen && !(state.isScanning || state.isIdeating) && (
                  <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                    <Badge variant="destructive" className="absolute top-0 right-0">
                      {activeSuggestions.length}
                    </Badge>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <EngieNotifications
              unreadCount={unreadCount}
              notificationOpen={state.notificationOpen}
              ideaNotifications={state.ideaNotifications}
              onDismissNotification={dismissNotification}
            />

            {/* Chat Window */}
            <div className="absolute top-0 left-full ml-4">
              <AnimatePresence>
                {state.isChatOpen && (
                  <EngieChatWindow
                    state={state}
                    activeSuggestions={activeSuggestions}
                    currentSuggestion={currentSuggestion}
                    documents={props.documents}
                    onClose={handleEngieClose}
                    onApply={handleApply}
                    onDismiss={handleDismiss}
                    onNext={handleNext}
                    onDismissIdeation={handleDismissIdeation}
                    onManualIdeate={handleManualIdeate}
                    onAnalyzeStyle={handleAnalyzeStyle}
                    onDocSelectionChange={handleDocSelectionChange}
                    onTabChange={handleTabChange}
                    onStyleModalOpenChange={handleStyleModalOpenChange}
                    formatScore={formatScore}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Draggable>
    </div>
  );
}; 