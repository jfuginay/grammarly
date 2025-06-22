export interface CompanionMessage {
  message: string;
  type: 'encouragement' | 'celebration' | 'guidance' | 'observation' | 'humor';
  context: 'writer_block' | 'breakthrough' | 'polishing' | 'starting' | 'struggling' | 'flowing';
  tone: 'supportive' | 'excited' | 'gentle' | 'playful' | 'focused';
  trigger: 'time_based' | 'content_based' | 'pattern_based' | 'context_based';
}

export class CompanionMessageService {
  private lastMessageTime: number = 0;
  private messageHistory: string[] = [];
  private currentContext: string = 'general';

  // Encouragement messages for different situations
  private encouragementMessages: CompanionMessage[] = [
    // Writer's block encouragement
    {
      message: "Stuck? Let's try a different angle... 💡",
      type: 'guidance',
      context: 'writer_block',
      tone: 'supportive',
      trigger: 'pattern_based'
    },
    {
      message: "Sometimes the best writing comes from taking a breath. Want to try a quick brainstorm? 🌟",
      type: 'encouragement',
      context: 'writer_block',
      tone: 'gentle',
      trigger: 'time_based'
    },
    {
      message: "Every writer has moments like this - you're not alone! 🤝",
      type: 'encouragement',
      context: 'writer_block',
      tone: 'supportive',
      trigger: 'pattern_based'
    },

    // Breakthrough celebrations
    {
      message: "Ooh, that's a great line! ✨",
      type: 'celebration',
      context: 'breakthrough',
      tone: 'excited',
      trigger: 'content_based'
    },
    {
      message: "Look at you go! This is really taking shape! 🚀",
      type: 'celebration',
      context: 'breakthrough',
      tone: 'excited',
      trigger: 'content_based'
    },
    {
      message: "You're on fire today! 🔥",
      type: 'celebration',
      context: 'breakthrough',
      tone: 'excited',
      trigger: 'pattern_based'
    },

    // Polishing support
    {
      message: "This explanation is getting really clear! 🔧",
      type: 'celebration',
      context: 'polishing',
      tone: 'focused',
      trigger: 'content_based'
    },
    {
      message: "Great job breaking down the complex stuff! 👨‍💻",
      type: 'celebration',
      context: 'polishing',
      tone: 'supportive',
      trigger: 'content_based'
    },
    {
      message: "This sounds so professional and polished! 💼",
      type: 'celebration',
      context: 'polishing',
      tone: 'excited',
      trigger: 'content_based'
    },

    // Starting encouragement
    {
      message: "You've got this! Every word you write is progress ✨",
      type: 'encouragement',
      context: 'starting',
      tone: 'supportive',
      trigger: 'pattern_based'
    },
    {
      message: "Sometimes the best writing comes from just getting started! 🌟",
      type: 'encouragement',
      context: 'starting',
      tone: 'gentle',
      trigger: 'time_based'
    },
    {
      message: "Let's turn those thoughts into something amazing! ✨",
      type: 'encouragement',
      context: 'starting',
      tone: 'excited',
      trigger: 'pattern_based'
    },

    // Gentle humor and observations
    {
      message: "Ah, the classic 'staring at screen' phase. We've all been there! 😄",
      type: 'humor',
      context: 'struggling',
      tone: 'playful',
      trigger: 'pattern_based'
    },
    {
      message: "Sometimes the delete key is our best friend. Fresh start? 🗑️✨",
      type: 'humor',
      context: 'struggling',
      tone: 'playful',
      trigger: 'pattern_based'
    },
    {
      message: "Coffee break? ☕ Sometimes stepping away brings the best ideas!",
      type: 'observation',
      context: 'struggling',
      tone: 'gentle',
      trigger: 'time_based'
    },

    // Flow state observations
    {
      message: "I love how you're building this up! 🎯",
      type: 'celebration',
      context: 'flowing',
      tone: 'excited',
      trigger: 'pattern_based'
    },
    {
      message: "Your voice really comes through in this! ✨",
      type: 'celebration',
      context: 'flowing',
      tone: 'supportive',
      trigger: 'content_based'
    },
    {
      message: "This feels so authentic! 🌟",
      type: 'celebration',
      context: 'flowing',
      tone: 'excited',
      trigger: 'content_based'
    }
  ];

  // Context-specific messages
  private contextMessages = {
    'code-review': [
      "This feedback is really constructive! 👨‍💻",
      "Great catch on that edge case! 🔍",
      "Your code review style is so helpful! ✨",
      "Love how you're thinking about maintainability! 🔧"
    ],
    'sprint-planning': [
      "This user story is crystal clear! 📋",
      "Love how actionable this is! ✅",
      "Your team is going to love this clarity! 👥",
      "Perfect balance of detail and simplicity! 🎯"
    ],
    'linkedin': [
      "This is going to resonate with your network! 💼",
      "Perfect balance of professional and personal! ✨",
      "Your insights are going to help so many people! 🌟",
      "This has real thought leadership energy! 🚀"
    ],
    'social': [
      "This feels so genuine! ✨",
      "Your personality really shines through! 🌟",
      "This is going to connect with people! 💫",
      "Love the authentic voice here! 🎨"
    ],
    'docs': [
      "This documentation is going to save so much time! 📚",
      "Crystal clear explanations! 💎",
      "Your team will thank you for this clarity! 👥",
      "This is exactly what good docs look like! ✨"
    ],
    'chat': [
      "Perfect tone for team communication! 💬",
      "This is going to get the right response! 🎯",
      "Love the collaborative energy! 🤝",
      "Clear, friendly, and actionable! ✨"
    ]
  };

