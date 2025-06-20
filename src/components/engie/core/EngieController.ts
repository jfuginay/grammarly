import { EngieStateManager } from './EngieStateManager';
import { EngieApiService } from '../services/EngieApiService';
import { TextExtractorService } from '../services/TextExtractorService';
import { GrokApiService } from '../services/GrokApiService';

import { ChatMessage, Suggestion, EngieProps } from '../types';

export class EngieController {
  private stateManager: EngieStateManager;
  private apiService: EngieApiService;
  private textExtractor: TextExtractorService;
  private grokApiService: GrokApiService;
  private debounceTimeoutRef: NodeJS.Timeout | null = null;
  private prevScannedTextRef: string = "";
  private inactivityTimerRef: NodeJS.Timeout | null = null;
  private grokDeactivationTimer: NodeJS.Timeout | null = null;
  private lastX: number = 0;

  constructor(private props: EngieProps) {
    this.stateManager = new EngieStateManager();
    this.apiService = EngieApiService.getInstance();
    this.textExtractor = TextExtractorService.getInstance();
    this.grokApiService = GrokApiService.getInstance();
    this.setupInactivityTimer();
    this.detectTouchDevice();
  }

  getStateManager(): EngieStateManager {
    return this.stateManager;
  }

  private detectTouchDevice(): void {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
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
    this.stateManager.setEmotionBasedOnInteraction('ideation');

    try {
      const pageText = this.textExtractor.extractFullPageText();

      if (!pageText || pageText.length < 50) {
        console.log("Not enough content for ideation.");
        this.stateManager.setIdeating(false);
        this.stateManager.setStatusMessage("");
        return;
      }

      // Grok integration for opinionated comment
      if (state.isGrokActive && this.grokApiService && process.env.GROQ_API_KEY) {
        const commentPrompt = `Give me an opinionated, funny, or insightful comment about the following text: ${pageText.slice(0, 1000)}`;
        this.stateManager.addGrokChatMessage({ role: 'user', content: `Engie wants an opinionated comment on: "${pageText.substring(0,60)}..."` });
        const comment = await this.grokApiService.getOpinionatedComment(commentPrompt);
        if (comment) {
          this.stateManager.addGrokChatMessage({ role: 'assistant', content: comment });
          console.log("Grok Comment:", comment);
          this.stateManager.setBotEmotion('excited', 'Grok has a thought!');
          // Display in chat or as a notification - for now, it's in Grok history
        } else {
          this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, I couldn't come up with a Grok comment right now." });
          this.stateManager.setBotEmotion('concerned', 'Grok comment failed');
        }
        // Decide if we should still proceed with normal ideation or return
        // For now, let's allow normal ideation to also run if Grok is active.
        // If you want to bypass normal ideation when Grok provides a comment, uncomment the next line:
        // this.stateManager.setIdeating(false); this.stateManager.setStatusMessage(""); return;
      }

      // Proceed with normal ideation if Grok didn't provide a comment or if we want both
      const prompt = isManualTrigger
        ? `Based on this content, give me creative ideas or suggestions to improve it: ${pageText.slice(0, 2000)}`
        : `Looking at this content, what creative ideas could enhance it? Be brief and actionable: ${pageText.slice(0, 2000)}`;

      const ideaResponse = await this.apiService.callEngieChatAPI(prompt, state.chatHistory);

      if (ideaResponse) {
        const ideaMessage: ChatMessage = { role: 'assistant', content: ideaResponse };

        if (isManualTrigger) {
          this.stateManager.setIdeationMessage(ideaMessage);
          this.stateManager.setChatOpen(true); // Open chat for manual ideation
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
    console.log('Engie: Starting scan for suggestions');
    console.log('Engie: Target editor selector:', this.props.targetEditorSelector);
    
    if (!this.props.targetEditorSelector) {
      console.log('Engie: No target editor selector provided');
      return;
    }

    const text = this.textExtractor.extractTextFromTarget(this.props.targetEditorSelector);
    console.log('Engie: Extracted text length:', text?.length || 0);
    console.log('Engie: Previous scanned text length:', this.prevScannedTextRef?.length || 0);
    
    if (!text || text === this.prevScannedTextRef || text.length < 10) {
      console.log('Engie: Skipping scan - no text, same text, or too short');
      return;
    }

    this.prevScannedTextRef = text;
    this.stateManager.setScanning(true);
    this.stateManager.setStatusMessage("Scanning for suggestions...");
    this.stateManager.setBotEmotion('thoughtful', 'Analyzing your writing');

    try {
      console.log('Engie: Making API calls for suggestions and tone analysis');
      const [suggestions, toneAnalysis] = await Promise.all([
        this.apiService.fetchTypoSuggestions(text),
        this.apiService.fetchToneAnalysis(text)
      ]);

      console.log('Engie: API calls completed. Suggestions:', suggestions.length, 'Tone analysis:', !!toneAnalysis);

      this.stateManager.setInternalSuggestions(suggestions);
      this.stateManager.setToneAnalysisResult(toneAnalysis);
      this.stateManager.setCurrentSuggestionIndex(0);
      
      // Set emotion based on quality of writing
      this.stateManager.setEmotionBasedOnQuality(suggestions.length, text.length);

      if (suggestions.length > 0) {
        console.log('Engie: Found suggestions, opening chat and moving to first suggestion');
        // Move Engie to the first suggestion
        this.stateManager.moveEngieToSuggestion(suggestions[0]);
        this.stateManager.setChatOpen(true);
        this.stateManager.setActiveTab('suggestions');
        
        // If many errors, show concerned emotion
        if (suggestions.length > 5) {
          this.stateManager.setBotEmotion('concerned', 'Found several issues to fix');
        } else if (suggestions.length > 0) {
          this.stateManager.setBotEmotion('thoughtful', 'Found a few suggestions');
        }
      } else {
        console.log('Engie: No suggestions found');
        // Show happy emotion if no errors found
        this.stateManager.setBotEmotion('happy', 'Great writing! No issues found.');
      }
    } catch (error) {
      console.error('Engie: Error during scanning:', error);
      this.stateManager.setBotEmotion('concerned', 'Had trouble analyzing your writing');
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
      // Set excited emotion when chat is opened
      this.stateManager.setEmotionBasedOnInteraction('chat-opened');
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
    // Return to neutral emotion when closed
    this.stateManager.setBotEmotion('neutral', '');
  }

  handleApply(): void {
    const state = this.stateManager.getState();
    const currentSuggestion = this.stateManager.getCurrentSuggestion(this.props.suggestions);
    
    if (currentSuggestion) {
      this.props.onApply(currentSuggestion);
      
      // Show happy emotion when suggestion is applied
      this.stateManager.setEmotionBasedOnInteraction('suggestion-applied');
      
      // Check progress and update emotion based on it
      const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
      const totalSuggestions = activeSuggestions.length + 1; // +1 for the one just applied
      const completedSuggestions = 1; // The one just applied
      
      this.stateManager.setEmotionBasedOnProgress(completedSuggestions, totalSuggestions);
      
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
    if (this.grokDeactivationTimer) { // Clear Grok timer on cleanup
      clearTimeout(this.grokDeactivationTimer);
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

  // Grok Mode Methods
  public async toggleGrokMode(): Promise<void> {
    const currentState = this.stateManager.getState();
    if (!currentState.isGrokActive) {
      if (!process.env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is not set. Cannot activate Grok mode.");
        this.stateManager.addGrokChatMessage({ role: 'assistant', content: "I can't activate Grok mode. The API key is missing." });
        return;
      }
      this.stateManager.setIsGrokActive(true);
      const endTime = Date.now() + 10 * 60 * 1000; // 10 minutes
      this.stateManager.setGrokEndTime(endTime);
      console.log("Grok mode activated");
      this.stateManager.setBotEmotion('excited', 'Engie is feeling opinionated with Grok!');
      this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Grok mode activated! I'm ready for some opinionated comments and research." });

      if (this.grokDeactivationTimer) {
        clearTimeout(this.grokDeactivationTimer);
      }
      this.grokDeactivationTimer = setTimeout(() => {
        this.deactivateGrokMode();
      }, 10 * 60 * 1000);
    } else {
      this.deactivateGrokMode();
    }
  }

  public deactivateGrokMode(): void {
    this.stateManager.setIsGrokActive(false);
    this.stateManager.setGrokEndTime(null);
    console.log("Grok mode deactivated");
    if (this.grokDeactivationTimer) {
      clearTimeout(this.grokDeactivationTimer);
      this.grokDeactivationTimer = null;
    }
    this.stateManager.setBotEmotion('neutral', 'Grok mode off.');
    this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Grok mode deactivated." });
    // Clear history or keep it? For now, let's keep it for context if re-enabled soon.
    // If you want to clear it: this.stateManager.clearGrokChatHistory();
  }

  public async researchWithGrok(topic: string): Promise<void> {
    if (!this.grokApiService || !process.env.GROQ_API_KEY) {
      console.error("GrokApiService not available or API key missing. Cannot research.");
      this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, I can't use Grok for research right now. The service or API key might be missing." });
      return;
    }

    this.stateManager.setIdeating(true); // Using existing ideating state for busy indicator
    this.stateManager.setStatusMessage(`Engie is researching "${topic}" with Grok...`);
    this.stateManager.addGrokChatMessage({ role: 'user', content: `Research: ${topic}` });

    try {
      const response = await this.grokApiService.researchTopic(topic);

      if (response) {
        this.stateManager.addGrokChatMessage({ role: 'assistant', content: response });
        console.log("Grok Research Result:", response);
        this.stateManager.setBotEmotion('thoughtful', `Found some research on ${topic.substring(0,20)}...`);
        // We might want a way to display this directly in the chat or a specific UI element.
        // For now, it's in the Grok chat history.
      } else {
        const errorMessage = "Sorry, I couldn't find information on that topic using Grok.";
        this.stateManager.addGrokChatMessage({ role: 'assistant', content: errorMessage });
        console.error(errorMessage);
        this.stateManager.setBotEmotion('concerned', 'Grok research failed');
      }
    } catch (error) {
      const errorMessage = "An error occurred while researching with Grok.";
      this.stateManager.addGrokChatMessage({ role: 'assistant', content: errorMessage });
      console.error(errorMessage, error);
      this.stateManager.setBotEmotion('concerned', 'Grok research error');
    } finally {
      this.stateManager.setIdeating(false);
      this.stateManager.setStatusMessage("");
    }
  }
}