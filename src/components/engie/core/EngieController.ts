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
      this.stateManager.updateDragLockWithExternalSuggestions(this.props.suggestions); // Update drag lock status
      
      this.stateManager.setEmotionBasedOnQuality(suggestions.length, text.length);

      if (suggestions.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Engie: Found suggestions, opening chat and moving to suggestions area');
        }
        // Move to suggestions area autonomously
        this.stateManager.moveToOptimalPosition('suggestions');
        this.stateManager.setChatOpen(true);
        this.stateManager.setActiveTab('tone');
        
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
        
        // NEW: Check for technical writing when no grammar issues found
        const state = this.stateManager.getState();
        if (!state.ideationMessage && !state.encouragementMessageApi) {
          console.log('🔍 No grammar issues found, checking for technical writing opportunities');
          this.analyzeContentForTechnicalWriting(text);
        }
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
      
      // NEW: Analyze content for technical writing during typing
      if (this.props.targetEditorSelector) {
        const currentText = this.textExtractor.extractTextFromTarget(this.props.targetEditorSelector);
        if (currentText && currentText.length > 50 && !state.ideationMessage) {
          // Only analyze if there's substantial content and no existing message
          console.log('⌨️ Analyzing content during typing for technical writing');
          this.analyzeContentForTechnicalWriting(currentText);
        }
      }
    }
  }

  /**
   * Handle new document or empty document scenarios
   * Shows contextual encouragement messages for starting to write
   */
  handleNewDocumentOrEmpty(text: string = ''): void {
    console.log('🔍 handleNewDocumentOrEmpty called with text:', text?.length || 0, 'characters');
    const state = this.stateManager.getState();
    
    // Check if this is a new/empty document scenario
    const isEmptyOrMinimal = !text || text.trim().length < 10;
    console.log('📝 isEmptyOrMinimal:', isEmptyOrMinimal, 'isChatOpen:', state.isChatOpen);
    
    if (isEmptyOrMinimal && !state.isChatOpen) {
      console.log('✨ Triggering technical writing popup for new document');
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
      console.log('💬 Setting ideation message:', randomMessage);
      
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
    } else if (!isEmptyOrMinimal && !state.isChatOpen) {
      // NEW: Analyze existing content for technical writing
      console.log('🔬 Analyzing existing content for technical writing detection');
      this.analyzeContentForTechnicalWriting(text);
    } else {
      console.log('❌ Not showing popup because:', 
        'isEmptyOrMinimal:', isEmptyOrMinimal, 
        'isChatOpen:', state.isChatOpen);
    }
  }

  /**
   * Analyze content for technical writing and show appropriate prompts
   */
  private analyzeContentForTechnicalWriting(text: string): void {
    // Technical writing detection patterns
    const hasTechnicalTerms = /\b(API|function|database|algorithm|framework|deployment|testing|debugging|optimization|architecture|server|client|endpoint|repository|authentication|authorization|configuration|implementation|infrastructure|scalability|performance|security|documentation|code|programming|development|software|application|system|platform|integration|deployment|version|release|feature|bug|issue|pull request|commit|branch|merge|review)\b/i.test(text);
    
    const hasCodePatterns = /\b(class|function|const|let|var|if|else|for|while|return|import|export|async|await|try|catch|throw|console\.log|console\.error|JSON|HTTP|REST|GraphQL|SQL|NoSQL)\b/i.test(text);
    
    const hasDocumentationPatterns = /\b(installation|setup|configuration|getting started|prerequisites|requirements|usage|examples|tutorial|guide|documentation|readme|changelog|version|release notes)\b/i.test(text);
    
    const hasTechnicalFormats = /```|`[^`]+`|\#\s+[A-Z]|\*\*[^*]+\*\*|##\s+|\-\s+\w+/i.test(text);
    
    const technicalScore = 
      (hasTechnicalTerms ? 1 : 0) + 
      (hasCodePatterns ? 1 : 0) + 
      (hasDocumentationPatterns ? 1 : 0) + 
      (hasTechnicalFormats ? 1 : 0);
    
    console.log('🔬 Technical writing analysis:', {
      hasTechnicalTerms,
      hasCodePatterns, 
      hasDocumentationPatterns,
      hasTechnicalFormats,
      technicalScore,
      textPreview: text.substring(0, 100)
    });
    
    // Show technical writing prompt if technical content detected
    if (technicalScore >= 2) {
      console.log('🔧 Technical writing detected! Showing technical writing prompt');
      
      const technicalMessages = [
        "I see technical content! 🔧 I can help with clarity, structure, and technical accuracy.",
        "Technical writing detected! 👨‍💻 Let me help you make this crystal clear for your audience.",
        "Great technical content! 📚 I can suggest improvements for readability and precision.",
        "I notice technical documentation! 🛠️ Want help making it more accessible?",
        "Technical writing mode activated! 🚀 I'll help you balance accuracy with clarity.",
        "Detected code/technical content! 💡 I can help with explanations and documentation style.",
        "Technical documentation spotted! 📖 Let's make it clear and comprehensive.",
        "I see technical details! ⚡ I can help structure this for maximum impact."
      ];
      
      const randomTechMessage = technicalMessages[Math.floor(Math.random() * technicalMessages.length)];
      
      this.stateManager.setIdeationMessage({
        role: 'assistant',
        content: randomTechMessage
      });
      
      this.stateManager.setChatOpen(true);
      this.stateManager.setBotEmotion('thoughtful', 'Analyzing your technical content');
      this.stateManager.moveToOptimalPosition('analysis');
      
      // Auto-close after 10 seconds for technical prompts
      setTimeout(() => {
        if (this.stateManager.getState().ideationMessage?.content === randomTechMessage) {
          this.stateManager.setIdeationMessage(null);
          this.stateManager.setChatOpen(false);
          this.stateManager.setBotEmotion('neutral', '');
        }
      }, 10000);
    } else {
      console.log('📝 Non-technical content detected, no special prompt needed');
    }
  }

  /**
   * Handle document selection or creation
   * Triggers appropriate contextual messages
   */
  handleDocumentChange(newText: string = '', isNewDocument: boolean = false): void {
    console.log('📄 handleDocumentChange called:', {
      textLength: newText?.length || 0,
      isNewDocument,
      textPreview: newText?.substring(0, 50) || '(empty)'
    });
    
    const state = this.stateManager.getState();
    
    // Reset suggestions when document changes
    this.stateManager.resetSuggestions();
    this.stateManager.setCurrentSuggestionIndex(0);
    
    // If it's a new document or empty, show encouragement
    if (isNewDocument || !newText || newText.trim().length < 10) {
      console.log('🎯 Document is new or empty, will trigger popup in 500ms');
      // Delay slightly to allow UI to settle
      setTimeout(() => {
        this.handleNewDocumentOrEmpty(newText);
      }, 500);
    } else {
      console.log('📖 Document has content, moving to analysis area');
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
    const { isChatOpen } = this.stateManager.getState();
    if (isChatOpen) {
      this.handleEngieClose();
    } else {
      this.stateManager.setChatOpen(true);
      this.analyzePageTone();
    }
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
    } else { // All suggestions handled
      this.stateManager.setCurrentSuggestionIndex(0);
      this.stateManager.resetSuggestions();
      
      // Re-evaluate drag lock based on potentially existing external suggestions
      const activeSuggestionsAfterReset = this.stateManager.getActiveSuggestions(this.props.suggestions);
      const shouldBeLocked = activeSuggestionsAfterReset.length > 0;
      this.stateManager.setDragLocked(shouldBeLocked);

      if (!shouldBeLocked) {
        // Move to idle position when all suggestions are completed and no external suggestions
        this.stateManager.moveToOptimalPosition('idle');
      }
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

  handleDrag(e: any, data: any): void {
    // Check if dragging is locked due to active suggestions
    const state = this.stateManager.getState();
    if (state.isDragLocked) {
      // Prevent dragging by not updating position
      return;
    }

    const deltaX = data.x - this.lastX;
    if (Math.abs(deltaX) > 5) {
      this.stateManager.setBotDirection(deltaX > 0 ? 'right' : 'left');
      this.stateManager.setBotSpeed(Math.abs(deltaX) > 20 ? 'fast' : 'normal');
    }
    this.lastX = data.x;
    // The position is now updated directly in EngieBot.tsx for smoother dragging
    // this.stateManager.setEngiePos({ x: data.x, y: data.y });
  }

  onStartDrag(): void {
    // Check if dragging is locked due to active suggestions
    const state = this.stateManager.getState();
    if (state.isDragLocked) {
      return;
    }

    this.stateManager.setBotAnimation('walking');
  }

  onStopDrag(): void {
    // Check if dragging is locked due to active suggestions
    const state = this.stateManager.getState();
    if (state.isDragLocked) {
      return;
    }

    this.stateManager.setBotAnimation('idle');
    // Start walking back to text analysis area after a short delay
    setTimeout(() => {
      this.stateManager.startWalkBack();
    }, 1000); // Wait 1 second before starting walk back
  }

  updateEngiePosition(x: number, y: number): void {
    // Apply tethering constraints to keep Engie near the text analysis area
    const constrainedPosition = this.applyTetherConstraints(x, y);
    this.stateManager.setEngiePos(constrainedPosition);
  }

  /**
   * Apply tetherball-like constraints to keep Engie near the text analysis area
   */
  private applyTetherConstraints(x: number, y: number): { x: number; y: number } {
    // Get the "home base" position (text analysis area)
    const homeBase = this.stateManager.calculateTextAnalysisPosition();
    
    // Define the maximum tether radius (how far Engie can wander)
    const maxTetherRadius = 300; // pixels
    const engieSize = 64;
    const screenPadding = 20;
    
    // Calculate distance from home base
    const dx = x - homeBase.x;
    const dy = y - homeBase.y;
    const distanceFromHome = Math.sqrt(dx * dx + dy * dy);
    
    let constrainedX = x;
    let constrainedY = y;
    
    // If Engie is trying to go beyond the tether radius, constrain it
    if (distanceFromHome > maxTetherRadius) {
      // Calculate the constrained position on the edge of the tether circle
      const angle = Math.atan2(dy, dx);
      constrainedX = homeBase.x + Math.cos(angle) * maxTetherRadius;
      constrainedY = homeBase.y + Math.sin(angle) * maxTetherRadius;
    }
    
    // Also ensure Engie stays within the viewport bounds
    if (typeof window !== 'undefined') {
      const maxX = window.innerWidth - engieSize - screenPadding;
      const maxY = window.innerHeight - engieSize - screenPadding;
      
      constrainedX = Math.max(screenPadding, Math.min(constrainedX, maxX));
      constrainedY = Math.max(screenPadding, Math.min(constrainedY, maxY));
    }
    
    return { x: constrainedX, y: constrainedY };
  }

  formatScore(score: number | undefined | null): string {
    if (typeof score !== 'number' || isNaN(score)) return 'N/A';
    return (score * 100).toFixed(0) + '%';
  }

  cleanup(): void {
    if (this.debounceTimeoutRef) clearTimeout(this.debounceTimeoutRef);
    if (this.inactivityTimerRef) clearTimeout(this.inactivityTimerRef);
  }

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