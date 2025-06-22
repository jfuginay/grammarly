import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageCircle, Heart, Zap, Coffee, Lightbulb } from 'lucide-react';
import AnimatedEngieBot from '../../AnimatedEngieBot';
import { EngiePersonalityEngine, EngieMood, WritingContext } from '../core/EngiePersonalityEngine';

interface EngieCompanionProps {
  currentText: string;
  writingContext: WritingContext;
  isVisible: boolean;
  onReaction?: (message: string) => void;
  className?: string;
}

export const EngieCompanion: React.FC<EngieCompanionProps> = ({
  currentText,
  writingContext,
  isVisible,
  onReaction,
  className = ''
}) => {
  const [personalityEngine] = useState(() => new EngiePersonalityEngine());
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<EngieMood>({
    emotion: 'supportive',
    intensity: 'subtle',
    context: 'writing'
  });
  const [showReaction, setShowReaction] = useState(false);
  const [writingPattern, setWritingPattern] = useState<'fast' | 'slow' | 'steady' | 'paused'>('steady');
  const lastTextLength = useRef(0);
  const lastTextTime = useRef(Date.now());
  const reactionTimeoutRef = useRef<NodeJS.Timeout>();

  // Update context when it changes
  useEffect(() => {
    personalityEngine.updateContext(writingContext);
  }, [writingContext, personalityEngine]);

  // Analyze writing patterns
  useEffect(() => {
    const now = Date.now();
    const timeDiff = now - lastTextTime.current;
    const lengthDiff = currentText.length - lastTextLength.current;

    // Determine writing pattern
    if (lengthDiff > 0) {
      if (timeDiff < 1000 && lengthDiff > 10) {
        setWritingPattern('fast');
      } else if (timeDiff > 5000) {
        setWritingPattern('slow');
      } else {
        setWritingPattern('steady');
      }
      lastTextTime.current = now;
    } else if (timeDiff > 10000) {
      setWritingPattern('paused');
    }

    lastTextLength.current = currentText.length;
    personalityEngine.updateWritingPattern(writingPattern);
  }, [currentText, personalityEngine, writingPattern]);

  // Analyze text for reactions
  useEffect(() => {
    if (!currentText.trim() || !isVisible) return;

    const reaction = personalityEngine.analyzeWriting(currentText);
    
    if (reaction) {
      setCurrentReaction(reaction.message);
      setCurrentMood(reaction.mood);
      setShowReaction(true);
      
      // Clear any existing timeout
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }

      // Hide reaction after 4 seconds
      reactionTimeoutRef.current = setTimeout(() => {
        setShowReaction(false);
        setCurrentReaction(null);
      }, 4000);

      // Notify parent component
      if (onReaction) {
        onReaction(reaction.message);
      }
    }
  }, [currentText, isVisible, personalityEngine, onReaction]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }
    };
  }, []);

  // Get animation state based on mood
  const getAnimationState = () => {
    switch (currentMood.emotion) {
      case 'excited':
        return 'excited';
      case 'focused':
        return 'thinking';
      case 'encouraging':
        return 'encouraging';
      case 'thoughtful':
        return 'thinking';
      case 'playful':
        return 'playful';
      case 'supportive':
        return 'idle';
      case 'curious':
        return 'curious';
      case 'proud':
        return 'proud';
      default:
        return 'idle';
    }
  };

  // Get animation speed based on intensity
  const getAnimationSpeed = () => {
    switch (currentMood.intensity) {
      case 'subtle':
        return 'slow';
      case 'moderate':
        return 'normal';
      case 'energetic':
        return 'fast';
      default:
        return 'normal';
    }
  };

  // Get contextual icon based on mood and context
  const getContextualIcon = () => {
    switch (currentMood.context) {
      case 'breakthrough':
        return <Sparkles className="w-4 h-4" />;
      case 'stuck':
        return <Lightbulb className="w-4 h-4" />;
      case 'polishing':
        return <Zap className="w-4 h-4" />;
      case 'starting':
        return <Coffee className="w-4 h-4" />;
      case 'finishing':
        return <Heart className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {/* Engie's Reaction Bubble */}
        {showReaction && currentReaction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-20 right-0 mb-2"
          >
            <Card className="max-w-xs bg-gradient-to-r from-engie-primary/10 to-primary/10 border-engie-primary/20 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  {getContextualIcon()}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-engie-primary">
                      {currentReaction}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {currentMood.emotion}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {currentMood.context}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engie Character */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <div className="w-16 h-16">
          <AnimatedEngieBot 
            animationState={getAnimationState()}
            speed={getAnimationSpeed()}
            direction="right"
            emotion={currentMood.emotion}
          />
        </div>

        {/* Writing Pattern Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
        >
          <div 
            className={`w-full h-full rounded-full ${
              writingPattern === 'fast' ? 'bg-green-500 animate-pulse' :
              writingPattern === 'slow' ? 'bg-yellow-500' :
              writingPattern === 'paused' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
          />
        </motion.div>
      </motion.div>

      {/* Context Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-center"
      >
        <Badge variant="outline" className="text-xs">
          {writingContext.type.replace('-', ' ')}
        </Badge>
      </motion.div>
    </div>
  );
};

export default EngieCompanion; 