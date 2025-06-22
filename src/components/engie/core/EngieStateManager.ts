import { EngieState, ChatMessage, ToneAnalysis, Suggestion, BotAnimationState, BotSpeed, BotDirection } from '../types';

export class EngieStateManager {
  private state: EngieState;
  private listeners: Array<(state: EngieState) => void> = [];
  private walkBackTimer: NodeJS.Timeout | null = null;
  private targetPosition: { x: number; y: number } | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): EngieState {
    // Calculate initial position near the Text Analysis area
    const initialPosition = this.calculateTextAnalysisPosition();
    
    return {
      isChatOpen: false,
      currentSuggestionIndex: 0,
      isScanning: false,
      statusMessage: "",
      internalSuggestions: [],
      toneAnalysisResult: null,
      overallPageToneAnalysis: null,
      documentContext: null,
      ideationMessage: null,
      encouragementMessageApi: null,
      lastEncouragementTone: null,
      isIdeating: false,
      chatHistory: [],
      activeTab: 'suggestions',
      ideaNotifications: [],
      showSparkle: false,
      engiePos: initialPosition,
      notificationOpen: false,
      botAnimation: 'idle',
      botSpeed: 'normal',
      botDirection: 'right',
      botEmotion: 'neutral',
      emotionReason: '',
      isTouchDevice: false,
      isGrokActive: false,
      grokEndTime: null,
      grokChatHistory: [],
      isDragLocked: false, // Add missing property for drag lock functionality
    };
  }

  private calculateTextAnalysisPosition(): { x: number; y: number } {
    if (typeof window === 'undefined') {
      // SSR fallback - position in center-right
      return { x: 600, y: 300 };
    }
    
    // Try to find the Text Analysis area using various methods
    let analysisElement: Element | null = null;
    
    // Method 1: Look for CardTitle containing "Text Analysis"
    const cardTitles = Array.from(document.querySelectorAll('[class*="CardTitle"], h3, h2, .text-sm.font-medium'));
    for (const title of cardTitles) {
      if (title.textContent && title.textContent.includes('Text Analysis')) {
        analysisElement = title.closest('[class*="Card"]') || title.parentElement;
        break;
      }
    }
    
    // Method 2: Look for the right column in dashboard (md:w-1/2:last-child)
    if (!analysisElement) {
      analysisElement = document.querySelector('.md\\:w-1\\/2:last-child');
    }
    
    // Method 3: Look for any element with "Analysis" in text content
    if (!analysisElement) {
      const allElements = Array.from(document.querySelectorAll('div, section, article'));
      for (const element of allElements) {
        if (element.textContent && element.textContent.includes('Analysis')) {
          analysisElement = element;
          break;
        }
      }
    }
    
    // Method 4: Look for the enhanced editor with analysis
    if (!analysisElement) {
      analysisElement = document.querySelector('.analysis-editor') || 
                      document.querySelector('[class*="analysis"]');
    }
    
    if (analysisElement) {
      const rect = analysisElement.getBoundingClientRect();
      const engieSize = 64;
      const padding = 20;
      
      // Position Engie to the left of the analysis area
      const x = Math.max(padding, rect.left - engieSize - padding);
      const y = Math.max(padding, rect.top + rect.height / 2 - engieSize / 2);
      
      return { x, y };
    }
    
    // Fallback: position in the right side of screen, middle height
    const engieSize = 64;
    const padding = 20;
    const x = Math.max(padding, window.innerWidth * 0.75 - engieSize);
    const y = Math.max(padding, window.innerHeight * 0.4);
    
    return { x, y };
  }

  private calculateInitialPosition(): { x: number; y: number } {
    // Use the text analysis position as default
    return this.calculateTextAnalysisPosition();
  }

  getState(): EngieState {
    return { ...this.state };
  }

  subscribe(listener: (state: EngieState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Walk back behavior
  startWalkBack(): void {
    // Clear any existing walk back timer
    if (this.walkBackTimer) {
      clearInterval(this.walkBackTimer);
    }
    
    // Set target position to the text analysis area
    this.targetPosition = this.calculateTextAnalysisPosition();
    
    // Set walking animation
    this.setBotAnimation('walking');
    this.setBotSpeed('normal');
    
    // Start walking back gradually
    this.walkBackTimer = setInterval(() => {
      if (!this.targetPosition) return;
      
      const currentPos = this.state.engiePos;
      const target = this.targetPosition;
      
      // Calculate distance to target
      const dx = target.x - currentPos.x;
      const dy = target.y - currentPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If we're close enough, stop walking
      if (distance < 5) {
        this.stopWalkBack();
        return;
      }
      
      // Calculate step size (slow movement)
      const stepSize = 2;
      const normalizedDx = (dx / distance) * stepSize;
      const normalizedDy = (dy / distance) * stepSize;
      
      // Update direction based on movement
      if (Math.abs(normalizedDx) > 0.5) {
        this.setBotDirection(normalizedDx > 0 ? 'right' : 'left');
      }
      
      // Move towards target
      this.setEngiePos({
        x: currentPos.x + normalizedDx,
        y: currentPos.y + normalizedDy
      });
      
    }, 50); // Update every 50ms for smooth movement
  }
  
  stopWalkBack(): void {
    if (this.walkBackTimer) {
      clearInterval(this.walkBackTimer);
      this.walkBackTimer = null;
    }
    
    this.targetPosition = null;
    this.setBotAnimation('idle');
    this.setBotSpeed('normal');
  }

  // State update methods
  setChatOpen(isOpen: boolean): void {
    this.state.isChatOpen = isOpen;
    this.notify();
  }

  setCurrentSuggestionIndex(index: number): void {
    this.state.currentSuggestionIndex = index;
    this.notify();
  }

  setScanning(isScanning: boolean): void {
    this.state.isScanning = isScanning;
    this.notify();
  }

  setStatusMessage(message: string): void {
    this.state.statusMessage = message;
    this.notify();
  }

  setInternalSuggestions(suggestions: Suggestion[]): void {
    this.state.internalSuggestions = suggestions;
    // Drag lock is now managed by EngieController via updateDragLockWithExternalSuggestions
    this.notify();
  }

  setToneAnalysisResult(result: ToneAnalysis | null): void {
    this.state.toneAnalysisResult = result;
    this.notify();
    
    // Set emotion based on tone analysis
    if (result) {
      this.setEmotionBasedOnTone(result);
    }
  }

  setOverallPageToneAnalysis(result: ToneAnalysis | null): void {
    this.state.overallPageToneAnalysis = result;
    this.notify();
  }

  setIdeationMessage(message: ChatMessage | null): void {
    this.state.ideationMessage = message;
    this.notify();
  }

  setEncouragementMessage(message: ChatMessage | null): void {
    this.state.encouragementMessageApi = message;
    this.notify();
  }

  setLastEncouragementTone(tone: string | null): void {
    this.state.lastEncouragementTone = tone;
    this.notify();
  }

  setIdeating(isIdeating: boolean): void {
    this.state.isIdeating = isIdeating;
    this.notify();
  }

  setChatHistory(history: ChatMessage[]): void {
    this.state.chatHistory = history;
    this.notify();
  }

  setActiveTab(tab: string): void {
    this.state.activeTab = tab;
    this.notify();
  }

  setIdeaNotifications(notifications: string[]): void {
    this.state.ideaNotifications = notifications;
    this.notify();
  }

  addIdeaNotification(notification: string): void {
    this.state.ideaNotifications = [...this.state.ideaNotifications, notification];
    this.notify();
  }

  removeIdeaNotification(index: number): void {
    this.state.ideaNotifications = this.state.ideaNotifications.filter((_, i) => i !== index);
    this.notify();
  }

  setShowSparkle(show: boolean): void {
    this.state.showSparkle = show;
    this.notify();
  }

  setEngiePos(pos: { x: number; y: number }): void {
    this.state.engiePos = pos;
    this.notify();
  }

  // Drag lock methods
  setDragLocked(isLocked: boolean): void {
    this.state.isDragLocked = isLocked;
    this.notify();
  }

  updateDragLockWithExternalSuggestions(externalSuggestions: Suggestion[]): void {
    // Lock dragging if there are active suggestions (internal or external)
    const hasActiveSuggestions = this.state.internalSuggestions.length > 0 || externalSuggestions.length > 0;
    this.setDragLocked(hasActiveSuggestions);
  }

  // Position Engie near suggested text
  moveEngieToSuggestion(suggestion: Suggestion): void {
    if (typeof window === 'undefined') return;

    // Try to find the text in the DOM
    const textElements = document.querySelectorAll('p, div, span, textarea, input[type="text"]');
    let targetElement: Element | null = null;
    
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      const textContent = element.textContent || '';
      if (textContent.includes(suggestion.original)) {
        targetElement = element;
        break;
      }
    }
    
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const engieSize = 64;
      const padding = 20;
      
      // Position Engie to the left of the target text, with some padding
      let newX = Math.max(padding, rect.left - engieSize - padding);
      let newY = Math.max(padding, rect.top);
      
      // Ensure Engie stays within viewport bounds
      const maxX = window.innerWidth - engieSize - padding;
      const maxY = window.innerHeight - engieSize - padding;
      
      newX = Math.min(newX, maxX);
      newY = Math.min(newY, maxY);
      
      this.setEngiePos({ x: newX, y: newY });
      
      // Face towards the text
      this.setBotDirection(newX < rect.left ? 'right' : 'left');
    }
  }

  // Reset Engie to initial position (near text analysis)
  resetEngiePosition(): void {
    const initialPosition = this.calculateTextAnalysisPosition();
    this.setEngiePos(initialPosition);
    this.setBotDirection('right');
  }

  setNotificationOpen(isOpen: boolean): void {
    this.state.notificationOpen = isOpen;
    this.notify();
  }

  setBotAnimation(animation: BotAnimationState): void {
    this.state.botAnimation = animation;
    this.notify();
  }

  setBotSpeed(speed: BotSpeed): void {
    this.state.botSpeed = speed;
    this.notify();
  }

  setBotDirection(direction: BotDirection): void {
    this.state.botDirection = direction;
    this.notify();
  }

  setTouchDevice(isTouchDevice: boolean): void {
    this.state.isTouchDevice = isTouchDevice;
    this.notify();
  }

  // New method to set the emotion of Engie
  setBotEmotion(emotion: 'happy' | 'excited' | 'concerned' | 'thoughtful' | 'neutral', reason: string): void {
    this.state.botEmotion = emotion;
    this.state.emotionReason = reason;
    this.notify();
  }

  // Method to determine emotion based on tone analysis
  setEmotionBasedOnTone(toneAnalysis: ToneAnalysis): void {
    const { overallTone, overallScore } = toneAnalysis;
    
    if (!overallTone) return;
    
    // Match tone to appropriate emotion
    if (overallTone.toLowerCase().includes('confident') || 
        overallTone.toLowerCase().includes('positive') ||
        overallTone.toLowerCase().includes('optimistic')) {
      this.setBotEmotion('happy', `Responding to ${overallTone.toLowerCase()} tone`);
    }
    else if (overallTone.toLowerCase().includes('enthusiastic') || 
             overallTone.toLowerCase().includes('passionate') ||
             overallTone.toLowerCase().includes('energetic')) {
      this.setBotEmotion('excited', `Responding to ${overallTone.toLowerCase()} tone`);
    }
    else if (overallTone.toLowerCase().includes('negative') || 
             overallTone.toLowerCase().includes('critical') ||
             overallTone.toLowerCase().includes('uncertain')) {
      this.setBotEmotion('concerned', `Responding to ${overallTone.toLowerCase()} tone`);
    }
    else if (overallTone.toLowerCase().includes('analytical') || 
             overallTone.toLowerCase().includes('formal') ||
             overallTone.toLowerCase().includes('technical')) {
      this.setBotEmotion('thoughtful', `Responding to ${overallTone.toLowerCase()} tone`);
    }
    else {
      this.setBotEmotion('neutral', '');
    }
  }
  
  // Method to set emotion based on quality of writing
  setEmotionBasedOnQuality(errorCount: number, textLength: number): void {
    // Calculate error density (errors per 100 words, assuming average word is 5 chars)
    const wordCount = textLength / 5;
    const errorDensity = errorCount / (wordCount / 100);
    
    if (wordCount < 20) {
      // Not enough text to evaluate
      this.setBotEmotion('neutral', 'Getting started...');
      return;
    }
    
    if (errorDensity < 0.5) {
      this.setBotEmotion('happy', '✨ This writing looks great!');
    } else if (errorDensity < 2) {
      this.setBotEmotion('thoughtful', '👀 Found a few ways to polish this');
    } else if (errorDensity < 5) {
      this.setBotEmotion('concerned', '📝 Let\'s clean up a few things together');
    } else {
      this.setBotEmotion('concerned', '💪 I\'ve got some helpful fixes for you');
    }
  }
  
  // Method to set emotion based on user progress
  setEmotionBasedOnProgress(completedSuggestions: number, totalSuggestions: number): void {
    if (totalSuggestions === 0) return;
    
    const progressRatio = completedSuggestions / totalSuggestions;
    
    if (progressRatio >= 0.9) {
      this.setBotEmotion('excited', '🏁 Almost perfect! You\'re crushing it');
    } else if (progressRatio >= 0.5) {
      this.setBotEmotion('happy', '💪 Great progress! Keep it going');
    } else if (progressRatio >= 0.2) {
      this.setBotEmotion('thoughtful', '✨ Making good headway on these');
    } else if (completedSuggestions > 0) {
      this.setBotEmotion('thoughtful', '👍 Nice start! Let\'s keep polishing');
    }
  }
  
  // Method to set emotion based on user interactions  
  setEmotionBasedOnInteraction(interactionType: 'suggestion-applied' | 'suggestion-dismissed' | 'chat-opened'): void {
    switch (interactionType) {
      case 'suggestion-applied':
        this.setBotEmotion('excited', '🎉 Nice! That reads much better');
        break;
      case 'suggestion-dismissed': 
        this.setBotEmotion('neutral', '👍 No worries, you know your style');
        break;
      case 'chat-opened':
        this.setBotEmotion('happy', '👋 Hey! What can I help with?');
        break;
    }
  }

  // Grok state methods
  setIsGrokActive(isActive: boolean): void {
    this.state.isGrokActive = isActive;
    this.notify();
  }

  setGrokEndTime(endTime: number | null): void {
    this.state.grokEndTime = endTime;
    this.notify();
  }

  addGrokChatMessage(message: ChatMessage): void {
    this.state.grokChatHistory = [...this.state.grokChatHistory, message];
    this.notify();
  }

  clearGrokChatHistory(): void {
    this.state.grokChatHistory = [];
    this.notify();
  }

  // Computed properties
  getActiveSuggestions(externalSuggestions: Suggestion[]): Suggestion[] {
    return this.state.internalSuggestions.length > 0 ? this.state.internalSuggestions : externalSuggestions;
  }

  getCurrentSuggestion(externalSuggestions: Suggestion[]): Suggestion | null {
    const activeSuggestions = this.getActiveSuggestions(externalSuggestions);
    return activeSuggestions[this.state.currentSuggestionIndex] || null;
  }

  getUnreadCount(): number {
    return this.state.ideaNotifications.length;
  }

  // Reset methods
  resetSuggestions(): void {
    this.state.internalSuggestions = [];
    this.state.currentSuggestionIndex = 0;
    this.notify();
  }

  resetAnalysis(): void {
    this.state.toneAnalysisResult = null;
    this.state.overallPageToneAnalysis = null;
    this.notify();
  }

  resetIdeation(): void {
    this.state.ideationMessage = null;
    this.state.encouragementMessageApi = null;
    this.state.isIdeating = false;
    this.notify();
  }

  // Cleanup method
  cleanup(): void {
    if (this.walkBackTimer) {
      clearInterval(this.walkBackTimer);
      this.walkBackTimer = null;
    }
  }

  // Intelligent autonomous movement based on user experience
  moveToOptimalPosition(context: 'suggestions' | 'writing' | 'analysis' | 'idle'): void {
    if (typeof window === 'undefined') return;

    let targetPosition: { x: number; y: number };
    let direction: BotDirection = 'right';

    switch (context) {
      case 'suggestions':
        // Move near the Priority Issues panel or suggestions area
        targetPosition = this.findPriorityIssuesPosition() || this.calculateTextAnalysisPosition();
        direction = 'left'; // Face towards the content
        break;
      
      case 'writing':
        // Move near the writing area
        targetPosition = this.findWritingAreaPosition() || this.calculateTextAnalysisPosition();
        direction = 'right'; // Face towards analysis
        break;
      
      case 'analysis':
        // Move near the text analysis area
        targetPosition = this.calculateTextAnalysisPosition();
        direction = 'left'; // Face towards content
        break;
      
      case 'idle':
      default:
        // Return to default position near text analysis
        targetPosition = this.calculateTextAnalysisPosition();
        direction = 'right';
        break;
    }

    this.smoothMoveTo(targetPosition, direction);
  }

  private findPriorityIssuesPosition(): { x: number; y: number } | null {
    // Look for the Priority Issues panel
    const priorityPanel = document.querySelector('[class*="Priority Issues"]') ||
                         document.querySelector('h3, h4, .text-sm.font-medium')?.closest('div');
    
    if (priorityPanel) {
      const rect = priorityPanel.getBoundingClientRect();
      const engieSize = 64;
      const padding = 15;
      
      return {
        x: Math.max(padding, rect.right + padding),
        y: Math.max(padding, rect.top + rect.height / 2 - engieSize / 2)
      };
    }
    
    return null;
  }

  private findWritingAreaPosition(): { x: number; y: number } | null {
    // Look for the main writing textarea
    const writingArea = document.querySelector('.main-editor-textarea') ||
                       document.querySelector('textarea') ||
                       document.querySelector('[contenteditable="true"]');
    
    if (writingArea) {
      const rect = writingArea.getBoundingClientRect();
      const engieSize = 64;
      const padding = 15;
      
      return {
        x: Math.max(padding, rect.right + padding),
        y: Math.max(padding, rect.top + rect.height / 4)
      };
    }
    
    return null;
  }

  private smoothMoveTo(targetPosition: { x: number; y: number }, direction: BotDirection): void {
    // Clear any existing movement
    this.stopWalkBack();
    
    // Set target and direction
    this.targetPosition = targetPosition;
    this.setBotDirection(direction);
    
    // Start smooth movement
    this.setBotAnimation('walking');
    this.setBotSpeed('normal');
    
    this.walkBackTimer = setInterval(() => {
      if (!this.targetPosition) return;
      
      const currentPos = this.state.engiePos;
      const target = this.targetPosition;
      
      // Calculate distance to target
      const dx = target.x - currentPos.x;
      const dy = target.y - currentPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If we're close enough, stop walking
      if (distance < 8) {
        this.stopWalkBack();
        return;
      }
      
      // Calculate step size (smooth movement)
      const stepSize = Math.min(3, distance / 10); // Adaptive step size
      const normalizedDx = (dx / distance) * stepSize;
      const normalizedDy = (dy / distance) * stepSize;
      
      // Move towards target
      this.setEngiePos({
        x: currentPos.x + normalizedDx,
        y: currentPos.y + normalizedDy
      });
      
    }, 60); // Smooth 60ms intervals
  }
}