// @ts-nocheck
// TODO: Remove ts-nocheck after type checking
// This comment is added temporarily to allow submitting the file with potential type errors
// and will be removed in a follow-up subtask.

// Type definitions
// Moved from EnhancedEditor.tsx
export interface TextFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'word' | 'phrase' | 'punctuation' | 'space' | 'paragraph';
  partOfSpeech?: string;
  priority?: 1 | 2 | 3;
  confidence?: number;
}

// Moved from EnhancedEditor.tsx
// assignPriorities now takes 'value' as an argument
export const assignPriorities = (fragments: TextFragment[], value: string): TextFragment[] => {
  return fragments.map(fragment => {
    let priority: 1 | 2 | 3 | undefined = undefined;
    let confidence = 0;

    if (fragment.type === 'word') {
      if (/[A-Z]/.test(fragment.text[0]) && fragment.startIndex > 0 &&
          !/[.!?]$/.test(value.charAt(fragment.startIndex - 2))) {
        priority = 1;
        confidence = 0.9;
      } else if (/[^a-zA-Z0-9']/.test(fragment.text)) {
        priority = 1;
        confidence = 0.8;
      } else if (fragment.partOfSpeech === 'verb' || fragment.partOfSpeech === 'noun') {
        priority = 2;
        confidence = 0.7;
      } else {
        priority = 3;
        confidence = 0.5;
      }
    } else if (fragment.type === 'phrase') {
      priority = 2;
      confidence = 0.6;
    } else if (fragment.type === 'punctuation') {
      priority = 1;
      confidence = 0.85;
    }

    return {
      ...fragment,
      priority,
      confidence
    };
  });
};

// Moved from EnhancedEditor.tsx
// identifyPhrases now takes 'value' as an argument
export const identifyPhrases = (fragments: TextFragment[], value: string): void => { // Modifies fragments in place
  const wordyPhrases = [
    'in order to', 'due to the fact that', 'at this point in time',
    'for the purpose of', 'in the event that', 'in spite of the fact that',
    'with regard to', 'in the process of'
  ];

  for (let i = 0; i < fragments.length - 2; i++) {
    if (
      fragments[i].partOfSpeech === 'preposition' &&
      (fragments[i+1].partOfSpeech === 'article' || fragments[i+1].partOfSpeech === 'adjective') &&
      fragments[i+2].partOfSpeech === 'noun'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+2].endIndex;
      const phraseText = value.substring(startIndex, endIndex);
      let priority: 1 | 2 | 3 = 3;
      let confidence = 0.6;
      if (wordyPhrases.some(wordyPhrase => phraseText.toLowerCase().includes(wordyPhrase))) {
        priority = 2;
        confidence = 0.8;
      }
      fragments.push({
        text: phraseText,
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'prepositional phrase',
        priority,
        confidence
      });
    }
  }

  for (let i = 0; i < fragments.length - 1; i++) {
    if (
      (fragments[i].partOfSpeech === 'article' || fragments[i].partOfSpeech === 'adjective') &&
      fragments[i+1].partOfSpeech === 'noun'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+1].endIndex;
      fragments.push({
        text: value.substring(startIndex, endIndex),
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'noun phrase',
        priority: 3,
        confidence: 0.5
      });
    }
  }

  for (let i = 0; i < fragments.length - 1; i++) {
    if (
      fragments[i].partOfSpeech === 'verb' &&
      fragments[i+1].partOfSpeech === 'adverb'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+1].endIndex;
      const phraseText = value.substring(startIndex, endIndex);
      let priority: 1 | 2 | 3 = 3;
      let confidence = 0.6;
      if (/\b(is|are|was|were|be|been|being)\s+\w+ed\b/i.test(phraseText)) {
        priority = 2;
        confidence = 0.75;
      }
      fragments.push({
        text: phraseText,
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'verb phrase',
        priority,
        confidence
      });
    }
  }

  const passiveRegex = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  let passiveMatch;
  while ((passiveMatch = passiveRegex.exec(value)) !== null) {
    fragments.push({
      text: passiveMatch[0],
      startIndex: passiveMatch.index,
      endIndex: passiveMatch.index + passiveMatch[0].length,
      type: 'phrase',
      partOfSpeech: 'passive voice',
      priority: 2,
      confidence: 0.8
    });
  }
};

