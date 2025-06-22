export interface EngieMood {
  emotion: 'excited' | 'focused' | 'encouraging' | 'thoughtful' | 'playful' | 'supportive' | 'curious' | 'proud';
  intensity: 'subtle' | 'moderate' | 'energetic';
  context: 'writing' | 'stuck' | 'breakthrough' | 'polishing' | 'starting' | 'finishing';
}

export interface EngieReaction {
  message: string;
  mood: EngieMood;
  trigger: string;
  timing: 'immediate' | 'delayed' | 'periodic';
  frequency: 'rare' | 'occasional' | 'common';
}

export interface WritingContext {
  type: 'code-review' | 'sprint-planning' | 'linkedin' | 'social' | 'docs' | 'chat';
  tone: 'professional' | 'casual' | 'technical' | 'social';
  audience: 'team' | 'public' | 'client' | 'community';
  purpose: 'inform' | 'persuade' | 'explain' | 'connect';
}

export class EngiePersonalityEngine {
  private writingHistory: string[] = [];
  private lastReactionTime: number = 0;
  private currentContext: WritingContext | null = null;
  private userWritingPattern: 'fast' | 'slow' | 'steady' | 'paused' = 'steady';

  // Personality traits that make Engie feel like a real companion
  private personalityTraits = {
    enthusiasm: 0.8, // Gets genuinely excited about good writing
    empathy: 0.9,    // Understands writing struggles
    humor: 0.6,      // Gentle, helpful humor
    patience: 0.95,  // Never rushes or pressures
    creativity: 0.7, // Suggests creative angles
    support: 0.9     // Always encouraging
  };

  // Contextual reactions based on what the user is writing
  private contextualReactions: EngieReaction[] = [
    // Creative/Exciting moments
    {
      message: "Ooh, that's a great line! ✨",
      mood: { emotion: 'excited', intensity: 'moderate', context: 'breakthrough' },
      trigger: 'creative_breakthrough',
      timing: 'immediate',
      frequency: 'occasional'
    },
    {
      message: "I love how you're building this up! 🎯",
      mood: { emotion: 'proud', intensity: 'moderate', context: 'writing' },
      trigger: 'good_structure',
      timing: 'delayed',
      frequency: 'common'
    },

    // Encouragement during struggles
    {
      message: "Stuck? Let's try a different angle... 💡",
      mood: { emotion: 'encouraging', intensity: 'moderate', context: 'stuck' },
      trigger: 'writer_block',
      timing: 'delayed',
      frequency: 'occasional'
    },
    {
      message: "Sometimes the best writing comes from taking a breath. Want to try a quick brainstorm? 🌟",
      mood: { emotion: 'supportive', intensity: 'subtle', context: 'stuck' },
      trigger: 'long_pause',
      timing: 'delayed',
      frequency: 'rare'
    },

    // Technical writing support
    {
      message: "This explanation is getting really clear! 🔧",
      mood: { emotion: 'focused', intensity: 'moderate', context: 'polishing' },
      trigger: 'technical_clarity',
      timing: 'immediate',
      frequency: 'common'
    },
    {
      message: "Great job breaking down the complex stuff! 👨‍💻",
      mood: { emotion: 'proud', intensity: 'moderate', context: 'writing' },
      trigger: 'technical_success',
      timing: 'delayed',
      frequency: 'occasional'
    },

    // Professional writing moments
    {
      message: "This sounds so professional and polished! 💼",
      mood: { emotion: 'proud', intensity: 'moderate', context: 'polishing' },
      trigger: 'professional_tone',
      timing: 'immediate',
      frequency: 'common'
    },
    {
      message: "You're really nailing the tone for this audience! 🎯",
      mood: { emotion: 'excited', intensity: 'moderate', context: 'writing' },
      trigger: 'audience_fit',
      timing: 'delayed',
      frequency: 'occasional'
    },

    // Social/Personal moments
    {
      message: "This feels so authentic! Your voice really comes through ✨",
      mood: { emotion: 'excited', intensity: 'moderate', context: 'breakthrough' },
      trigger: 'authentic_voice',
      timing: 'immediate',
      frequency: 'occasional'
    },
    {
      message: "Love the personality you're bringing to this! 🌟",
      mood: { emotion: 'playful', intensity: 'moderate', context: 'writing' },
      trigger: 'personal_touch',
      timing: 'delayed',
      frequency: 'common'
    },

    // Gentle humor and observations
    {
      message: "Ah, the classic 'staring at screen' phase. We've all been there! 😄",
      mood: { emotion: 'playful', intensity: 'subtle', context: 'stuck' },
      trigger: 'writer_struggle',
      timing: 'delayed',
      frequency: 'rare'
    },
    {
      message: "Sometimes the delete key is our best friend. Fresh start? 🗑️✨",
      mood: { emotion: 'encouraging', intensity: 'subtle', context: 'stuck' },
      trigger: 'deletion_spree',
      timing: 'immediate',
      frequency: 'rare'
    },

    // Celebration moments
    {
      message: "Look at you go! This is really taking shape! 🚀",
      mood: { emotion: 'excited', intensity: 'energetic', context: 'breakthrough' },
      trigger: 'significant_progress',
      timing: 'immediate',
      frequency: 'occasional'
    },
    {
      message: "You're on fire today! 🔥",
      mood: { emotion: 'proud', intensity: 'energetic', context: 'writing' },
      trigger: 'writing_flow',
      timing: 'delayed',
      frequency: 'rare'
    }
  ];

