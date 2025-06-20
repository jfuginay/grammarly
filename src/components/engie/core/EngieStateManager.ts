import { EngieState, ChatMessage, ToneAnalysis, Suggestion, BotAnimationState, BotSpeed, BotDirection } from '../types';

export class EngieStateManager {
  private state: EngieState;
  private listeners: Array<(state: EngieState) => void> = [];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): EngieState {
    // Calculate initial position at bottom-right of screen
    const initialPosition = this.calculateInitialPosition();
    
    return {
      isChatOpen: false,
      currentSuggestionIndex: 0,
      isScanning: false,
      statusMessage: "",
      internalSuggestions: [],
      toneAnalysisResult: null,
      overallPageToneAnalysis: null,
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
    };
  }

  private calculateInitialPosition(): { x: number; y: number } {
    // Position Engie at bottom-right of the viewport with some padding
    const engieSize = 64;
    const padding = 20;
    
    if (typeof window === 'undefined') {
      // SSR fallback - position in center
      return { x: 400, y: 300 };
    }
    
    // Calculate bottom-right position
    const x = Math.max(padding, window.innerWidth - engieSize - padding);
    const y = Math.max(padding, window.innerHeight - engieSize - padding);
    
    return { x, y };
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

  // Reset Engie to initial position
  resetEngiePosition(): void {
    const initialPosition = this.calculateInitialPosition();
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
      this.setBotEmotion('neutral', '');
      return;
    }
    
    if (errorDensity < 0.5) {
      this.setBotEmotion('happy', 'Great writing with very few errors!');
    } else if (errorDensity < 2) {
      this.setBotEmotion('thoughtful', 'Decent writing with some improvements possible');
    } else if (errorDensity < 5) {
      this.setBotEmotion('concerned', 'Several errors detected');
    } else {
      this.setBotEmotion('concerned', 'Many errors detected');
    }
  }
  
  // Method to set emotion based on user progress
  setEmotionBasedOnProgress(completedSuggestions: number, totalSuggestions: number): void {
    if (totalSuggestions === 0) return;
    
    const progressRatio = completedSuggestions / totalSuggestions;
    
    if (progressRatio >= 0.9) {
      this.setBotEmotion('excited', 'Almost all suggestions applied!');
    } else if (progressRatio >= 0.5) {
      this.setBotEmotion('happy', 'Good progress on suggestions');
    } else if (progressRatio >= 0.2) {
      this.setBotEmotion('thoughtful', 'Making progress on suggestions');
    } else if (completedSuggestions > 0) {
      this.setBotEmotion('thoughtful', 'Started applying suggestions');
    }
  }
  
  // Method to set emotion based on interaction context
  setEmotionBasedOnInteraction(context: 'ideation' | 'suggestion-applied' | 'chat-opened' | 'encouragement'): void {
    switch (context) {
      case 'ideation':
        this.setBotEmotion('thoughtful', 'Thinking of ideas');
        break;
      case 'suggestion-applied':
        this.setBotEmotion('happy', 'Suggestion applied successfully');
        break;
      case 'chat-opened':
        this.setBotEmotion('excited', 'Ready to help');
        break;
      case 'encouragement':
        this.setBotEmotion('happy', 'Offering encouragement');
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
}