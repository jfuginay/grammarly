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
  // private grokDeactivationTimer: NodeJS.Timeout | null = null; // Removed
  private lastX: number = 0;

  constructor(private props: EngieProps) {
    this.stateManager = new EngieStateManager();
    this.apiService = EngieApiService.getInstance();
    this.textExtractor = TextExtractorService.getInstance();
    
    // Only initialize GrokApiService on the server side
    if (typeof window === 'undefined') {
      this.grokApiService = GrokApiService.getInstance();
    } else {
      // Set a null value on client side to avoid undefined errors
      this.grokApiService = null as any;
    }
    
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
          if (process.env.NODE_ENV === 'development') {
            console.log("Inactivity detected, triggering ideation.");
          }
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
            this.stateManager.setBotEmotion('thoughtful', 'Thinking of ideas for you');

    try {
      const pageText = this.textExtractor.extractFullPageText();

      if (!pageText || pageText.length < 50) {
        if (process.env.NODE_ENV === 'development') {
          console.log("Not enough content for ideation.");
        }
        this.stateManager.setIdeating(false);
        this.stateManager.setStatusMessage("");
        return;
      }

      // Grok integration for opinionated comment
      if (state.isGrokActive && typeof window === 'undefined' && this.grokApiService) {
        const commentPrompt = `Give me an opinionated, funny, or insightful comment about the following text: ${pageText.slice(0, 1000)}`;
        this.stateManager.addGrokChatMessage({ role: 'user', content: `Engie wants an opinionated comment on: "${pageText.substring(0,60)}..."` });
        const comment = await this.grokApiService.getOpinionatedComment(commentPrompt);
        if (comment) {
          this.stateManager.addGrokChatMessage({ role: 'assistant', content: comment });
          if (process.env.NODE_ENV === 'development') {
            console.log("Grok Comment:", comment);
          }
          this.stateManager.setBotEmotion('excited', 'Grok has a thought!');
        } else {
          this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, I couldn't come up with a Grok comment right now." });
          this.stateManager.setBotEmotion('concerned', 'Grok comment failed');
        }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('Engie: Starting scan for suggestions');
      console.log('Engie: Target editor selector:', this.props.targetEditorSelector);
    }
    
    if (!this.props.targetEditorSelector) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Engie: No target editor selector provided');
      }
      return;
    }

    const text = this.textExtractor.extractTextFromTarget(this.props.targetEditorSelector);
    if (process.env.NODE_ENV === 'development') {
      console.log('Engie: Extracted text length:', text?.length || 0);
      console.log('Engie: Previous scanned text length:', this.prevScannedTextRef?.length || 0);
    }
    
    if (!text || text === this.prevScannedTextRef || text.length < 10) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Engie: Skipping scan - no text, same text, or too short');
      }
      return;
    }

    this.prevScannedTextRef = text;
    this.stateManager.setScanning(true);
    this.stateManager.setStatusMessage("✨ Reading through your writing...");
    this.stateManager.setBotEmotion('thoughtful', 'Taking a look at your work');

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Engie: Making API calls for suggestions and tone analysis');
      }
      const [suggestions, toneAnalysis] = await Promise.all([
        this.apiService.fetchTypoSuggestions(text),
        this.apiService.fetchToneAnalysis(text)
      ]);

      if (process.env.NODE_ENV === 'development') {
        console.log('Engie: API calls completed. Suggestions:', suggestions.length, 'Tone analysis:', !!toneAnalysis);
      }

      this.stateManager.setInternalSuggestions(suggestions);
      this.stateManager.setToneAnalysisResult(toneAnalysis);
      this.stateManager.setCurrentSuggestionIndex(0);
      
      this.stateManager.setEmotionBasedOnQuality(suggestions.length, text.length);

      if (suggestions.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Engie: Found suggestions, opening chat and moving to suggestions area');
        }
        // Move to suggestions area autonomously
        this.stateManager.moveToOptimalPosition('suggestions');
        this.stateManager.setChatOpen(true);
        this.stateManager.setActiveTab('suggestions');
        
        if (suggestions.length > 5) {
          this.stateManager.setBotEmotion('concerned', 'Found several issues to fix');
        } else if (suggestions.length > 0) {
          this.stateManager.setBotEmotion('thoughtful', 'Found a few suggestions');
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Engie: No suggestions found, moving to analysis area');
        }
        // Move to analysis area when no suggestions
        this.stateManager.moveToOptimalPosition('analysis');
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

  // Handle user typing activity
  handleTypingActivity(): void {
    const state = this.stateManager.getState();
    const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
    
    // Only move to writing area if no active suggestions (otherwise stay near suggestions)
    if (activeSuggestions.length === 0 && !state.isChatOpen) {
      this.stateManager.moveToOptimalPosition('writing');
      this.stateManager.setBotEmotion('thoughtful', 'Watching your writing flow...');
    }
  }

  /**
   * Handle new document or empty document scenarios
   * Shows contextual encouragement messages for starting to write
   */
  handleNewDocumentOrEmpty(text: string = ''): void {
    const state = this.stateManager.getState();
    
    // Check if this is a new/empty document scenario
    const isEmptyOrMinimal = !text || text.trim().length < 10;
    
    if (isEmptyOrMinimal && !state.isChatOpen) {
      // Move to writing area to encourage user to start
      this.stateManager.moveToOptimalPosition('writing');
      
      // Show contextual encouragement message for new documents
      const contextualMessages = [
        "Ready to write something amazing? 📝 Let's get started!",
        "Fresh document, fresh ideas! ✨ What are you working on today?",
        "Perfect! A blank canvas for your thoughts. 🎨 Let's bring them to life!",
        "New document energy! 🚀 I'm here to help you craft something great.",
        "Love a fresh start! 💫 What story are you going to tell today?",
        "Technical writing, creative content, or professional docs - I'm ready to help! 🔧",
        "Starting fresh? Perfect! 🌟 Let's make every word count.",
        "Empty page, endless possibilities! ✨ Let's turn your ideas into words."
      ];
      
      const randomMessage = contextualMessages[Math.floor(Math.random() * contextualMessages.length)];
      
      // Set a welcoming message and open chat briefly
      this.stateManager.setIdeationMessage({
        role: 'assistant',
        content: randomMessage
      });
      
      this.stateManager.setChatOpen(true);
      this.stateManager.setBotEmotion('excited', 'Ready to help with your writing!');
      
      // Auto-close the message after 8 seconds to not be intrusive
      setTimeout(() => {
        if (this.stateManager.getState().ideationMessage?.content === randomMessage) {
          this.stateManager.setIdeationMessage(null);
          this.stateManager.setChatOpen(false);
          this.stateManager.setBotEmotion('neutral', '');
        }
      }, 8000);
    }
  }

  /**
   * Handle document selection or creation
   * Triggers appropriate contextual messages
   */
  handleDocumentChange(newText: string = '', isNewDocument: boolean = false): void {
    const state = this.stateManager.getState();
    
    // Reset suggestions when document changes
    this.stateManager.resetSuggestions();
    this.stateManager.setCurrentSuggestionIndex(0);
    
    // If it's a new document or empty, show encouragement
    if (isNewDocument || !newText || newText.trim().length < 10) {
      // Delay slightly to allow UI to settle
      setTimeout(() => {
        this.handleNewDocumentOrEmpty(newText);
      }, 500);
    } else {
      // For existing documents with content, move to analysis area
      this.stateManager.moveToOptimalPosition('analysis');
      this.stateManager.setBotEmotion('thoughtful', 'Looking at your document...');
    }
  }

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
      this.stateManager.setEmotionBasedOnInteraction('chat-opened');
    }
    this.stateManager.setChatOpen(!state.isChatOpen);
  }

  handleEngieClose(): void {
    this.stateManager.setChatOpen(false);
    const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
    if (activeSuggestions.length === 0) {
      // Move to idle position when no suggestions
      this.stateManager.moveToOptimalPosition('idle');
    } else {
      // Stay near suggestions if they exist
      this.stateManager.moveToOptimalPosition('suggestions');
    }
    this.stateManager.setBotEmotion('neutral', '');
  }

  handleApply(): void {
    const currentSuggestion = this.stateManager.getCurrentSuggestion(this.props.suggestions);
    if (currentSuggestion) {
      this.props.onApply(currentSuggestion);
      this.stateManager.setEmotionBasedOnInteraction('suggestion-applied');
      const activeSuggestions = this.stateManager.getActiveSuggestions(this.props.suggestions);
      const totalSuggestions = activeSuggestions.length + 1;
      const completedSuggestions = 1;
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
      if (activeSuggestions[nextIndex]) {
        // Stay in suggestions area for next suggestion
        this.stateManager.moveToOptimalPosition('suggestions');
      }
    } else {
      this.stateManager.setCurrentSuggestionIndex(0);
      this.stateManager.resetSuggestions();
      // Move to idle position when all suggestions are completed
      this.stateManager.moveToOptimalPosition('idle');
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

  formatScore(score: number | undefined | null): string {
    if (typeof score !== 'number' || isNaN(score)) return 'N/A';
    return (score * 100).toFixed(0) + '%';
  }

  cleanup(): void {
    if (this.debounceTimeoutRef) clearTimeout(this.debounceTimeoutRef);
    if (this.inactivityTimerRef) clearTimeout(this.inactivityTimerRef);
    // if (this.grokDeactivationTimer) clearTimeout(this.grokDeactivationTimer); // Removed
  }

  public stepTowardMouse(): void {
    if (typeof window === 'undefined') return;
    const mouse = (window as any).__engieMousePos;
    if (!mouse) return;
    const { x: botX, y: botY } = this.stateManager.getState().engiePos;
    const dx = mouse.x - botX;
    const dy = mouse.y - botY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;
    const step = 24;
    const ratio = step / dist;
    const newX = botX + dx * ratio;
    const newY = botY + dy * ratio;
    this.stateManager.setEngiePos({ x: newX, y: newY });
    this.stateManager.setBotDirection(dx > 0 ? 'right' : 'left');
    this.stateManager.setBotAnimation('walking');
    setTimeout(() => this.stateManager.setBotAnimation('idle'), 200);
  }

  // Removed toggleGrokMode, deactivateGrokMode, and researchWithGrok methods
  // as the UI for these has been removed from GrokTab and EngieChatWindow.
  // isGrokActive state will remain at its default (likely false)
  // unless activated by other means not covered in this change.

  /**
   * Send a message to Grok chat and handle the response
   */
  public async sendGrokChatMessage(prompt: string): Promise<void> {
    // If we're on the client side, we should redirect this call to the server API
    if (typeof window !== 'undefined' || !this.grokApiService) {
      // Add the user message to chat history
      this.stateManager.addGrokChatMessage({ role: 'user', content: prompt });
      
      try {
        // Use API service to call the server endpoint instead
        const chatHistory = this.stateManager.getState().grokChatHistory;
        const response = await this.apiService.sendGrokChat(prompt, chatHistory);
        
        if (response) {
          // Add the assistant's response to chat history
          this.stateManager.addGrokChatMessage({ role: 'assistant', content: response });
        } else {
          // Handle error case
          this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, I couldn't process your request." });
        }
      } catch (error) {
        console.error("Error sending Grok chat via API:", error);
        this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, there was an error processing your request." });
      }
      return;
    }
    
    // Server-side processing with direct Groq client
    if (!this.grokApiService) {
      console.error("Grok API service not available");
      this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, Grok chat is not available at this time." });
      return;
    }
    
    // Add the user message to chat history
    this.stateManager.addGrokChatMessage({ role: 'user', content: prompt });
    
    // Send the entire chat history to get a contextual response
    const chatHistory = this.stateManager.getState().grokChatHistory;
    const response = await this.grokApiService.sendChat(chatHistory);
    
    if (response) {
      // Add the assistant's response to chat history
      this.stateManager.addGrokChatMessage({ role: 'assistant', content: response });
    } else {
      // Handle error case
      this.stateManager.addGrokChatMessage({ role: 'assistant', content: "Sorry, I couldn't process your request." });
    }
  }
}