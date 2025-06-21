/**
 * ContextualMessageService - Generates friendly, context-aware messages for Engie
 * 
 * This service analyzes the user's writing context and provides appropriate
 * messaging that feels natural and supportive, like advice from a friend.
 */

export interface WritingContext {
  platform: 'social' | 'professional' | 'casual' | 'unknown';
  tone: 'formal' | 'casual' | 'friendly' | 'energetic' | 'unknown';
  length: 'short' | 'medium' | 'long';
  hasEmojis: boolean;
  hasHashtags: boolean;
  hasMentions: boolean;
}

export class ContextualMessageService {
  
  /**
   * Analyzes text to determine writing context
   */
  detectContext(text: string): WritingContext {
    const words = text.split(/\s+/).length;
    const hasEmojis = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u27BF]/.test(text);
    const hasHashtags = /#\w+/.test(text);
    const hasMentions = /@\w+/.test(text);
    
    // Determine platform based on content patterns
    let platform: WritingContext['platform'] = 'unknown';
    if (hasHashtags || hasMentions || (hasEmojis && words < 50)) {
      platform = 'social';
    } else if (text.includes('Dear ') || text.includes('Sincerely') || text.includes('Best regards') || 
               text.includes('meeting') || text.includes('deadline') || text.includes('project')) {
      platform = 'professional';
    } else if (hasEmojis || text.includes('lol') || text.includes('btw') || text.includes('omg')) {
      platform = 'casual';
    }
    
    // Determine tone
    let tone: WritingContext['tone'] = 'unknown';
    if (text.includes('!') && hasEmojis) {
      tone = 'energetic';
    } else if (platform === 'social' || hasEmojis) {
      tone = 'casual';
    } else if (platform === 'professional') {
      tone = 'formal';
    } else if (text.includes('thanks') || text.includes('please') || text.includes('hope')) {
      tone = 'friendly';
    }
    
    // Determine length
    let length: WritingContext['length'] = 'short';
    if (words > 100) length = 'long';
    else if (words > 30) length = 'medium';
    
    return {
      platform,
      tone,
      length,
      hasEmojis,
      hasHashtags,
      hasMentions
    };
  }
  
  /**
   * Gets contextual greeting message when suggestions are found
   */
  getSuggestionFoundMessage(context: WritingContext, suggestionCount: number): string {
    const platform = context.platform;
    const count = suggestionCount;
    
    if (platform === 'social') {
      if (count === 1) {
        return '📱 Found one little tweak to make this post even better!';
      } else {
        return `📱 Found ${count} ways to make this post absolutely shine! ✨`;
      }
    }
    
    if (platform === 'professional') {
      if (count === 1) {
        return '💼 Spotted one small polish for extra professionalism!';
      } else {
        return `💼 Found ${count} refinements to boost your professional impact!`;
      }
    }
    
    if (platform === 'casual') {
      if (count === 1) {
        return '😊 Just one tiny suggestion to perfect this!';
      } else {
        return `😊 Got ${count} friendly suggestions to polish this up!`;
      }
    }
    
    // Default/unknown context
    if (count === 1) {
      return '👀 Found one quick improvement for you!';
    } else {
      return `👀 Found ${count} ways to polish your writing!`;
    }
  }
  
  /**
   * Gets contextual no-suggestions message
   */
  getNoSuggestionsMessage(context: WritingContext): string {
    const platform = context.platform;
    
    if (platform === 'social') {
      return '🔥 This post is ready to go viral - no changes needed!';
    }
    
    if (platform === 'professional') {
      return '👔 Looks perfectly professional - you\'re good to send!';
    }
    
    if (platform === 'casual') {
      return '😄 This reads great - your personality really comes through!';
    }
    
    return '✨ Your writing looks fantastic - no suggestions needed!';
  }
  
  /**
   * Gets contextual completion message
   */
  getCompletionMessage(context: WritingContext): string {
    const platform = context.platform;
    
    if (platform === 'social') {
      return '🎉 Perfect! This post is going to get great engagement!';
    }
    
    if (platform === 'professional') {
      return '💪 Excellent! This communicates clearly and professionally.';
    }
    
    if (platform === 'casual') {
      return '🌟 Nice! This has just the right friendly tone.';
    }
    
    return '🎯 All done! Your writing is polished and ready.';
  }
  
  /**
   * Gets contextual encouragement during editing
   */
  getEncouragementMessage(context: WritingContext, progressRatio: number): string {
    const platform = context.platform;
    
    if (progressRatio >= 0.8) {
      if (platform === 'social') {
        return '🚀 Almost there - this post is going to be amazing!';
      } else if (platform === 'professional') {
        return '📈 Nearly perfect - great attention to detail!';
      } else {
        return '🏁 You\'re crushing it - almost finished!';
      }
    }
    
    if (progressRatio >= 0.5) {
      if (platform === 'social') {
        return '💪 Great progress - this is going to pop!';
      } else if (platform === 'professional') {
        return '⭐ Nice work - really sharpening this up!';
      } else {
        return '👍 You\'re doing great - keep it up!';
      }
    }
    
    if (platform === 'social') {
      return '✨ Love the energy - let\'s make this even better!';
    } else if (platform === 'professional') {
      return '🎯 Good start - let\'s refine this together!';
    } else {
      return '🌟 Nice beginning - we\'ll get this polished!';
    }
  }
  
  /**
   * Gets platform-specific suggestion prefixes
   */
  getSuggestionPrefix(context: WritingContext, suggestionType: string): string {
    const platform = context.platform;
    
    if (platform === 'social') {
      if (suggestionType === 'Style') {
        return 'For more engagement, try: ';
      } else if (suggestionType === 'Spelling') {
        return 'Quick typo fix: ';
      } else {
        return 'To make this pop even more: ';
      }
    }
    
    if (platform === 'professional') {
      if (suggestionType === 'Style') {
        return 'For extra polish: ';
      } else if (suggestionType === 'Clarity') {
        return 'To clarify: ';
      } else {
        return 'Professional touch: ';
      }
    }
    
    return 'Here\'s a thought: ';
  }
}

export const contextualMessageService = new ContextualMessageService(); 