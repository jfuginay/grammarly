import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, X } from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'spelling' | 'grammar' | 'style';
  text: string;
  replacement: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
  severity: 'error' | 'warning' | 'suggestion';
}

interface FloatingSuggestionProps {
  suggestion: Suggestion | null;
  position: { x: number; y: number } | null;
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function FloatingSuggestion({
  suggestion,
  position,
  onApply,
  onDismiss,
  onClose,
  onMouseEnter,
  onMouseLeave
}: FloatingSuggestionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (suggestion && position) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [suggestion, position]);

  if (!suggestion || !position) return null;

  // Smart positioning to keep the suggestion in viewport
  const getSmartPosition = () => {
    const cardWidth = 320;
    const cardHeight = 200; // Approximate height
    const padding = 10;
    
    let { x, y } = position;
    
    // Adjust horizontal position if it would go off-screen
    if (x + cardWidth > window.innerWidth) {
      x = window.innerWidth - cardWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }
    
    // Adjust vertical position if it would go off-screen
    if (y - cardHeight < padding) {
      y = y + cardHeight + 20; // Show below instead of above
    } else {
      y = y - 10; // Show above with small offset
    }
    
    return { x, y };
  };

  const smartPosition = getSmartPosition();

  const getSuggestionIcon = (type: string, severity: string) => {
    if (severity === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  };

  const getSuggestionBadgeVariant = (severity: string) => {
    if (severity === 'error') return 'destructive';
    if (severity === 'warning') return 'secondary';
    return 'default';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: smartPosition.x,
            top: smartPosition.y,
            transform: smartPosition.y > position.y ? 'translateY(0)' : 'translateY(-100%)'
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <Card className="w-80 border-2 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getSuggestionIcon(suggestion.type, suggestion.severity)}
                  <Badge variant={getSuggestionBadgeVariant(suggestion.severity)} className="text-xs">
                    {suggestion.type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Current:</div>
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                    "{suggestion.text}"
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Suggestion:</div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    "{suggestion.replacement}"
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {suggestion.explanation}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => onApply(suggestion)}
                    className="flex-1 h-8 text-xs"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDismiss(suggestion.id)}
                    className="flex-1 h-8 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Arrow pointing down */}
          <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}