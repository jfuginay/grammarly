import { EngieStateManager } from './EngieStateManager';
import { EngieApiService } from '../services/EngieApiService';
import { TextExtractorService } from '../services/TextExtractorService';
import { ChatMessage, Suggestion, EngieProps } from '../types';

export class EngieController {
  private stateManager: EngieStateManager;
  private apiService: EngieApiService;
  private textExtractor: TextExtractorService;
  private debounceTimeoutRef: NodeJS.Timeout | null = null;
  private prevScannedTextRef: string = "";
  private inactivityTimerRef: NodeJS.Timeout | null = null;
  private lastX: number = 0;

  constructor(
    private props: EngieProps
  ) {
    this.stateManager = new EngieStateManager();
    this.apiService = EngieApiService.getInstance();
    this.textExtractor = TextExtractorService.getInstance();
    this.setupInactivityTimer();
    this.detectTouchDevice();
  }

  getStateManager(): EngieStateManager {
    return this.stateManager;
  }

  private detectTouchDevice(): void {
    const detectTouch = () => {
      this.stateManager.setTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };
    detectTouch();
    window.addEventListener('resize', detectTouch);
  }

  private setupInactivityTimer(): void {
    const resetTimer = () => {
      if (this.inactivityTimerRef) {
        clearTimeout(this.inactivityTimerRef);
      }
      
      const state = this.stateManager.getState();
      const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
      
      const shouldSetTimer = !state.isChatOpen ||
                           (state.isChatOpen && activeSuggestions.length === 0 && 
                            !state.ideationMessage && !state.toneAnalysisResult && 
                            !state.isIdeating && !state.isScanning);

      if (shouldSetTimer) {
        this.inactivityTimerRef = setTimeout(() => {
          console.log("Inactivity detected, triggering ideation.");
          this.triggerIdeation();
        }, 30000); // 30 seconds
      }
    };

    // Subscribe to state changes to reset timer
    this.stateManager.subscribe(resetTimer);
    resetTimer();
  }

  async triggerIdeation(isManualTrigger = false): Promise<void> {
    const state = this.stateManager.getState();
    
    if (state.isIdeating) return;

    this.stateManager.setIdeating(true);
    this.stateManager.setStatusMessage("Engie is thinking of ideas...");

    try {
      const pageText = this.textExtractor.extractFullPageText();
      
      if (!pageText || pageText.length < 50) {
        console.log("Not enough content for ideation.");
        this.stateManager.setIdeating(false);
        this.stateManager.setStatusMessage("");
        return;
      }

      const prompt = isManualTrigger
        ? `Based on this content, give me creative ideas or suggestions to improve it: ${pageText.slice(0, 2000)}`
        : `Looking at this content, what creative ideas could enhance it? Be brief and actionable: ${pageText.slice(0, 2000)}`;

      const ideaResponse = await this.apiService.callEngieChatAPI(prompt, state.chatHistory);
      
      if (ideaResponse) {
        const ideaMessage: ChatMessage = { role: 'assistant', content: ideaResponse };
        
        if (isManualTrigger) {
          this.stateManager.setIdeationMessage(ideaMessage);
          this.stateManager.setChatOpen(true);
        } else {
          this.stateManager.addIdeaNotification(ideaResponse);
          this.stateManager.setShowSparkle(true);
          setTimeout(() => this.stateManager.setShowSparkle(false), 2000);
          
          if (this.props.onIdea) {
            this.props.onIdea(ideaResponse);
          }
        }
      }
    } catch (error) {
      console.error('Error during ideation:', error);
    } finally {
      this.stateManager.setIdeating(false);
      this.stateManager.setStatusMessage("");
    }
  }