  // Context-specific personality adjustments
  private contextPersonalities = {
    'code-review': {
      traits: { focus: 0.9, technical: 0.8, constructive: 0.9 },
      reactions: [
        "This feedback is really constructive! 👨‍💻",
        "Great catch on that edge case! 🔍",
        "Your code review style is so helpful! ✨"
      ]
    },
    'sprint-planning': {
      traits: { clarity: 0.9, actionable: 0.8, collaborative: 0.9 },
      reactions: [
        "This user story is crystal clear! 📋",
        "Love how actionable this is! ✅",
        "Your team is going to love this clarity! 👥"
      ]
    },
    'linkedin': {
      traits: { professional: 0.9, engaging: 0.8, authentic: 0.7 },
      reactions: [
        "This is going to resonate with your network! 💼",
        "Perfect balance of professional and personal! ✨",
        "Your insights are going to help so many people! 🌟"
      ]
    },
    'social': {
      traits: { authentic: 0.9, playful: 0.7, relatable: 0.8 },
      reactions: [
        "This feels so genuine! ✨",
        "Your personality really shines through! 🌟",
        "This is going to connect with people! 💫"
      ]
    }
  };

  updateContext(context: WritingContext) {
    this.currentContext = context;
  }

  updateWritingPattern(pattern: 'fast' | 'slow' | 'steady' | 'paused') {
    this.userWritingPattern = pattern;
  }

  addToHistory(text: string) {
    this.writingHistory.push(text);
    if (this.writingHistory.length > 10) {
      this.writingHistory.shift();
    }
  }

  // Analyze the current writing for contextual reactions
  analyzeWriting(text: string): EngieReaction | null {
    const now = Date.now();
    const timeSinceLastReaction = now - this.lastReactionTime;
    
    // Don't react too frequently (minimum 30 seconds between reactions)
    if (timeSinceLastReaction < 30000) {
      return null;
    }

    this.addToHistory(text);
    
    // Analyze writing patterns and content
    const analysis = this.analyzeText(text);
    
    // Find appropriate reactions based on analysis
    const possibleReactions = this.contextualReactions.filter(reaction => {
      return this.shouldTriggerReaction(reaction, analysis);
    });

    if (possibleReactions.length === 0) {
      return null;
    }

    // Weight reactions by frequency and context
    const weightedReactions = possibleReactions.map(reaction => ({
      ...reaction,
      weight: this.calculateReactionWeight(reaction, analysis)
    }));

    // Select reaction based on weights
    const selectedReaction = this.selectWeightedReaction(weightedReactions);
    
    if (selectedReaction) {
      this.lastReactionTime = now;
      return selectedReaction;
    }

    return null;
  }

