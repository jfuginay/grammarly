import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { X, Sparkles, MessageSquare, Mail, Briefcase, Instagram, Zap } from 'lucide-react';
import { Textarea } from './ui/textarea';
import AnimatedEngieBot from './AnimatedEngieBot';

interface ContentType {
  id: string;
  label: string;
  icon: React.ReactNode;
  example: string;
  placeholder: string;
  starterPrompt: string;
}

const contentTypes: ContentType[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    icon: <Briefcase className="w-4 h-4" />,
    example: 'Just launched our new product after 6 months of hard work. The journey was challenging but...',
    placeholder: 'Share your professional update, achievement, or insight...',
    starterPrompt: 'Just launched our new product after 6 months of hard work.'
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    example: 'Hi Sarah, I wanted to follow up on our conversation yesterday about the project timeline...',
    placeholder: 'Write your email here...',
    starterPrompt: 'Hi Sarah, I wanted to follow up on our conversation yesterday.'
  },
  {
    id: 'instagram',
    label: 'Instagram Caption',
    icon: <Instagram className="w-4 h-4" />,
    example: 'Perfect weekend vibes at the local coffee shop ☕ Nothing beats good coffee and great company...',
    placeholder: 'Create your Instagram caption...',
    starterPrompt: 'Perfect weekend vibes at the local coffee shop ☕'
  },
  {
    id: 'general',
    label: 'Other Writing',
    icon: <MessageSquare className="w-4 h-4" />,
    example: 'The future of remote work is changing rapidly. Companies are adapting to new models...',
    placeholder: 'Start writing anything...',
    starterPrompt: 'The future of remote work is changing rapidly.'
  }
];

const engieIntroductions = [
  "Hey! 👋 I'm Engie, your writing buddy. I just made that flow better!",
  "That's me! ✨ I'm Engie, and I'm here to make your writing shine.",
  "Hi there! 🎯 I'm Engie, your AI writing sidekick. Notice how I improved that?",
  "Meet Engie! 🚀 I just gave your text a little polish. Want to see more?"
];

interface InteractiveOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userText: string, contentType: string) => void;
}

export const InteractiveOnboarding: React.FC<InteractiveOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState<'selection' | 'writing' | 'engie-intro' | 'complete'>('selection');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [userText, setUserText] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [showEngie, setShowEngie] = useState(false);
  const [engieEmotion, setEngieEmotion] = useState<'neutral' | 'excited' | 'thoughtful'>('excited');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when writing step starts
  useEffect(() => {
    if (step === 'writing' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  // Mock AI improvement (in real app, this would call your API)
  const generateImprovement = (text: string, type: ContentType) => {
    const improvements = {
      linkedin: text.replace(/our new product/, 'our game-changing product').replace(/challenging/, 'incredibly rewarding'),
      email: text.replace(/I wanted to follow up/, 'I hope this finds you well! I wanted to follow up'),
      instagram: text.replace(/Perfect weekend vibes/, '✨ Perfect weekend vibes').replace(/☕/, '☕✨'),
      general: text.replace(/changing rapidly/, 'evolving at an unprecedented pace').replace(/Companies are/, 'Forward-thinking companies are')
    };
    return improvements[type.id as keyof typeof improvements] || text + ' (with better flow and clarity)';
  };

  const handleTypeSelection = (type: ContentType) => {
    setSelectedType(type);
    setUserText(type.starterPrompt);
    setStep('writing');
  };

  const handleUseStarterPrompt = () => {
    if (selectedType) {
      const improved = generateImprovement(userText, selectedType);
      setImprovementSuggestion(improved);
      setShowEngie(true);
      setStep('engie-intro');
    }
  };

  const handleWriteMyOwn = () => {
    setUserText('');
  };

  const handleTextChange = (value: string) => {
    setUserText(value);
    
    // Show Engie after they write a decent amount
    if (value.length > 50 && !showEngie && selectedType) {
      const improved = generateImprovement(value, selectedType);
      setImprovementSuggestion(improved);
      setTimeout(() => {
        setShowEngie(true);
        setStep('engie-intro');
      }, 1000);
    }
  };

  const handleApplyImprovement = () => {
    setUserText(improvementSuggestion);
    setStep('complete');
    setTimeout(() => {
      onComplete(improvementSuggestion, selectedType?.id || 'general');
    }, 1500);
  };

  const handleKeepOriginal = () => {
    setStep('complete');
    setTimeout(() => {
      onComplete(userText, selectedType?.id || 'general');
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Let's get writing!</h2>
                <p className="text-sm text-muted-foreground">See the magic in action with your own content</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">
            {/* Step 1: Content Type Selection */}
            {step === 'selection' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">What are you writing today?</h3>
                  <p className="text-sm text-muted-foreground">Choose what you want to work on and start writing immediately</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map((type) => (
                    <Card 
                      key={type.id}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
                      onClick={() => handleTypeSelection(type)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          {type.icon}
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{type.example}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Writing */}
            {step === 'writing' && selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      {selectedType.icon}
                      {selectedType.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">Start writing - I'll help as you go!</p>
                  </div>
                  <Badge variant="secondary">Live assistance</Badge>
                </div>

                <div className="space-y-3">
                  <Textarea
                    ref={textareaRef}
                    value={userText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={selectedType.placeholder}
                    className="min-h-[150px] text-base"
                  />

                  {userText === selectedType.starterPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <Button size="sm" onClick={handleUseStarterPrompt}>
                        <Zap className="w-3 h-3 mr-1" />
                        Keep this & see magic
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleWriteMyOwn}>
                        Write my own
                      </Button>
                    </motion.div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  Keep writing... I'll appear when I have helpful suggestions! ✨
                </div>
              </motion.div>
            )}

            {/* Step 3: Engie Introduction */}
            {step === 'engie-intro' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Engie Character */}
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="relative"
                  >
                    <div className="w-20 h-20">
                      <AnimatedEngieBot 
                        animationState="idle"
                        speed="normal"
                        direction="right"
                        emotion={engieEmotion}
                      />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      className="absolute -top-12 -right-8 bg-white dark:bg-gray-800 border rounded-lg px-3 py-1 shadow-lg"
                    >
                      <div className="text-xs font-medium">
                        {engieIntroductions[Math.floor(Math.random() * engieIntroductions.length)]}
                      </div>
                      <div className="absolute bottom-0 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-gray-700"></div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Text Comparison */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Your text:</div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      {userText}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-engie-primary">✨ With Engie's touch:</div>
                    <div className="p-3 bg-engie-primary/10 border border-engie-primary/20 rounded-lg text-sm">
                      {improvementSuggestion}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleApplyImprovement}
                    className="flex-1 bg-gradient-to-r from-engie-primary to-primary text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use Engie's version
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleKeepOriginal}
                    className="flex-1"
                  >
                    Keep mine
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    That's how I work! I'll suggest improvements as you write. 🚀
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">You're all set! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue writing and I'll help you along the way. No tutorials needed - just start typing and I'll assist!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-engie-primary/10 to-primary/10 rounded-lg p-4">
                  <p className="text-sm font-medium text-engie-primary">Pro tip:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click me anytime to chat, get suggestions, or ask for help with your writing! 
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InteractiveOnboarding; 