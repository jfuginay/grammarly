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
  const [popupPosition, setPopupPosition] = useState<'above' | 'below' | 'left' | 'right'>('above');

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

  // Calculate popup position relative to Engie
  const calculatePopupPosition = () => {
    if (!engieRef.current) return 'above';

    const engieRect = engieRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const popupWidth = 320;
    const popupHeight = 400;
    const gap = 15;

    // Check available space in each direction
    const spaceRight = windowWidth - (engieRect.right + gap);
    const spaceLeft = engieRect.left - gap;
    const spaceBottom = windowHeight - (engieRect.bottom + gap);
    const spaceTop = engieRect.top - gap;

    // Determine best position based on available space
    if (spaceRight >= popupWidth) {
      return 'right';
    } else if (spaceLeft >= popupWidth) {
      return 'left';
    } else if (spaceTop >= popupHeight) {
      return 'above';
    } else {
      return 'below';
    }
  };

  // Update popup position when chat opens or Engie moves
  useEffect(() => {
    if (state.isChatOpen && engieRef.current) {
      const newPosition = calculatePopupPosition();
      setPopupPosition(newPosition);
    }
  }, [state.isChatOpen, state.engiePos.x, state.engiePos.y]);

  // Get popup styles based on position
  const getPopupStyles = () => {
    if (!engieRef.current) return {};

    const engieRect = engieRef.current.getBoundingClientRect();
    const gap = 15;

    switch (popupPosition) {
      case 'right':
        return {
          position: 'fixed' as const,
          left: engieRect.right + gap,
          top: engieRect.top,
          transform: 'translateY(-50%)',
        };
      case 'left':
        return {
          position: 'fixed' as const,
          right: window.innerWidth - engieRect.left + gap,
          top: engieRect.top,
          transform: 'translateY(-50%)',
        };
      case 'below':
        return {
          position: 'fixed' as const,
          left: engieRect.left + (engieRect.width / 2),
          top: engieRect.bottom + gap,
          transform: 'translateX(-50%)',
        };
      default: // above
        return {
          position: 'fixed' as const,
          left: engieRect.left + (engieRect.width / 2),
          bottom: window.innerHeight - engieRect.top + gap,
          transform: 'translateX(-50%)',
        };
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (state.isChatOpen) {
        const newPosition = calculatePopupPosition();
        setPopupPosition(newPosition);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.isChatOpen]);

  // Mouse following logic - unified approach
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Store mouse position for later use
      (window as any).__engieMousePos = { x: e.clientX, y: e.clientY };
    };

    const step = () => controller.stepTowardMouse();
    const interval = setInterval(step, 16);

    window.addEventListener('mousemove', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      clearInterval(interval);
    };
  }, [controller]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controller.cleanup();
      controller.getStateManager().cleanup();
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
  
  // Drag handlers - using deltaX/deltaY for smoother dragging
  const handleDrag = (e: any, data: any) => {
    controller.updateEngiePosition(state.engiePos.x + data.deltaX, state.engiePos.y + data.deltaY);
  };
  const onStartDrag = () => controller.onStartDrag();
  const onStopDrag = () => controller.onStopDrag();
  
  const formatScore = (score: number | undefined | null) => controller.formatScore(score);

  // Grok handlers
  const handleSendGrokMessage = async (prompt: string) => {
    try {
      await controller.sendGrokChatMessage(prompt);
    } catch (error) {
      console.error('Error sending Grok message:', error);
    }
  };

  // Document change handler for new/empty documents
  const handleDocumentChange = (newText: string = '', isNewDocument: boolean = false) => {
    controller.handleDocumentChange(newText, isNewDocument);
  };

  // Expose document change handler globally so parent can call it
  useEffect(() => {
    (window as any).__engieHandleDocumentChange = handleDocumentChange;
    return () => {
      delete (window as any).__engieHandleDocumentChange;
    };
  }, []);

  return (
    <>
      {/* Engie Character - Using Draggable for manual drag, motion for autonomous movement */}
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
          animate={{
            x: state.engiePos.x,
            y: state.engiePos.y,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.8
          }}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1000,
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: state.isDragLocked ? 'not-allowed' : 'pointer'
          }}
        >
          <AnimatedEngieBot
            animationState={state.botAnimation}
            speed={state.botSpeed}
            direction={state.botDirection}
            emotion={state.botEmotion}
          />
          
          {/* Lock indicator when Engie is locked */}
          {state.isDragLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-1 -left-1"
            >
              <Badge variant="secondary" className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-800 border-yellow-300">
                🔒
              </Badge>
            </motion.div>
          )}
          
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
            style={{
              ...getPopupStyles(),
              zIndex: 1001,
              maxWidth: '320px',
              whiteSpace: 'normal'
            }}
            className={`${styles.engiePopup} ${styles[`engiePopup${popupPosition.charAt(0).toUpperCase() + popupPosition.slice(1)}`] || ''}`}
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
              handleResearchWithGrok={() => {}}
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
    </>
  );
};