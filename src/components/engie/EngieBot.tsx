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

  // Simple, reliable popup positioning function
  const calculatePopupPosition = (engiePos: { x: number; y: number }, windowWidth: number, windowHeight: number) => {
    const engieSize = 64;
    const popupWidth = Math.min(320, windowWidth - 32); // Responsive width with 16px margin on each side
    const popupMaxHeight = Math.min(400, windowHeight - 32); // Responsive height
    const gap = 16; // Gap between Engie and popup
    const edgeMargin = 16; // Minimum margin from screen edges

    // Engie center point
    const engieCenterX = engiePos.x + engieSize / 2;
    const engieCenterY = engiePos.y + engieSize / 2;

    let left: number;
    let top: number;
    let positionClass = '';

    // Determine best position based on available space
    const spaceRight = windowWidth - (engiePos.x + engieSize);
    const spaceLeft = engiePos.x;
    const spaceBottom = windowHeight - (engiePos.y + engieSize);
    const spaceTop = engiePos.y;

    // Try to position to the right first (most natural for speech bubbles)
    if (spaceRight >= popupWidth + gap + edgeMargin) {
      // Position to the right
      left = engiePos.x + engieSize + gap;
      top = Math.max(edgeMargin, Math.min(
        engiePos.y - 20, // Slightly offset up for better visual alignment
        windowHeight - popupMaxHeight - edgeMargin
      ));
      positionClass = 'popup-from-left';
    }
    // Try to position to the left
    else if (spaceLeft >= popupWidth + gap + edgeMargin) {
      left = engiePos.x - popupWidth - gap;
      top = Math.max(edgeMargin, Math.min(
        engiePos.y - 20,
        windowHeight - popupMaxHeight - edgeMargin
      ));
      positionClass = 'popup-from-right';
    }
    // Try to position below
    else if (spaceBottom >= popupMaxHeight + gap + edgeMargin) {
      left = Math.max(edgeMargin, Math.min(
        engieCenterX - popupWidth / 2, // Center horizontally on Engie
        windowWidth - popupWidth - edgeMargin
      ));
      top = engiePos.y + engieSize + gap;
      positionClass = 'popup-from-top';
    }
    // Try to position above
    else if (spaceTop >= popupMaxHeight + gap + edgeMargin) {
      left = Math.max(edgeMargin, Math.min(
        engieCenterX - popupWidth / 2,
        windowWidth - popupWidth - edgeMargin
      ));
      top = engiePos.y - popupMaxHeight - gap;
      positionClass = 'popup-from-bottom';
    }
    // Fallback: position in the largest available space, ensuring full visibility
    else {
      // Find the quadrant with most space
      const spaces = [
        { space: spaceRight, position: 'right' },
        { space: spaceLeft, position: 'left' },
        { space: spaceBottom, position: 'bottom' },
        { space: spaceTop, position: 'top' }
      ];
      
      const bestSpace = spaces.reduce((max, current) => 
        current.space > max.space ? current : max
      );

      switch (bestSpace.position) {
        case 'right':
          left = Math.max(engiePos.x + engieSize + 8, windowWidth - popupWidth - edgeMargin);
          top = Math.max(edgeMargin, Math.min(engiePos.y, windowHeight - popupMaxHeight - edgeMargin));
          positionClass = 'popup-from-left';
          break;
        case 'left':
          left = Math.min(engiePos.x - 8, edgeMargin);
          top = Math.max(edgeMargin, Math.min(engiePos.y, windowHeight - popupMaxHeight - edgeMargin));
          positionClass = 'popup-from-right';
          break;
        case 'bottom':
          left = Math.max(edgeMargin, Math.min(engieCenterX - popupWidth / 2, windowWidth - popupWidth - edgeMargin));
          top = Math.max(engiePos.y + engieSize + 8, windowHeight - popupMaxHeight - edgeMargin);
          positionClass = 'popup-from-top';
          break;
        default: // top
          left = Math.max(edgeMargin, Math.min(engieCenterX - popupWidth / 2, windowWidth - popupWidth - edgeMargin));
          top = Math.min(engiePos.y - 8, edgeMargin);
          positionClass = 'popup-from-bottom';
          break;
      }
    }

    // Final safety clamps to ensure popup never goes off-screen
    left = Math.max(edgeMargin, Math.min(left, windowWidth - popupWidth - edgeMargin));
    top = Math.max(edgeMargin, Math.min(top, windowHeight - popupMaxHeight - edgeMargin));

    setPopupPositionStyle({ 
      left, 
      top, 
      width: popupWidth,
      maxHeight: popupMaxHeight
    });
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
  }, [controller]);

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
  }, [state.engiePos, controller]);

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