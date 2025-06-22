import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Linkedin, 
  Instagram, 
  MessageSquare, 
  FileText,
  Sparkles,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import AnimatedEngieBot from '../../AnimatedEngieBot';

interface WritingContext {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  tone: 'professional' | 'casual' | 'technical' | 'social';
  color: string;
}

const TECH_CONTEXTS: WritingContext[] = [
  {
    id: 'code-review',
    label: 'Code Review',
    icon: <Code className="w-4 h-4" />,
    description: 'Technical feedback and documentation',
    examples: ['PR comments', 'Code documentation', 'Technical specs'],
    tone: 'technical',
    color: 'bg-blue-500'
  },
  {
    id: 'sprint-planning',
    label: 'Sprint Planning',
    icon: <FileText className="w-4 h-4" />,
    description: 'Team planning and project management',
    examples: ['User stories', 'Sprint notes', 'Task descriptions'],
    tone: 'professional',
    color: 'bg-green-500'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    description: 'Professional networking content',
    examples: ['Career updates', 'Industry insights', 'Technical posts'],
    tone: 'professional',
    color: 'bg-blue-600'
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: <Instagram className="w-4 h-4" />,
    description: 'Instagram, Threads, casual posts',
    examples: ['Personal updates', 'Quick thoughts', 'Behind-the-scenes'],
    tone: 'social',
    color: 'bg-pink-500'
  },
  {
    id: 'docs',
    label: 'Documentation',
    icon: <FileText className="w-4 h-4" />,
    description: 'Google Docs, technical writing',
    examples: ['Team docs', 'Proposals', 'Meeting notes'],
    tone: 'professional',
    color: 'bg-orange-500'
  },
  {
    id: 'chat',
    label: 'Team Chat',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Slack, Discord, team communication',
    examples: ['Quick updates', 'Casual discussion', 'Team coordination'],
    tone: 'casual',
    color: 'bg-purple-500'
  }
];

interface ContextSwitcherProps {
  currentContext: string;
  onContextChange: (context: string) => void;
  isVisible: boolean;
  className?: string;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  currentContext,
  onContextChange,
  isVisible,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEngieReaction, setShowEngieReaction] = useState(false);

  const activeContext = TECH_CONTEXTS.find(ctx => ctx.id === currentContext) || TECH_CONTEXTS[0];

  const handleContextSwitch = (newContextId: string) => {
    onContextChange(newContextId);
    setIsExpanded(false);
    
    // Show Engie's cute reaction
    setShowEngieReaction(true);
    setTimeout(() => setShowEngieReaction(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-40 ${className}`}>
      {/* Engie's Context Reaction */}
      {showEngieReaction && (
        <div className="absolute -top-16 -left-16 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative">
            <div className="w-12 h-12 mb-2">
              <AnimatedEngieBot 
                animationState="idle"
                speed="normal"
                direction="right"
                emotion="excited"
              />
            </div>
            <div className="absolute -top-8 -right-4 bg-white dark:bg-gray-800 border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap animate-in fade-in zoom-in-50 duration-200 delay-100">
              <div className="text-xs font-medium text-engie-primary">
                ✨ Switched to {activeContext.label} mode!
              </div>
              <div className="absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-gray-700"></div>
            </div>
          </div>
        </div>
      )}

      {/* Context Switcher */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Current Context Display */}
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${activeContext.color}`} />
            <div className="flex items-center gap-2">
              {activeContext.icon}
              <span className="font-medium text-sm">{activeContext.label}</span>
            </div>
          </div>
          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>

        {/* Expanded Context Options */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
              {TECH_CONTEXTS.map((context) => (
                <button
                  key={context.id}
                  onClick={() => handleContextSwitch(context.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] ${
                    context.id === currentContext 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full ${context.color} mt-1 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {context.icon}
                        <span className="font-medium text-sm">{context.label}</span>
                        {context.id === currentContext && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {context.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {context.examples.slice(0, 2).map((example, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Quick Help */}
            <div className="p-3 bg-gradient-to-r from-engie-primary/10 to-primary/10 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-engie-primary" />
                <span className="text-xs font-medium text-engie-primary">
                  Engie adapts suggestions to your context
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextSwitcher; 