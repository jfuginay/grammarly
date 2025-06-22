import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Users, 
  Briefcase, 
  Code,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import AnimatedEngieBot from '../../AnimatedEngieBot';
import { Suggestion } from '../../types';

interface BatchAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  count: number;
  examples: string[];
  context: 'technical' | 'professional' | 'social' | 'all';
}

interface SmartBatchActionsProps {
  suggestions: Suggestion[];
  context: string;
  onBatchApply: (actionId: string) => void;
  isProcessing: boolean;
}

export const SmartBatchActions: React.FC<SmartBatchActionsProps> = ({
  suggestions,
  context,
  onBatchApply,
  isProcessing
}) => {
  const [showEngieReaction, setShowEngieReaction] = useState(false);

  // Smart categorization based on context
  const getBatchActions = (): BatchAction[] => {
    const grammarCount = suggestions.filter(s => s.type === 'Grammar').length;
    const styleCount = suggestions.filter(s => s.type === 'Style').length;
    const clarityCount = suggestions.filter(s => s.type === 'Clarity').length;
    const spellingCount = suggestions.filter(s => s.type === 'Spelling').length;

    const actions: BatchAction[] = [];

    // Context-specific batch actions for tech professionals
    if (context === 'code-review' || context === 'sprint-planning') {
      if (clarityCount > 0) {
        actions.push({
          id: 'technical-clarity',
          label: 'Technical Clarity',
          icon: <Code className="w-4 h-4" />,
          description: 'Make technical explanations clearer',
          color: 'bg-blue-500',
          count: clarityCount,
          examples: ['Simplify jargon', 'Add context', 'Clarify steps'],
          context: 'technical'
        });
      }
      
      if (styleCount > 0) {
        actions.push({
          id: 'professional-tone',
          label: 'Professional Tone',
          icon: <Briefcase className="w-4 h-4" />,
          description: 'Polish for team communication',
          color: 'bg-green-500',
          count: styleCount,
          examples: ['Collaborative language', 'Clear structure', 'Actionable'],
          context: 'professional'
        });
      }
    }

    if (context === 'linkedin' || context === 'docs') {
      if (styleCount > 0) {
        actions.push({
          id: 'engagement-boost',
          label: 'Engagement Boost',
          icon: <Users className="w-4 h-4" />,
          description: 'More engaging for your audience',
          color: 'bg-purple-500',
          count: styleCount,
          examples: ['Active voice', 'Compelling hooks', 'Clear value'],
          context: 'professional'
        });
      }
    }

    if (context === 'social' || context === 'chat') {
      if (styleCount > 0) {
        actions.push({
          id: 'casual-friendly',
          label: 'Casual & Friendly',
          icon: <MessageSquare className="w-4 h-4" />,
          description: 'Natural, conversational tone',
          color: 'bg-pink-500',
          count: styleCount,
          examples: ['Conversational', 'Approachable', 'Authentic'],
          context: 'social'
        });
      }
    }

    // Universal quick fixes
    if (grammarCount + spellingCount > 0) {
      actions.push({
        id: 'quick-fixes',
        label: 'Quick Fixes',
        icon: <Zap className="w-4 h-4" />,
        description: 'Grammar & spelling corrections',
        color: 'bg-amber-500',
        count: grammarCount + spellingCount,
        examples: ['Fix typos', 'Correct grammar', 'Polish punctuation'],
        context: 'all'
      });
    }

    return actions;
  };

  const batchActions = getBatchActions();

  const handleBatchAction = (actionId: string) => {
    onBatchApply(actionId);
    setShowEngieReaction(true);
    setTimeout(() => setShowEngieReaction(false), 3000);
  };

  if (batchActions.length === 0) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <AnimatedEngieBot 
              animationState="idle"
              speed="slow"
              direction="center"
              emotion="happy"
            />
          </div>
          <h3 className="font-semibold text-lg mb-2">Looking great! 🎉</h3>
          <p className="text-muted-foreground text-sm">
            Your writing is in excellent shape - no batch improvements needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Engie's Batch Reaction */}
      {showEngieReaction && (
        <Card className="border-engie-primary/20 bg-gradient-to-r from-engie-primary/5 to-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10">
                <AnimatedEngieBot 
                  animationState="thinking"
                  speed="fast"
                  direction="right"
                  emotion="excited"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-engie-primary">
                  ✨ Engie is applying your batch improvements!
                </p>
                <p className="text-xs text-muted-foreground">
                  Smart suggestions tailored for {context === 'code-review' ? 'code reviews' : context === 'linkedin' ? 'LinkedIn' : 'your context'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Actions Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8">
          <AnimatedEngieBot 
            animationState="idle"
            speed="normal"
            direction="right"
            emotion="friendly"
          />
        </div>
        <div>
          <h3 className="font-semibold text-base">Smart Batch Actions</h3>
          <p className="text-xs text-muted-foreground">
            Apply improvements in one click - Engie&apos;s got this! 
          </p>
        </div>
      </div>

      {/* Batch Action Cards */}
      <div className="grid gap-3">
        {batchActions.map((action) => (
          <Card key={action.id} className="premium-hover-lift transition-all duration-200 hover:shadow-lg group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${action.color} mt-2 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {action.icon}
                      <h4 className="font-medium text-sm">{action.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {action.count} {action.count === 1 ? 'fix' : 'fixes'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {action.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {action.examples.slice(0, 3).map((example, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleBatchAction(action.id)}
                  disabled={isProcessing}
                  className="ml-3 premium-hover-lift bg-gradient-to-r from-engie-primary to-primary text-white shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span className="text-xs">Working...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">Apply</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-accent/50 to-primary/10">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-engie-primary" />
              <span className="font-medium">
                {suggestions.length} total suggestions • Contextually smart for {context === 'code-review' ? 'tech reviews' : context === 'linkedin' ? 'professional posts' : 'your writing'}
              </span>
            </div>
            <div className="text-muted-foreground">
              Save time with batch actions
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 