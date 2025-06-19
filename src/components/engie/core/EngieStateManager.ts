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
      isStyleModalOpen: false,
      selectedDocIds: [],
      botAnimation: 'idle',
      botSpeed: 'normal',
      botDirection: 'right',
      isTouchDevice: false,
    };
  }

  private calculateInitialPosition(): { x: number; y: number } {
    // Position Engie at center of the viewport
    const engieSize = 64;
    if (typeof window === 'undefined') {
      return { x: 400, y: 300 };
    }
    const x = Math.max(0, window.innerWidth / 2 - engieSize / 2);
    const y = Math.max(0, window.innerHeight / 2 - engieSize / 2);
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

  setStyleModalOpen(isOpen: boolean): void {
    this.state.isStyleModalOpen = isOpen;
    this.notify();
  }

  setSelectedDocIds(docIds: string[]): void {
    this.state.selectedDocIds = docIds;
    this.notify();
  }

  toggleDocSelection(docId: string): void {
    const isSelected = this.state.selectedDocIds.includes(docId);
    if (isSelected) {
      this.state.selectedDocIds = this.state.selectedDocIds.filter(id => id !== docId);
    } else {
      this.state.selectedDocIds = [...this.state.selectedDocIds, docId];
    }
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