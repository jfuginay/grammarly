import React, { useState, useEffect, useRef, useCallback } from 'react';
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

    // Firefox-specific getBoundingClientRect fix
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const firefoxOffset = isFirefox ? 2 : 0; // Firefox has a known 2px offset issue

    // Check available space in each direction
    const spaceRight = windowWidth - (engieRect.right + gap + firefoxOffset);
    const spaceLeft = engieRect.left - gap - firefoxOffset;
    const spaceBottom = windowHeight - (engieRect.bottom + gap + firefoxOffset);
    const spaceTop = engieRect.top - gap - firefoxOffset;

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
    
    // Firefox-specific positioning fixes
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const firefoxOffset = isFirefox ? 2 : 0;

    switch (popupPosition) {
      case 'right':
        return {
          position: 'fixed' as const,
          left: engieRect.right + gap + firefoxOffset,
          top: engieRect.top + firefoxOffset,
          transform: 'translateY(-50%)',
          // Firefox-specific z-index fix
          zIndex: isFirefox ? 1002 : 1001,
        };
      case 'left':
        return {
          position: 'fixed' as const,
          right: window.innerWidth - engieRect.left + gap + firefoxOffset,
          top: engieRect.top + firefoxOffset,
          transform: 'translateY(-50%)',
          zIndex: isFirefox ? 1002 : 1001,
        };
      case 'below':
        return {
          position: 'fixed' as const,
          left: engieRect.left + (engieRect.width / 2) + firefoxOffset,
          top: engieRect.bottom + gap + firefoxOffset,
          transform: 'translateX(-50%)',
          zIndex: isFirefox ? 1002 : 1001,
        };
      default: // above
        return {
          position: 'fixed' as const,
          left: engieRect.left + (engieRect.width / 2) + firefoxOffset,
          bottom: window.innerHeight - engieRect.top + gap + firefoxOffset,
          transform: 'translateX(-50%)',
          zIndex: isFirefox ? 1002 : 1001,
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

    // Firefox-specific resize handling
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    window.addEventListener('resize', handleResize);
    
    // Firefox needs additional event listeners for proper popup positioning
    if (isFirefox) {
      window.addEventListener('scroll', handleResize);
      window.addEventListener('orientationchange', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (isFirefox) {
        window.removeEventListener('scroll', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, [state.isChatOpen]);

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
  const handleDocumentChange = useCallback((newText: string = '', isNewDocument: boolean = false) => {
    controller.handleDocumentChange(newText, isNewDocument);
  }, [controller]);

  // Expose document change handler globally so parent can call it
  useEffect(() => {
    (window as any).__engieHandleDocumentChange = handleDocumentChange;
    return () => {
      delete (window as any).__engieHandleDocumentChange;
    };
  }, [handleDocumentChange]);

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
              maxWidth: '320px',
              whiteSpace: 'normal'
            }}
            className={`${styles.engiePopup} ${styles[`engiePopup${popupPosition.charAt(0).toUpperCase() + popupPosition.slice(1)}`] || ''}`}
            onAnimationComplete={() => {
              // Firefox-specific forced repaint
              const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
              if (isFirefox) {
                const element = document.querySelector(`.${styles.engiePopup}`) as HTMLElement;
                if (element) {
                  element.style.transform = element.style.transform;
                }
              }
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