  updateContext(context: string) {
    this.currentContext = context;
  }

  addToHistory(message: string) {
    this.messageHistory.push(message);
    if (this.messageHistory.length > 5) {
      this.messageHistory.shift();
    }
  }

  // Get a contextual message based on the current situation
  getContextualMessage(
    text: string,
    writingPattern: 'fast' | 'slow' | 'steady' | 'paused',
    timeSinceLastMessage: number = 0
  ): CompanionMessage | null {
    const now = Date.now();
    
    // Don't message too frequently (minimum 45 seconds between messages)
    if (now - this.lastMessageTime < 45000) {
      return null;
    }

    // Analyze the current situation
    const analysis = this.analyzeSituation(text, writingPattern, timeSinceLastMessage);
    
    // Get appropriate messages
    const possibleMessages = this.encouragementMessages.filter(msg => {
      return this.shouldShowMessage(msg, analysis);
    });

    if (possibleMessages.length === 0) {
      return null;
    }

    // Add context-specific messages if available
    if (this.contextMessages[this.currentContext as keyof typeof this.contextMessages]) {
      const contextSpecificMessages = this.contextMessages[this.currentContext as keyof typeof this.contextMessages];
      const randomContextMessage = contextSpecificMessages[Math.floor(Math.random() * contextSpecificMessages.length)];
      
      // 30% chance to use context-specific message
      if (Math.random() < 0.3) {
        this.lastMessageTime = now;
        return {
          message: randomContextMessage,
          type: 'celebration',
          context: 'flowing',
          tone: 'excited',
          trigger: 'context_based'
        };
      }
    }

    // Select a random message from possible ones
    const selectedMessage = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
    
    // Avoid repeating recent messages
    if (this.messageHistory.includes(selectedMessage.message)) {
      const otherMessages = possibleMessages.filter(msg => !this.messageHistory.includes(msg.message));
      if (otherMessages.length > 0) {
        const alternativeMessage = otherMessages[Math.floor(Math.random() * otherMessages.length)];
        this.lastMessageTime = now;
        this.addToHistory(alternativeMessage.message);
        return alternativeMessage;
      }
    }

    this.lastMessageTime = now;
    this.addToHistory(selectedMessage.message);
    return selectedMessage;
  }

  private analyzeSituation(
    text: string,
    writingPattern: 'fast' | 'slow' | 'steady' | 'paused',
    timeSinceLastMessage: number
  ) {
    const wordCount = text.split(/\s+/).length;
    const hasEmojis = /[✨🎯🚀💡🔧👨‍💻💼🌟💫🎨🤝🗑️🔥]/.test(text);
    const hasTechnicalTerms = /\b(API|function|database|algorithm|framework|deployment|testing|debugging|optimization|architecture)\b/i.test(text);
    const hasProfessionalTerms = /\b(strategy|implementation|collaboration|leadership|innovation|expertise|experience|achievement|success|growth)\b/i.test(text);
    const hasPersonalTouch = /\b(I|me|my|we|our|team|feel|think|believe|love|excited|proud)\b/i.test(text);
    const hasQuestions = /\?/.test(text);
    const hasExclamations = /!/.test(text);
    const isLongForm = wordCount > 50;
    const isShortForm = wordCount < 20;

    return {
      wordCount,
      hasEmojis,
      hasTechnicalTerms,
      hasProfessionalTerms,
      hasPersonalTouch,
      hasQuestions,
      hasExclamations,
      isLongForm,
      isShortForm,
      writingPattern,
      timeSinceLastMessage,
      context: this.currentContext
    };
  }

  private shouldShowMessage(message: CompanionMessage, analysis: any): boolean {
    switch (message.trigger) {
      case 'time_based':
        return analysis.timeSinceLastMessage > 120000; // 2 minutes
      case 'content_based':
        return this.matchesContentCriteria(message, analysis);
      case 'pattern_based':
        return this.matchesPatternCriteria(message, analysis);
      case 'context_based':
        return true; // Always available for context-based messages
      default:
        return false;
    }
  }

  private matchesContentCriteria(message: CompanionMessage, analysis: any): boolean {
    switch (message.context) {
      case 'breakthrough':
        return analysis.hasExclamations && analysis.hasPersonalTouch && analysis.wordCount > 30;
      case 'polishing':
        return (analysis.hasTechnicalTerms || analysis.hasProfessionalTerms) && analysis.wordCount > 20;
      case 'flowing':
        return analysis.hasPersonalTouch && analysis.wordCount > 40;
      default:
        return true;
    }
  }

  private matchesPatternCriteria(message: CompanionMessage, analysis: any): boolean {
    switch (message.context) {
      case 'writer_block':
        return analysis.writingPattern === 'paused' && analysis.wordCount < 10;
      case 'struggling':
        return analysis.writingPattern === 'paused' || analysis.wordCount < 5;
      case 'flowing':
        return analysis.writingPattern === 'fast' && analysis.wordCount > 50;
      case 'starting':
        return analysis.wordCount < 20 && analysis.writingPattern !== 'paused';
      default:
        return true;
    }
  }

  // Get a random encouragement message
  getRandomEncouragement(): string {
    const encouragements = [
      "You've got this! Every word you write is progress ✨",
      "Writing is a journey, and you're making great strides! 🚀",
      "Your ideas are worth sharing - let's make them shine! 💫",
      "You're building something meaningful, one word at a time! 🎯",
      "Your voice matters, and it's coming through beautifully! 🎨",
      "Every writer has moments like this - you're not alone! 🤝",
      "Let's turn those thoughts into something amazing! ✨",
      "Sometimes the best writing comes from just getting started! 🌟"
    ];

    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }
} 