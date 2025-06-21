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
import { EngieProps, EngieState } from './types'; // Added EngieState

// Define constants for popup dimensions and offset
const POPUP_WIDTH = 320; // Assuming a fixed width for the popup (sm:w-80 from EngieChatWindow)
const POPUP_HEIGHT = 400; // Approximate height, can be adjusted
const POPUP_OFFSET = 16; // 1rem, common spacing unit

export const EngieBot: React.FC<EngieProps> = (props) => {
  const [controller] = useState(() => new EngieController(props));
  const [state, setState] = useState(controller.getStateManager().getState());
  const engieRef = useRef<HTMLDivElement>(null);
  const [popupPositionStyle, setPopupPositionStyle] = useState<React.CSSProperties>({});
  const [popupPositionClass, setPopupPositionClass] = useState<string>('');


  // Function to calculate popup position
  const calculatePopupPosition = (engiePos: { x: number; y: number }, windowWidth: number, windowHeight: number) => {
    let top: number | undefined;
    let right: number | undefined;
    let bottom: number | undefined;
    let left: number | undefined;
    let positionClass = '';

    const engieSize = 64; // Engie bot size

    // Determine Engie's corner/quadrant
    const engieSize = 64; // Engie bot size
    const minMargin = POPUP_OFFSET; // Minimum margin from screen edge

    // Determine Engie's quadrant
    const engieCenterX = engiePos.x + engieSize / 2;
    const engieCenterY = engiePos.y + engieSize / 2;

    const isTopHalf = engieCenterY < windowHeight / 2;
    const isLeftHalf = engieCenterX < windowWidth / 2;

    // Ideal position preferences
    if (isTopHalf && isLeftHalf) { // Engie top-left quadrant
      positionClass = 'popup-bottom-right'; // Popup aims to be bottom-right of Engie
      top = engiePos.y + engieSize + POPUP_OFFSET;
      left = engiePos.x + engieSize + POPUP_OFFSET;
      if (top + POPUP_HEIGHT > windowHeight) { // Adjust if too low
        bottom = POPUP_OFFSET;
        top = undefined;
      }
      if (left + POPUP_WIDTH > windowWidth) { // Adjust if too right
        right = POPUP_OFFSET;
        left = undefined;
      }
    } else if (isTopHalf && !isLeftHalf) { // Engie is top-right
      // Popup bottom-left of Engie
      positionClass = 'popup-bottom-left';
      top = engiePos.y + engieSize + POPUP_OFFSET;
      right = windowWidth - engiePos.x + POPUP_OFFSET;
      if (top + POPUP_HEIGHT > windowHeight) { // Adjust if too low
        bottom = POPUP_OFFSET;
        top = undefined;
      }
      if (right + POPUP_WIDTH > windowWidth) { // Adjust if too left
        left = POPUP_OFFSET;
        right = undefined;
      }
    } else if (!isTopHalf && isLeftHalf) { // Engie is bottom-left
      // Popup top-right of Engie
      positionClass = 'popup-top-right';
      bottom = windowHeight - engiePos.y + POPUP_OFFSET;
      left = engiePos.x + engieSize + POPUP_OFFSET;
      if (bottom + POPUP_HEIGHT > windowHeight) { // Adjust if too high
        top = POPUP_OFFSET;
        bottom = undefined;
      }
      if (left + POPUP_WIDTH > windowWidth) { // Adjust if too right
        right = POPUP_OFFSET;
        left = undefined;
      }
    } else { // Engie is bottom-right
      // Popup top-left of Engie
      positionClass = 'popup-top-left';
      bottom = windowHeight - engiePos.y + POPUP_OFFSET;
      right = windowWidth - engiePos.x + POPUP_OFFSET;
      if (bottom + POPUP_HEIGHT > windowHeight) { // Adjust if too high
        top = POPUP_OFFSET;
        bottom = undefined;
      }
      if (right + POPUP_WIDTH > windowWidth) { // Adjust if too left
        left = POPUP_OFFSET;
        right = undefined;
      }
    }

    // Fallback and screen edge adjustments
    // Ensure popup stays within viewport, prioritizing visibility

    // Horizontal adjustments
    if (left !== undefined) {
      if (left < minMargin) {
        left = minMargin;
      }
      if (left + POPUP_WIDTH > windowWidth - minMargin) {
        left = windowWidth - POPUP_WIDTH - minMargin;
        // If adjusting left makes it overlap with Engie's right side when it should be on the right
        if (positionClass.endsWith('-right') && left < engiePos.x + engieSize) {
           // Try placing on the other side or center
        }
      }
    } else if (right !== undefined) {
      if (right < minMargin) {
        right = minMargin;
      }
      if (windowWidth - (right + POPUP_WIDTH) < minMargin) { // Equivalent to: right + POPUP_WIDTH > windowWidth - minMargin
        right = windowWidth - POPUP_WIDTH - minMargin;
         // If adjusting right makes it overlap with Engie's left side when it should be on the left
        if (positionClass.endsWith('-left') && (windowWidth - right - POPUP_WIDTH) > engiePos.x) {
            // Try placing on the other side or center
        }
      }
       // Convert right to left for final application if left is not set (because CSS 'right' behaves differently with fixed positioning)
      if (left === undefined) {
        left = windowWidth - right - POPUP_WIDTH;
        right = undefined;
      }
    }

    // Vertical adjustments
    if (top !== undefined) {
      if (top < minMargin) {
        top = minMargin;
      }
      if (top + POPUP_HEIGHT > windowHeight - minMargin) {
        top = windowHeight - POPUP_HEIGHT - minMargin;
      }
    } else if (bottom !== undefined) {
      if (bottom < minMargin) {
        bottom = minMargin;
      }
      // Equivalent to: bottom + POPUP_HEIGHT > windowHeight - minMargin
      if (windowHeight - (bottom + POPUP_HEIGHT) < minMargin) {
        bottom = windowHeight - POPUP_HEIGHT - minMargin;
      }
       // Convert bottom to top for final application if top is not set
      if (top === undefined) {
        top = windowHeight - bottom - POPUP_HEIGHT;
        bottom = undefined;
      }
    }

    // Centering logic (simplified: if no specific corner logic fits well, or Engie is near center)
    // This is a very basic centering. A more sophisticated check for "centered Engie" might be needed.
    const isEngieCentered = (
      engieCenterX > windowWidth * 0.4 && engieCenterX < windowWidth * 0.6 &&
      engieCenterY > windowHeight * 0.4 && engieCenterY < windowHeight * 0.6
    );

    if (isEngieCentered) {
      positionClass = ''; // Clear corner-specific class for arrows
      // Prefer above Engie, then below, then center screen
      if (engiePos.y - POPUP_HEIGHT - POPUP_OFFSET > minMargin) { // Space above
        top = engiePos.y - POPUP_HEIGHT - POPUP_OFFSET;
        positionClass = 'popup-center-bottom'; // Arrow points down
      } else if (engiePos.y + engieSize + POPUP_HEIGHT + POPUP_OFFSET < windowHeight - minMargin) { // Space below
        top = engiePos.y + engieSize + POPUP_OFFSET;
        positionClass = 'popup-center-top'; // Arrow points up
      } else { // Default to screen center if no good fit above/below
        top = Math.max(minMargin, (windowHeight - POPUP_HEIGHT) / 2);
      }
      left = Math.max(minMargin, (windowWidth - POPUP_WIDTH) / 2);
      right = undefined;
      bottom = undefined;
    }

    // Final check: if after all adjustments, values are out of bounds (e.g. small screen)
    // clamp them. This is a last resort.
    if (left !== undefined) {
        left = Math.max(minMargin, Math.min(left, windowWidth - POPUP_WIDTH - minMargin));
    }
    if (top !== undefined) {
        top = Math.max(minMargin, Math.min(top, windowHeight - POPUP_HEIGHT - minMargin));
    }


    // TODO: Add more sophisticated logic for available space check for main text box

    setPopupPositionStyle({ top, right, bottom, left });
    setPopupPositionClass(positionClass);
  };

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = controller.getStateManager().subscribe((newState: EngieState) => {
      setState(newState);
      if (typeof window !== 'undefined') {
        calculatePopupPosition(newState.engiePos, window.innerWidth, window.innerHeight);
      }
    });
    return unsubscribe;
  }, [controller]); // Removed calculatePopupPosition from dependencies to avoid stale closures

  // Recalculate on window resize
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      calculatePopupPosition(state.engiePos, window.innerWidth, window.innerHeight);
      // Also handle Engie going out of bounds due to resize
      const { x, y } = state.engiePos;
      const maxX = window.innerWidth - 64; // engieSize
      const maxY = window.innerHeight - 64; // engieSize

      if (x > maxX || y > maxY) {
        controller.getStateManager().setEngiePos({
          x: Math.min(x, maxX),
          y: Math.min(y, maxY)
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial calculation
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [state.engiePos, controller]); // Added controller to dependencies


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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('EngieBot component mounted');
    }
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

  // Handle window resize to keep Engie within bounds (now integrated into the recalculate on resize effect)
  // useEffect(() => {
  //   if (typeof window === 'undefined') return;
    
  //   const handleResize = () => {
  //     const { x, y } = state.engiePos;
  //     const maxX = window.innerWidth - 64;
  //     const maxY = window.innerHeight - 64;
      
  //     if (x > maxX || y > maxY) {
  //       controller.getStateManager().setEngiePos({
  //         x: Math.min(x, maxX),
  //         y: Math.min(y, maxY)
  //       });
  //     }
  //   };

  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, [state.engiePos, controller]);

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

  // Grok chat state for UI feedback
  const [grokLoading, setGrokLoading] = useState(false);
  const [grokError, setGrokError] = useState<string | null>(null);

  // Handler for sending arbitrary Grok chat prompts
  const handleSendGrokMessage = async (prompt: string) => {
    setGrokError(null);
    setGrokLoading(true);
    try {
      await controller.sendGrokChatMessage(prompt);
    } catch (e) {
      setGrokError('Sorry, there was an error sending your message to Grok.');
    } finally {
      setGrokLoading(false);
    }
  };
  // Grok specific handlers
  const handleToggleGrokMode = () => controller.toggleGrokMode();
  const handleResearchWithGrok = (topic: string) => controller.researchWithGrok(topic);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Engie position:', state.engiePos);
      console.log('Grok Active:', state.isGrokActive); // Log Grok state
    }
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
            {/* Apply the dynamic style and class to the container of EngieChatWindow */}
            <div style={{ position: 'absolute', ...popupPositionStyle }} className={popupPositionClass}>
              <AnimatePresence>
                {state.isChatOpen && (
                  <EngieChatWindow
                    // Pass popupPositionClass to EngieChatWindow if it needs to adapt its internal styling (e.g., arrow direction)
                    // popupPositionClass={popupPositionClass}
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
                    // Grok chat props
                    grokChatHistory={state.grokChatHistory}
                    handleToggleGrokMode={handleToggleGrokMode}
                    handleResearchWithGrok={handleResearchWithGrok}
                    onSendGrokMessage={handleSendGrokMessage}
                    grokLoading={grokLoading}
                    grokError={grokError}
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