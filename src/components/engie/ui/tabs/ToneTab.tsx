import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToneAnalysis } from '../../types';

interface ToneTabProps {
  toneAnalysisResult: ToneAnalysis | null;
  overallPageToneAnalysis: ToneAnalysis | null;
  formatScore: (score: number | undefined | null) => string;
}

export const ToneTab: React.FC<ToneTabProps> = ({
  toneAnalysisResult,
  overallPageToneAnalysis,
  formatScore,
}) => {
  if (!toneAnalysisResult && !overallPageToneAnalysis) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          No tone analysis available.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {toneAnalysisResult && (
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-base">
              Editable Content Analysis
            </CardTitle>
            <CardDescription className="text-xs">
              Overall Tone:{' '}
              <Badge 
                variant={
                  toneAnalysisResult.overallTone === 'Negative' 
                    ? 'destructive' 
                    : toneAnalysisResult.overallTone === 'Positive' 
                    ? 'default' 
                    : 'secondary'
                } 
                className="capitalize"
              >
                {toneAnalysisResult.overallTone} (Score: {formatScore(toneAnalysisResult.overallScore)})
              </Badge>
            </CardDescription>
          </CardHeader>
          {toneAnalysisResult.highlightedSentences && toneAnalysisResult.highlightedSentences.length > 0 && (
            <CardContent className="p-3 pt-0">
              <p className="text-xs text-muted-foreground mb-1">Key Sentences:</p>
              <ul className="space-y-1">
                {toneAnalysisResult.highlightedSentences.slice(0, 3).map((item, index) => (
                  <li key={index} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                    &quot;{item.sentence}&quot; - <span className="font-medium capitalize">{item.tone}</span> (Score: {formatScore(item.score)})
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
          <CardFooter className="p-3 pt-2">
            <p className="text-xs text-muted-foreground">Analysis of the editable content area.</p>
          </CardFooter>
        </Card>
      )}
      
      {overallPageToneAnalysis && (
        <Card className="border-dashed border-sky-300 dark:border-sky-700">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium text-sky-600 dark:text-sky-400">
              Overall Page Tone
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xs">
              General tone of the page:{' '}
              <Badge 
                variant={
                  overallPageToneAnalysis.overallTone === 'Negative' 
                    ? 'destructive' 
                    : overallPageToneAnalysis.overallTone === 'Positive' 
                    ? 'default' 
                    : 'secondary'
                } 
                className="capitalize text-xs px-1.5 py-0.5"
              >
                {overallPageToneAnalysis.overallTone}
                {typeof overallPageToneAnalysis.overallScore === 'number' && 
                 ` (${formatScore(overallPageToneAnalysis.overallScore)})`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 