  async scanForSuggestions(): Promise<void> {
    if (!this.props.targetEditorSelector) return;

    const text = this.textExtractor.extractTextFromTarget(this.props.targetEditorSelector);
    if (!text || text === this.prevScannedTextRef || text.length < 10) return;

    this.prevScannedTextRef = text;
    this.stateManager.setScanning(true);
    this.stateManager.setStatusMessage("Scanning for suggestions...");

    try {
      const [suggestions, toneAnalysis] = await Promise.all([
        this.apiService.fetchTypoSuggestions(text),
        this.apiService.fetchToneAnalysis(text)
      ]);

      this.stateManager.setInternalSuggestions(suggestions);
      this.stateManager.setToneAnalysisResult(toneAnalysis);
      this.stateManager.setCurrentSuggestionIndex(0);

      if (suggestions.length > 0) {
        // Move Engie to the first suggestion
        this.stateManager.moveEngieToSuggestion(suggestions[0]);
        this.stateManager.setChatOpen(true);
        this.stateManager.setActiveTab('suggestions');
      }
    } catch (error) {
      console.error('Error during scanning:', error);
    } finally {
      this.stateManager.setScanning(false);
      this.stateManager.setStatusMessage("");
    }
  }

  async analyzePageTone(): Promise<void> {
    const pageText = this.textExtractor.extractFullPageText();
    if (!pageText || pageText.length < 50) return;

    try {
      const toneAnalysis = await this.apiService.fetchToneAnalysis(pageText);
      this.stateManager.setOverallPageToneAnalysis(toneAnalysis);

      const state = this.stateManager.getState();
      if (toneAnalysis && 
          toneAnalysis.overallTone !== state.lastEncouragementTone &&
          (toneAnalysis.overallTone === 'Positive' || toneAnalysis.overallTone === 'Negative')) {
        
        const encouragementText = await this.apiService.fetchEncouragementMessage(
          toneAnalysis.overallTone, 
          toneAnalysis.overallScore
        );
        
        if (encouragementText) {
          this.stateManager.setEncouragementMessage({
            role: 'assistant',
            content: encouragementText
          });
          this.stateManager.setLastEncouragementTone(toneAnalysis.overallTone);
          this.stateManager.setChatOpen(true);
          this.stateManager.setActiveTab('tone');
        }
      }
    } catch (error) {
      console.error('Error analyzing page tone:', error);
    }
  }

  debouncedScan(): void {
    if (this.debounceTimeoutRef) {
      clearTimeout(this.debounceTimeoutRef);
    }
    this.debounceTimeoutRef = setTimeout(() => this.scanForSuggestions(), 2000);
  }

  // Event handlers
  handleEngieClick(): void {
    const state = this.stateManager.getState();
    const unreadCount = this.stateManager.getUnreadCount();
    
    if (unreadCount > 0) {
      this.stateManager.setNotificationOpen(!state.notificationOpen);
    }
  }

  handleEngieTrigger(): void {
    const state = this.stateManager.getState();
    
    if (!state.isChatOpen) {
      this.debouncedScan();
      this.analyzePageTone();
    }
    this.stateManager.setChatOpen(!state.isChatOpen);
  }

  handleEngieClose(): void {
    this.stateManager.setChatOpen(false);
    // Reset position when closing if no active suggestions
    const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
    if (activeSuggestions.length === 0) {
      this.stateManager.resetEngiePosition();
    }
  }

  handleApply(): void {
    const state = this.stateManager.getState();
    const currentSuggestion = this.stateManager.getCurrentSuggestion(this.props.suggestions);
    
    if (currentSuggestion) {
      this.props.onApply(currentSuggestion);
      this.handleNext();
    }
  }

