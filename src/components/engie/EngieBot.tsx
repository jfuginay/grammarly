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

  // Track mouse position globally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handler = (e: MouseEvent) => {
      (window as any).__engieMousePos = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  // On every keydown, step Engie toward mouse
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const step = () => controller.stepTowardMouse();
    window.addEventListener('keydown', step);
    return () => window.removeEventListener('keydown', step);
  }, [controller]);

  // Initialize proper position on client-side mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('EngieBot component mounted');
    // Recalculate position after component mounts to get real window dimensions
    const stateManager = controller.getStateManager();
    const currentPos = stateManager.getState().engiePos;
    
    // If we're using the SSR fallback position, recalculate
    if (currentPos.x === 100 && currentPos.y === 100) {
      stateManager.resetEngiePosition();
    }
    
    // Force a position update to ensure visibility
    setTimeout(() => {
      stateManager.resetEngiePosition();
    }, 100);
  }, [controller]);

  // Handle window resize to keep Engie within bounds
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      const { x, y } = state.engiePos;
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;
      
      if (x > maxX || y > maxY) {
        controller.getStateManager().setEngiePos({
          x: Math.min(x, maxX),
          y: Math.min(y, maxY)
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.engiePos, controller]);

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
  const handleTabChange = (tab: string) => controller.getStateManager().setActiveTab(tab);
  const dismissNotification = (index: number) => controller.dismissNotification(index);
  const handleDrag = (e: any, data: any) => controller.handleDrag(e, data);
  const onStartDrag = () => controller.onStartDrag();
  const onStopDrag = () => controller.onStopDrag();
  const formatScore = (score: number | undefined | null) => controller.formatScore(score);

  // Grok specific handlers
  const handleToggleGrokMode = () => controller.toggleGrokMode();
  const handleResearchWithGrok = (topic: string) => controller.researchWithGrok(topic);

  // Debug logging
  useEffect(() => {
    console.log('Engie position:', state.engiePos);
    console.log('Grok Active:', state.isGrokActive); // Log Grok state
  }, [state.engiePos, state.isGrokActive]);

  return (
    <div id="engie-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
      <Draggable
        nodeRef={engieRef}
        defaultPosition={{ x: state.engiePos.x, y: state.engiePos.y }}
        onStart={onStartDrag}
        onDrag={handleDrag}
        onStop={onStopDrag}
        handle=".engie-handle"
        bounds="parent"
      >
        <div 
          ref={engieRef} 
          style={{ 
            pointerEvents: 'auto', // Re-enable pointer events for the bot
            position: 'absolute'
          }}
        >
          <div className="relative">
            {/* The Bot */}
            <div 
              className={`engie-handle engie-bot-wrapper facing-${state.botDirection}`}
              onClick={handleEngieTrigger}
              role="button"
              tabIndex={0}
              aria-label="Open Engie Assistant"
              style={{
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab'
              }}
            >
              <AnimatedEngieBot 
                animationState={state.botAnimation} 
                speed={state.botSpeed} 
                direction={state.botDirection}
                emotion={state.botEmotion}
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
                
                {/* Emotion reason tooltip (only show when emotion is not neutral) */}
                {state.emotionReason && state.botEmotion !== 'neutral' && (
                  <motion.div 
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs shadow-md z-20"
                  >
                    {state.emotionReason}
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
                    onTabChange={handleTabChange}
                    formatScore={formatScore}
                    // Pass Grok related props
                    grokChatHistory={state.grokChatHistory}
                    handleToggleGrokMode={handleToggleGrokMode}
                    handleResearchWithGrok={handleResearchWithGrok}
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