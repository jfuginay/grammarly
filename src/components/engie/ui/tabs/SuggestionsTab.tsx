import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Suggestion } from '../../types';

interface SuggestionsTabProps {
  activeSuggestions: Suggestion[];
  currentSuggestion: Suggestion | null;
  currentSuggestionIndex: number;
  onApply: () => void;
  onDismiss: () => void;
  onNext: () => void;
}

// Friendly suggestion type labels
const suggestionTypeLabels: { [key in Suggestion['type']]: string } = {
  Spelling: '✏️ Quick fix',
  Grammar: '📝 Polish', 
  Style: '✨ Style boost',
  Punctuation: '🔤 Punctuation',
  Clarity: '💡 Clarity'
};

// Friendly severity colors and labels
const severityDisplay: { [key in Suggestion['severity']]: { color: string; label: string; emoji: string } } = {
  High: { color: 'bg-coral-500', label: 'Worth fixing', emoji: '👀' },
  Medium: { color: 'bg-amber-500', label: 'Nice to have', emoji: '✨' },
  Low: { color: 'bg-sage-500', label: 'Optional', emoji: '💫' },
};

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({
  activeSuggestions,
  currentSuggestion,
  currentSuggestionIndex,
  onApply,
  onDismiss,
  onNext,
}) => {
  if (!currentSuggestion) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-sm font-medium text-foreground mb-1">
          Looking fantastic!
        </p>
        <p className="text-xs text-muted-foreground">
          Your writing is in great shape - no suggestions needed.
        </p>
      </div>
    );
  }

  const remainingCount = activeSuggestions.length - currentSuggestionIndex;
  const isLastSuggestion = currentSuggestionIndex === activeSuggestions.length - 1;
  const severity = severityDisplay[currentSuggestion.severity];

  return (
    <div className="mt-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">
          {remainingCount === 1 ? (
            "Last suggestion! 🏁"
          ) : (
            `${remainingCount} suggestions found`
          )}
        </p>
        {activeSuggestions.length > 1 && (
          <div className="text-xs text-muted-foreground">
            {currentSuggestionIndex + 1} of {activeSuggestions.length}
          </div>
        )}
      </div>

      {/* Suggestion card */}
      <Card key={currentSuggestion.id} className="premium-suggestion-card">
        <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
          <span className="text-lg">{severity.emoji}</span>
          <div className="flex-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {suggestionTypeLabels[currentSuggestion.type]}
              <Badge variant="outline" className="font-normal text-xs text-muted-foreground">
                {severity.label}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          {/* Before/After */}
          <div className="space-y-2 mb-3">
            <div className="text-xs text-muted-foreground font-medium">Before:</div>
            <p className="text-sm bg-muted/50 rounded-md p-2 line-through text-muted-foreground">
              &quot;{currentSuggestion.original}&quot;
            </p>
            
            <div className="text-xs text-muted-foreground font-medium">Engie suggests:</div>
            <p className="text-sm bg-primary/10 rounded-md p-2 font-medium text-primary">
              &quot;{currentSuggestion.suggestion}&quot;
            </p>
          </div>

          {/* Friendly explanation */}
          <div className="bg-accent/30 rounded-md p-3 border-l-2 border-primary/30">
            <p className="text-xs text-foreground leading-relaxed">
              {currentSuggestion.explanation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-between items-center gap-3 mt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="premium-hover-lift text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          Skip this one
        </Button>
        
        <div className="flex gap-2">
          {!isLastSuggestion && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNext}
              className="premium-hover-lift premium-focus transition-all duration-200 hover:border-primary/30"
            >
              Next →
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={onApply}
            className="premium-hover-lift bg-gradient-to-r from-engie-primary to-primary text-white shadow-lg shadow-engie-primary/20 hover:shadow-engie-primary/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-500 hover:before:translate-x-[100%]"
          >
            <span className="relative z-10 flex items-center gap-1">
              <span className="premium-emoji">✨</span>
              Apply it
            </span>
          </Button>
        </div>
      </div>
      
      {/* Encouraging footer message */}
      {isLastSuggestion && (
        <div className="text-center mt-4 p-3 bg-accent/20 rounded-md">
          <p className="text-xs text-muted-foreground">
            🎯 Almost done! Apply this and you'll be all set.
          </p>
        </div>
      )}
    </div>
  );
}; 