  handleDismiss(): void {
    const currentSuggestion = this.stateManager.getCurrentSuggestion(this.props.suggestions);
    
    if (currentSuggestion) {
      this.props.onDismiss(currentSuggestion.id);
      
      const state = this.stateManager.getState();
      if (state.internalSuggestions.length > 0) {
        const updatedSuggestions = state.internalSuggestions.filter(s => s.id !== currentSuggestion.id);
        this.stateManager.setInternalSuggestions(updatedSuggestions);
        
        if (updatedSuggestions.length === 0) {
          this.stateManager.setCurrentSuggestionIndex(0);
        } else if (state.currentSuggestionIndex >= updatedSuggestions.length) {
          this.stateManager.setCurrentSuggestionIndex(updatedSuggestions.length - 1);
        }
      } else {
        this.handleNext();
      }
    }
  }

  handleNext(): void {
    const state = this.stateManager.getState();
    const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
    
    if (state.currentSuggestionIndex < activeSuggestions.length - 1) {
      const nextIndex = state.currentSuggestionIndex + 1;
      this.stateManager.setCurrentSuggestionIndex(nextIndex);
      // Move Engie to the next suggestion
      if (activeSuggestions[nextIndex]) {
        this.stateManager.moveEngieToSuggestion(activeSuggestions[nextIndex]);
      }
    } else {
      this.stateManager.setCurrentSuggestionIndex(0);
      this.stateManager.resetSuggestions();
      // Reset Engie position when no more suggestions
      this.stateManager.resetEngiePosition();
    }
  }

  handleDismissIdeation(): void {
    this.stateManager.setIdeationMessage(null);
  }

  handleManualIdeate(): void {
    this.triggerIdeation(true);
  }

  async handleAnalyzeStyle(): Promise<void> {
    const state = this.stateManager.getState();
    console.log("Analyzing style for documents:", state.selectedDocIds);
    
    try {
      await this.apiService.analyzeStyle(state.selectedDocIds);
      this.stateManager.setStyleModalOpen(false);
    } catch (error) {
      console.error('Failed to analyze style:', error);
    }
  }

  handleDocSelectionChange(docId: string): void {
    this.stateManager.toggleDocSelection(docId);
  }

  dismissNotification(index: number): void {
    this.stateManager.removeIdeaNotification(index);
  }

  // Bot animation handlers
  handleDrag(e: any, data: any): void {
    const deltaX = data.x - this.lastX;
    
    if (Math.abs(deltaX) > 5) {
      this.stateManager.setBotDirection(deltaX > 0 ? 'right' : 'left');
      this.stateManager.setBotSpeed(Math.abs(deltaX) > 20 ? 'fast' : 'normal');
    }
    
    this.lastX = data.x;
    this.stateManager.setEngiePos({ x: data.x, y: data.y });
  }

  onStartDrag(): void {
    this.stateManager.setBotAnimation('walking');
  }

  onStopDrag(): void {
    this.stateManager.setBotAnimation('idle');
  }

  // Utility methods
  formatScore(score: number | undefined | null): string {
    if (typeof score !== 'number' || isNaN(score)) return 'N/A';
    return (score * 100).toFixed(0) + '%';
  }

  cleanup(): void {
    if (this.debounceTimeoutRef) {
      clearTimeout(this.debounceTimeoutRef);
    }
    if (this.inactivityTimerRef) {
      clearTimeout(this.inactivityTimerRef);
    }
  }

  /**
   * Move Engie one step toward the mouse position
   */
  public stepTowardMouse(): void {
    if (typeof window === 'undefined') return;
    const mouse = (window as any).__engieMousePos;
    if (!mouse) return;
    const { x: botX, y: botY } = this.stateManager.getState().engiePos;
    const dx = mouse.x - botX;
    const dy = mouse.y - botY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return; // Already close
    const step = 24; // pixels per step
    const ratio = step / dist;
    const newX = botX + dx * ratio;
    const newY = botY + dy * ratio;
    this.stateManager.setEngiePos({ x: newX, y: newY });
    this.stateManager.setBotDirection(dx > 0 ? 'right' : 'left');
    this.stateManager.setBotAnimation('walking');
    setTimeout(() => this.stateManager.setBotAnimation('idle'), 200);
  }
} 