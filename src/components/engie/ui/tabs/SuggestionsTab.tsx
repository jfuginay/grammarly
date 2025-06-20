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

const severityColorMap: { [key in Suggestion['severity']]: string } = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
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
      <div className="text-center py-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Looking good! No suggestions found.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
        Found {activeSuggestions.length - currentSuggestionIndex} suggestion(s):
      </p>
      <Card key={currentSuggestion.id}>
        <CardHeader className="flex flex-row items-center gap-2 p-3">
          <span className={`h-2.5 w-2.5 rounded-full ${severityColorMap[currentSuggestion.severity]}`}></span>
          <CardTitle className="text-sm font-semibold">{currentSuggestion.type}</CardTitle>
          <Badge variant="outline" className="font-normal text-xs">{currentSuggestion.severity}</Badge>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
            &quot;{currentSuggestion.original}&quot;
          </p>
          <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
            &quot;{currentSuggestion.suggestion}&quot;
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {currentSuggestion.explanation}
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" size="sm" onClick={onNext}>
          {currentSuggestionIndex < activeSuggestions.length - 1 ? 'Next' : 'Ignore'}
        </Button>
        <Button variant="default" size="sm" onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}; 