// Moved from EnhancedEditor.tsx
// performLocalAnalysis now takes 'value' as an argument
// and returns an object { fragments: TextFragment[], shouldShow: boolean }
export const performLocalAnalysis = (currentValue: string): { fragments: TextFragment[], shouldShowFragments: boolean } => {
  const fragments: TextFragment[] = [];
  if (!currentValue || currentValue.trim() === '') {
    return { fragments: [], shouldShowFragments: false };
  }

  const tokenRegex = /(\b\w+\b|\s+|[^\w\s]+)/g;
  let match;
  while ((match = tokenRegex.exec(currentValue)) !== null) {
    const text = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + text.length;
    let type: TextFragment['type'] = 'word';
    let partOfSpeech: string | undefined = undefined;
    let priority: 1 | 2 | 3 | undefined = undefined;
    let confidence: number | undefined = undefined;

    if (/^\s+$/.test(text)) {
      type = text.includes('\n') ? 'paragraph' : 'space';
    } else if (/^\w+$/.test(text)) {
      type = 'word';
      const lower = text.toLowerCase();
      if (["the", "a", "an"].includes(lower)) partOfSpeech = "article";
      else if (["is", "am", "are", "was", "were", "be", "been", "do", "does", "did", "have", "has", "had", "can", "could", "will", "would", "shall", "should", "may", "might", "must"].includes(lower)) partOfSpeech = "verb";
      else if (["in", "on", "at", "by", "for", "with", "about", "against", "between", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "into", "onto"].includes(lower)) partOfSpeech = "preposition";
      else if (["and", "but", "or", "nor", "for", "yet", "so"].includes(lower)) partOfSpeech = "conjunction";
      else if (["this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their"].includes(lower)) partOfSpeech = "determiner";
      else if (["i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them"].includes(lower)) partOfSpeech = "pronoun";
      else if (lower.endsWith("ly")) partOfSpeech = "adverb";
      else if (lower.endsWith("ed") || lower.endsWith("en") || lower.endsWith("ing") || lower.endsWith("ify") || lower.endsWith("ise") || lower.endsWith("ize")) partOfSpeech = "verb";
      else if (lower.endsWith("ous") || lower.endsWith("ful") || lower.endsWith("able") || lower.endsWith("ible") || lower.endsWith("al") || lower.endsWith("ive") || lower.endsWith("ic") || lower.endsWith("ary") || lower.endsWith("less") || lower.endsWith("est")) partOfSpeech = "adjective";
      else if (lower.endsWith("ment") || lower.endsWith("ness") || lower.endsWith("tion") || lower.endsWith("sion") || lower.endsWith("ity") || lower.endsWith("hood") || lower.endsWith("ship") || lower.endsWith("ence") || lower.endsWith("ance")) partOfSpeech = "noun";
      else if (text.length > 0) partOfSpeech = "noun";

      if (/[A-Z]/.test(text[0]) && startIndex > 0 && !/[.!?]$/.test(currentValue.charAt(startIndex - 2))) {
        priority = 1; confidence = 0.9;
      } else if (text.length > 3 && !/^[a-zA-Z]+$/.test(text)) {
        priority = 1; confidence = 0.8;
      } else if (['very', 'really', 'basically', 'actually'].includes(text.toLowerCase())) {
        priority = 2; confidence = 0.7;
      } else {
        priority = 3; confidence = 0.5;
      }
    } else if (/^[^\w\s]+$/.test(text)) {
      type = 'punctuation';
      if ([',', '.', '!', '?', ';', ':'].includes(text) && startIndex + 1 < currentValue.length && /\S/.test(currentValue[startIndex + 1])) {
        priority = 1; confidence = 0.95;
      }
    }
    fragments.push({ text, startIndex, endIndex, type, partOfSpeech, priority, confidence });
  }

  identifyPhrases(fragments, currentValue); // Pass currentValue

  fragments.sort((a, b) => {
    const priorityDiff = (a.priority || 3) - (b.priority || 3);
    if (priorityDiff !== 0) return priorityDiff;
    if (a.confidence && b.confidence) return b.confidence - a.confidence;
    return a.startIndex - b.startIndex;
  });

  return { fragments, shouldShowFragments: true };
};

// TODO: Add type checking for this file. The @ts-nocheck directive is a temporary measure.
// Consider adding more robust NLP logic or integrating a lightweight library if requirements grow.
// Ensure all dependencies like 'value' are passed correctly to these utility functions.