  private analyzeText(text: string) {
    const wordCount = text.split(/\s+/).length;
    // Simple emoji detection - look for common emoji symbols
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
      writingPattern: this.userWritingPattern,
      context: this.currentContext
    };
  }

  private shouldTriggerReaction(reaction: EngieReaction, analysis: any): boolean {
    switch (reaction.trigger) {
      case 'creative_breakthrough':
        return analysis.hasExclamations && analysis.hasPersonalTouch && analysis.wordCount > 30;
      case 'good_structure':
        return analysis.isLongForm && analysis.wordCount > 100;
      case 'writer_block':
        return analysis.writingPattern === 'paused' && analysis.wordCount < 10;
      case 'long_pause':
        return analysis.writingPattern === 'paused' && Date.now() - this.lastReactionTime > 120000; // 2 minutes
      case 'technical_clarity':
        return analysis.hasTechnicalTerms && analysis.wordCount > 20;
      case 'technical_success':
        return analysis.hasTechnicalTerms && analysis.isLongForm;
      case 'professional_tone':
        return analysis.hasProfessionalTerms && !analysis.hasEmojis;
      case 'audience_fit':
        return !!this.currentContext && analysis.wordCount > 30;
      case 'authentic_voice':
        return analysis.hasPersonalTouch && analysis.hasEmojis;
      case 'personal_touch':
        return analysis.hasPersonalTouch && analysis.wordCount > 20;
      case 'writer_struggle':
        return analysis.writingPattern === 'paused' && analysis.wordCount < 5;
      case 'deletion_spree':
        return this.writingHistory.length > 3 && this.writingHistory[this.writingHistory.length - 1].length < this.writingHistory[this.writingHistory.length - 2].length;
      case 'significant_progress':
        return analysis.wordCount > 200 || (analysis.isLongForm && analysis.hasProfessionalTerms);
      case 'writing_flow':
        return analysis.writingPattern === 'fast' && analysis.wordCount > 50;
      default:
        return false;
    }
  }

  private calculateReactionWeight(reaction: EngieReaction, analysis: any): number {
    let weight = 1;

    // Adjust based on frequency
    switch (reaction.frequency) {
      case 'rare':
        weight *= 0.3;
        break;
      case 'occasional':
        weight *= 0.7;
        break;
      case 'common':
        weight *= 1.0;
        break;
    }

    // Adjust based on context fit
    if (this.currentContext && this.contextPersonalities[this.currentContext.type as keyof typeof this.contextPersonalities]) {
      weight *= 1.2;
    }

    // Adjust based on personality traits
    weight *= this.personalityTraits.enthusiasm;

    return weight;
  }

  private selectWeightedReaction(weightedReactions: (EngieReaction & { weight: number })[]): EngieReaction | null {
    if (weightedReactions.length === 0) return null;

    const totalWeight = weightedReactions.reduce((sum, reaction) => sum + reaction.weight, 0);
    let random = Math.random() * totalWeight;

    for (const reaction of weightedReactions) {
      random -= reaction.weight;
      if (random <= 0) {
        return reaction;
      }
    }

    return weightedReactions[0];
  }

  // Get contextual encouragement based on current situation
  getContextualEncouragement(): string {
    const encouragements = [
      "You've got this! Every word you write is progress ✨",
      "Writing is a journey, and you're making great strides! 🚀",
      "Your ideas are worth sharing - let's make them shine! 💫",
      "Sometimes the best writing comes from just getting started! 🌟",
      "You're building something meaningful, one word at a time! 🎯",
      "Your voice matters, and it's coming through beautifully! 🎨",
      "Every writer has moments like this - you're not alone! 🤝",
      "Let's turn those thoughts into something amazing! ✨"
    ];

    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  // Get personality-driven mood for animations
  getCurrentMood(): EngieMood {
    const baseMood: EngieMood = {
      emotion: 'supportive',
      intensity: 'subtle',
      context: 'writing'
    };

    // Adjust based on context
    if (this.currentContext) {
      switch (this.currentContext.type) {
        case 'code-review':
          baseMood.emotion = 'focused';
          baseMood.context = 'polishing';
          break;
        case 'linkedin':
          baseMood.emotion = 'excited';
          baseMood.context = 'writing';
          break;
        case 'social':
          baseMood.emotion = 'playful';
          baseMood.context = 'writing';
          break;
      }
    }

    // Adjust based on writing pattern
    switch (this.userWritingPattern) {
      case 'fast':
        baseMood.emotion = 'excited';
        baseMood.intensity = 'energetic';
        break;
      case 'paused':
        baseMood.emotion = 'encouraging';
        baseMood.context = 'stuck';
        break;
      case 'slow':
        baseMood.emotion = 'thoughtful';
        baseMood.intensity = 'subtle';
        break;
    }

    return baseMood;
  }
} 