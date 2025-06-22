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
import { EngieProps, EngieState } from './types';
import styles from './EngieBot.module.css';

export const EngieBot: React.FC<EngieProps> = (props) => {
  const [controller] = useState(() => new EngieController(props));
  const [state, setState] = useState(controller.getStateManager().getState());
  const engieRef = useRef<HTMLDivElement>(null);

  // Computed values
  const activeSuggestions = controller.getStateManager().getActiveSuggestions(props.suggestions);
  const currentSuggestion = controller.getStateManager().getCurrentSuggestion(props.suggestions);
  const unreadCount = controller.getStateManager().getUnreadCount();

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = controller.getStateManager().subscribe((newState: EngieState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [controller]);

  // Simple popup positioning using CSS relative positioning
  const calculatePopupPosition = () => {
    if (!engieRef.current) return { position: 'above' as const };

    const engieRect = engieRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const popupWidth = 320;
    const popupHeight = 400;
    const gap = 10;

    // Check available space in each direction
    const spaceRight = windowWidth - (engieRect.right + gap);
    const spaceLeft = engieRect.left - gap;
    const spaceBottom = windowHeight - (engieRect.bottom + gap);
    const spaceTop = engieRect.top - gap;

    // Determine best position
    if (spaceRight >= popupWidth && spaceBottom >= popupHeight) {
      return { position: 'right' as const };
    } else if (spaceLeft >= popupWidth && spaceBottom >= popupHeight) {
      return { position: 'left' as const };
    } else if (spaceBottom >= popupHeight) {
      return { position: 'below' as const };
    } else if (spaceTop >= popupHeight) {
      return { position: 'above' as const };
    } else {
      // Fallback: find the direction with most space
      const spaces = [
        { direction: 'right', space: spaceRight },
        { direction: 'left', space: spaceLeft },
        { direction: 'below', space: spaceBottom },
        { direction: 'above', space: spaceTop }
      ];
      
      const bestSpace = spaces.reduce((max, current) => 
        current.space > max.space ? current : max
      );
      
      return { position: bestSpace.direction as any };
    }
  };

  const popupPosition = calculatePopupPosition();

  // Get the appropriate CSS class based on position
  const getPopupClass = () => {
    switch (popupPosition.position) {
      case 'right':
        return styles.engiePopupRight;
      case 'left':
        return styles.engiePopupLeft;
      case 'below':
        return styles.engiePopupBelow;
      default:
        return styles.engiePopup;
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Recalculate position on resize
      if (state.isChatOpen) {
        // Force re-render to recalculate position
        controller.handleEngieClose();
        setTimeout(() => controller.handleEngieTrigger(), 10);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.isChatOpen, controller]);

  // Mouse following logic - simplified for now
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      controller.updateMousePosition(e.clientX, e.clientY);
    };

    const step = () => controller.stepTowardMouse();
    const interval = setInterval(step, 16);

    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      clearInterval(interval);
    };
  }, [controller]);

  // Event handlers
  const handleEngieTrigger = () => {
    controller.handleEngieTrigger();
  };

  const handleEngieClose = () => {
    controller.handleEngieClose();
  };

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

  // Grok handlers
  const handleSendGrokMessage = async (prompt: string) => {
    try {
      await controller.sendGrokMessage(prompt);
    } catch (error) {
      console.error('Error sending Grok message:', error);
    }
  };

  const handleToggleGrokMode = () => controller.toggleGrokMode();
  const handleResearchWithGrok = (topic: string) => controller.researchWithGrok(topic);

  // Engie is always visible - removed visibility check
  return (
    <>
      {/* Engie Container with Relative Positioning */}
      <div className={styles.engieContainer}>
        {/* Engie Character */}
        <Draggable
          onDrag={handleDrag}
          onStart={onStartDrag}
          onStop={onStopDrag}
        >
          <motion.div
            ref={engieRef}
            className="engie-character cursor-pointer"
            onClick={handleEngieTrigger}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'fixed',
              left: state.engiePos.x,
              top: state.engiePos.y,
              zIndex: 1000,
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <AnimatedEngieBot
              animationState={state.botAnimation}
              speed={state.botSpeed}
              direction={state.botDirection}
              emotion={state.botEmotion}
            />
            
            {/* Writing Status Badge */}
            {state.isScanning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-2"
              >
                <Badge variant="secondary" className="text-xs px-1 py-0.5">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Scanning
                </Badge>
              </motion.div>
            )}
          </motion.div>
        </Draggable>

        {/* Popup positioned relative to Engie */}
        <AnimatePresence>
          {state.isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className={getPopupClass()}
              style={{
                zIndex: 1001,
                maxWidth: '320px',
                whiteSpace: 'normal'
              }}
            >
              <EngieChatWindow
                state={state}
                grokChatHistory={state.grokChatHistory}
                activeSuggestions={activeSuggestions}
                currentSuggestion={currentSuggestion}
                documents={props.documents || []}
                onClose={handleEngieClose}
                onApply={handleApply}
                onDismiss={handleDismiss}
                onNext={handleNext}
                onDismissIdeation={handleDismissIdeation}
                onManualIdeate={handleManualIdeate}
                onTabChange={handleTabChange}
                formatScore={formatScore}
                handleToggleGrokMode={handleToggleGrokMode}
                handleResearchWithGrok={handleResearchWithGrok}
                onSendGrokMessage={handleSendGrokMessage}
                grokLoading={false}
                grokError={null}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications */}
        <EngieNotifications
          unreadCount={unreadCount}
          notificationOpen={state.notificationOpen}
          ideaNotifications={state.ideaNotifications}
          onDismissNotification={dismissNotification}
        />
      </div>
    </>
  );
};
