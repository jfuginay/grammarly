import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { X, Sparkles, MessageSquare, Mail, Briefcase, Instagram, Zap, ChevronDown, FileText, Presentation, GraduationCap, Users, Share2, PenTool, Heart, User } from 'lucide-react';
import { Textarea } from './ui/textarea';
import AnimatedEngieBot from './AnimatedEngieBot';

type WritingMode = 'professional' | 'social';

interface ContentType {
  id: string;
  label: string;
  icon: React.ReactNode;
  example: string;
  placeholder: string;
  starterPrompt: string;
}

interface DropdownCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: ContentType[];
}

// Professional Mode Content Types
const professionalContentTypes = {
  documentation: [
    {
      id: 'api-docs',
      label: 'API Docs',
      icon: <FileText className="w-4 h-4" />,
      example: 'This endpoint returns user profile data with authentication required...',
      placeholder: 'Write your API documentation...',
      starterPrompt: 'This endpoint returns user profile data with authentication required.'
    },
    {
      id: 'tech-specs',
      label: 'Technical Specs',
      icon: <Zap className="w-4 h-4" />,
      example: 'The system architecture follows a microservices pattern with event-driven communication...',
      placeholder: 'Write your technical specification...',
      starterPrompt: 'The system architecture follows a microservices pattern with event-driven communication.'
    },
    {
      id: 'user-manuals',
      label: 'User Manuals',
      icon: <FileText className="w-4 h-4" />,
      example: 'To get started with the dashboard, first navigate to the settings panel...',
      placeholder: 'Write your user manual section...',
      starterPrompt: 'To get started with the dashboard, first navigate to the settings panel.'
    },
    {
      id: 'system-architecture',
      label: 'System Architecture',
      icon: <Zap className="w-4 h-4" />,
      example: 'The application uses a three-tier architecture with load balancing...',
      placeholder: 'Describe your system architecture...',
      starterPrompt: 'The application uses a three-tier architecture with load balancing.'
    },
    {
      id: 'code-comments',
      label: 'Code Comments',
      icon: <FileText className="w-4 h-4" />,
      example: 'This function handles user authentication by validating JWT tokens...',
      placeholder: 'Write your code documentation...',
      starterPrompt: 'This function handles user authentication by validating JWT tokens.'
    }
  ],
  business: [
    {
      id: 'proposals',
      label: 'Proposals',
      icon: <Presentation className="w-4 h-4" />,
      example: 'We propose implementing a new customer onboarding system to improve retention...',
      placeholder: 'Write your business proposal...',
      starterPrompt: 'We propose implementing a new customer onboarding system to improve retention.'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="w-4 h-4" />,
      example: 'Q3 performance metrics show a 25% increase in user engagement...',
      placeholder: 'Write your business report...',
      starterPrompt: 'Q3 performance metrics show a 25% increase in user engagement.'
    },
    {
      id: 'presentations',
      label: 'Presentations',
      icon: <Presentation className="w-4 h-4" />,
      example: 'Today we&apos;ll discuss the roadmap for our new product launch...',
      placeholder: 'Write your presentation content...',
      starterPrompt: 'Today we&apos;ll discuss the roadmap for our new product launch.'
    },
    {
      id: 'executive-summaries',
      label: 'Executive Summaries',
      icon: <Briefcase className="w-4 h-4" />,
      example: 'This quarter&apos;s initiatives focus on scaling our infrastructure...',
      placeholder: 'Write your executive summary...',
      starterPrompt: 'This quarter&apos;s initiatives focus on scaling our infrastructure.'
    },
    {
      id: 'project-plans',
      label: 'Project Plans',
      icon: <Presentation className="w-4 h-4" />,
      example: 'Phase 1 of the migration will focus on database optimization...',
      placeholder: 'Write your project plan...',
      starterPrompt: 'Phase 1 of the migration will focus on database optimization.'
    }
  ],
  academic: [
    {
      id: 'research-papers',
      label: 'Research Papers',
      icon: <GraduationCap className="w-4 h-4" />,
      example: 'This study examines the impact of machine learning on software development...',
      placeholder: 'Write your research content...',
      starterPrompt: 'This study examines the impact of machine learning on software development.'
    },
    {
      id: 'whitepapers',
      label: 'Whitepapers',
      icon: <FileText className="w-4 h-4" />,
      example: 'The emergence of edge computing presents new opportunities for IoT...',
      placeholder: 'Write your whitepaper...',
      starterPrompt: 'The emergence of edge computing presents new opportunities for IoT.'
    },
    {
      id: 'case-studies',
      label: 'Case Studies',
      icon: <GraduationCap className="w-4 h-4" />,
      example: 'Company X reduced deployment time by 80% using automated testing...',
      placeholder: 'Write your case study...',
      starterPrompt: 'Company X reduced deployment time by 80% using automated testing.'
    },
    {
      id: 'technical-analysis',
      label: 'Technical Analysis',
      icon: <Zap className="w-4 h-4" />,
      example: 'The performance bottleneck appears to be in the database query optimization...',
      placeholder: 'Write your technical analysis...',
      starterPrompt: 'The performance bottleneck appears to be in the database query optimization.'
    },
    {
      id: 'grant-proposals',
      label: 'Grant Proposals',
      icon: <GraduationCap className="w-4 h-4" />,
      example: 'This research project aims to develop new algorithms for distributed computing...',
      placeholder: 'Write your grant proposal...',
      starterPrompt: 'This research project aims to develop new algorithms for distributed computing.'
    }
  ],
  communication: [
    {
      id: 'emails',
      label: 'Emails',
      icon: <Mail className="w-4 h-4" />,
      example: 'I wanted to follow up on yesterday&apos;s meeting about the API integration...',
      placeholder: 'Write your professional email...',
      starterPrompt: 'I wanted to follow up on yesterday&apos;s meeting about the API integration.'
    },
    {
      id: 'memos',
      label: 'Memos',
      icon: <FileText className="w-4 h-4" />,
      example: 'Please note the updated security protocols for accessing production servers...',
      placeholder: 'Write your memo...',
      starterPrompt: 'Please note the updated security protocols for accessing production servers.'
    },
    {
      id: 'meeting-notes',
      label: 'Meeting Notes',
      icon: <MessageSquare className="w-4 h-4" />,
      example: 'Action items from today&apos;s sprint planning: implement authentication system...',
      placeholder: 'Write your meeting notes...',
      starterPrompt: 'Action items from today&apos;s sprint planning: implement authentication system.'
    },
    {
      id: 'status-updates',
      label: 'Status Updates',
      icon: <Users className="w-4 h-4" />,
      example: 'Current progress on the mobile app: completed user interface design...',
      placeholder: 'Write your status update...',
      starterPrompt: 'Current progress on the mobile app: completed user interface design.'
    },
    {
      id: 'technical-reviews',
      label: 'Technical Reviews',
      icon: <Zap className="w-4 h-4" />,
      example: 'Code review for PR #123: The implementation looks solid overall...',
      placeholder: 'Write your technical review...',
      starterPrompt: 'Code review for PR #123: The implementation looks solid overall.'
    }
  ]
};

// Social Mode Content Types
const socialContentTypes = {
  platforms: [
    {
      id: 'linkedin-posts',
      label: 'LinkedIn Posts',
      icon: <Briefcase className="w-4 h-4" />,
      example: 'Just shipped a new feature that reduces API response time by 40%...',
      placeholder: 'Share your professional update...',
      starterPrompt: 'Just shipped a new feature that reduces API response time by 40%.'
    },
    {
      id: 'twitter',
      label: 'X/Twitter',
      icon: <Share2 className="w-4 h-4" />,
      example: 'Hot take: The best debugging tool is still console.log() 🔥',
      placeholder: 'Share your tech thoughts...',
      starterPrompt: 'Hot take: The best debugging tool is still console.log().'
    },
    {
      id: 'threads',
      label: 'Threads',
      icon: <MessageSquare className="w-4 h-4" />,
      example: 'Thread: Why I switched from React to Next.js for my latest project...',
      placeholder: 'Start your thread...',
      starterPrompt: 'Thread: Why I switched from React to Next.js for my latest project.'
    },
    {
      id: 'instagram-captions',
      label: 'Instagram Captions',
      icon: <Instagram className="w-4 h-4" />,
      example: 'Late night coding session vibes ✨ Working on something exciting...',
      placeholder: 'Write your Instagram caption...',
      starterPrompt: 'Late night coding session vibes ✨ Working on something exciting.'
    },
    {
      id: 'facebook-posts',
      label: 'Facebook Posts',
      icon: <Share2 className="w-4 h-4" />,
      example: 'Excited to share that our team just launched a new open-source tool...',
      placeholder: 'Share your update...',
      starterPrompt: 'Excited to share that our team just launched a new open-source tool.'
    }
  ],
  content: [
    {
      id: 'blog-posts',
      label: 'Blog Posts',
      icon: <PenTool className="w-4 h-4" />,
      example: 'In this post, I&apos;ll walk through building a real-time chat app with WebSockets...',
      placeholder: 'Write your blog post...',
      starterPrompt: 'In this post, I&apos;ll walk through building a real-time chat app with WebSockets.'
    },
    {
      id: 'articles',
      label: 'Articles',
      icon: <FileText className="w-4 h-4" />,
      example: 'The future of web development: exploring the latest trends in 2024...',
      placeholder: 'Write your article...',
      starterPrompt: 'The future of web development: exploring the latest trends in 2024.'
    },
    {
      id: 'newsletters',
      label: 'Newsletters',
      icon: <Mail className="w-4 h-4" />,
      example: 'This week in tech: major updates from the JavaScript ecosystem...',
      placeholder: 'Write your newsletter...',
      starterPrompt: 'This week in tech: major updates from the JavaScript ecosystem.'
    },
    {
      id: 'medium-stories',
      label: 'Medium Stories',
      icon: <PenTool className="w-4 h-4" />,
      example: 'How I learned to stop worrying and love TypeScript...',
      placeholder: 'Write your Medium story...',
      starterPrompt: 'How I learned to stop worrying and love TypeScript.'
    },
    {
      id: 'personal-essays',
      label: 'Personal Essays',
      icon: <Heart className="w-4 h-4" />,
      example: 'My journey from bootcamp graduate to senior developer...',
      placeholder: 'Share your personal story...',
      starterPrompt: 'My journey from bootcamp graduate to senior developer.'
    }
  ],
  community: [
    {
      id: 'forum-posts',
      label: 'Forum Posts',
      icon: <MessageSquare className="w-4 h-4" />,
      example: 'Has anyone else encountered this React hydration error? Here&apos;s what I tried...',
      placeholder: 'Write your forum post...',
      starterPrompt: 'Has anyone else encountered this React hydration error? Here&apos;s what I tried.'
    },
    {
      id: 'reddit-comments',
      label: 'Reddit Comments',
      icon: <Users className="w-4 h-4" />,
      example: 'This is actually a common pattern in functional programming...',
      placeholder: 'Write your Reddit comment...',
      starterPrompt: 'This is actually a common pattern in functional programming.'
    },
    {
      id: 'discord-messages',
      label: 'Discord Messages',
      icon: <MessageSquare className="w-4 h-4" />,
      example: 'Hey team! Just pushed the fix for the deployment issue 🚀',
      placeholder: 'Write your Discord message...',
      starterPrompt: 'Hey team! Just pushed the fix for the deployment issue.'
    },
    {
      id: 'slack-updates',
      label: 'Slack Updates',
      icon: <Users className="w-4 h-4" />,
      example: 'Morning update: finished the authentication module, moving to testing...',
      placeholder: 'Write your Slack update...',
      starterPrompt: 'Morning update: finished the authentication module, moving to testing.'
    },
    {
      id: 'github-issues',
      label: 'GitHub Issues',
      icon: <Zap className="w-4 h-4" />,
      example: 'Bug: Login form validation not working on Safari mobile...',
      placeholder: 'Write your GitHub issue...',
      starterPrompt: 'Bug: Login form validation not working on Safari mobile.'
    }
  ],
  personal: [
    {
      id: 'personal-bio',
      label: 'Personal Bio',
      icon: <User className="w-4 h-4" />,
      example: 'Full-stack developer passionate about building scalable web applications...',
      placeholder: 'Write your bio...',
      starterPrompt: 'Full-stack developer passionate about building scalable web applications.'
    },
    {
      id: 'dating-profiles',
      label: 'Dating Profiles',
      icon: <Heart className="w-4 h-4" />,
      example: 'Software engineer who debugs code by day and explores new restaurants by night...',
      placeholder: 'Write your dating profile...',
      starterPrompt: 'Software engineer who debugs code by day and explores new restaurants by night.'
    },
    {
      id: 'cover-letters',
      label: 'Cover Letters',
      icon: <Mail className="w-4 h-4" />,
      example: 'I am excited to apply for the Senior Developer position at your company...',
      placeholder: 'Write your cover letter...',
      starterPrompt: 'I am excited to apply for the Senior Developer position at your company.'
    },
    {
      id: 'thank-you-notes',
      label: 'Thank You Notes',
      icon: <Heart className="w-4 h-4" />,
      example: 'Thank you for taking the time to interview me yesterday...',
      placeholder: 'Write your thank you note...',
      starterPrompt: 'Thank you for taking the time to interview me yesterday.'
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <Share2 className="w-4 h-4" />,
      example: 'Excited to announce that I&apos;m starting a new role as Lead Developer...',
      placeholder: 'Write your announcement...',
      starterPrompt: 'Excited to announce that I&apos;m starting a new role as Lead Developer.'
    }
  ]
};

const professionalCategories: DropdownCategory[] = [
  {
    id: 'documentation',
    label: 'Documentation',
    icon: <FileText className="w-4 h-4" />,
    items: professionalContentTypes.documentation
  },
  {
    id: 'business',
    label: 'Business Writing',
    icon: <Presentation className="w-4 h-4" />,
    items: professionalContentTypes.business
  },
  {
    id: 'academic',
    label: 'Academic/Research',
    icon: <GraduationCap className="w-4 h-4" />,
    items: professionalContentTypes.academic
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: <Users className="w-4 h-4" />,
    items: professionalContentTypes.communication
  }
];

const socialCategories: DropdownCategory[] = [
  {
    id: 'platforms',
    label: 'Social Platforms',
    icon: <Share2 className="w-4 h-4" />,
    items: socialContentTypes.platforms
  },
  {
    id: 'content',
    label: 'Content Creation',
    icon: <PenTool className="w-4 h-4" />,
    items: socialContentTypes.content
  },
  {
    id: 'community',
    label: 'Community',
    icon: <Users className="w-4 h-4" />,
    items: socialContentTypes.community
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: <User className="w-4 h-4" />,
    items: socialContentTypes.personal
  }
];

const engieIntroductions = [
  "Hey! 👋 I&apos;m Engie, your writing buddy. I just made that flow better!",
  "That&apos;s me! ✨ I&apos;m Engie, and I&apos;m here to make your writing shine.",
  "Hi there! 🎯 I&apos;m Engie, your AI writing sidekick. Notice how I improved that?",
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
  const [writingMode, setWritingMode] = useState<WritingMode>('professional');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [userText, setUserText] = useState('');
  const [improvementSuggestion, setImprovementSuggestion] = useState('');
  const [showEngie, setShowEngie] = useState(false);
  const [engieEmotion, setEngieEmotion] = useState<'neutral' | 'excited' | 'thoughtful'>('excited');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset component state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all state to initial values for a fresh start
      setStep('selection');
      setWritingMode('professional');
      setSelectedType(null);
      setUserText('');
      setImprovementSuggestion('');
      setShowEngie(false);
      setEngieEmotion('excited');
      setOpenDropdown(null);
    }
  }, [isOpen]);

  // Auto-focus textarea when writing step starts
  useEffect(() => {
    if (step === 'writing' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Mock AI improvement (in real app, this would call your API)
  const generateImprovement = (text: string, type: ContentType) => {
    const improvements: Record<string, string> = {
      'api-docs': text.replace(/returns/, 'retrieves and returns').replace(/required/, 'mandatory for security'),
      'tech-specs': text.replace(/follows/, 'implements').replace(/pattern/, 'architectural pattern').replace(/communication/, 'inter-service communication'),
      'linkedin-posts': text.replace(/shipped/, 'successfully deployed').replace(/reduces/, 'dramatically reduces').replace(/40%/, '40% 🚀'),
      'twitter': text.replace(/Hot take/, '🔥 Hot take').replace(/still/, 'arguably still'),
      'blog-posts': text.replace(/walk through/, 'provide a comprehensive guide to').replace(/building/, 'architecting and building'),
      'emails': text.replace(/follow up/, 'circle back').replace(/meeting/, 'productive discussion'),
      'personal-bio': text.replace(/passionate about/, 'deeply committed to').replace(/building/, 'crafting innovative'),
      // Add more specific improvements for other types
    };
    return improvements[type.id] || text + ' (enhanced with improved clarity and professional tone)';
  };

  const currentCategories = writingMode === 'professional' ? professionalCategories : socialCategories;

  const handleModeSwitch = (mode: WritingMode) => {
    setWritingMode(mode);
    setOpenDropdown(null);
  };

  const handleDropdownToggle = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === categoryId ? null : categoryId);
  };

  const handleTypeSelection = (type: ContentType) => {
    setSelectedType(type);
    setUserText(type.starterPrompt);
    setOpenDropdown(null);
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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                  Grammarly-EST Writing Assistant
                </h2>
                <p className="text-sm text-muted-foreground">Choose your writing style and let Engie enhance it in real-time</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">
            {/* Step 1: Mode Selection & Content Type Selection */}
            {step === 'selection' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Mode Toggle Buttons */}
                <div className="flex justify-center">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
                    <Button
                      onClick={() => handleModeSwitch('professional')}
                      className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
                        writingMode === 'professional'
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Professional Mode
                    </Button>
                    <Button
                      onClick={() => handleModeSwitch('social')}
                      className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
                        writingMode === 'social'
                          ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md'
                          : 'bg-white text-gray-700 border hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Social Mode
                    </Button>
                  </div>
                </div>

                {/* Category Description */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">
                    {writingMode === 'professional' ? 'Professional Writing Categories' : 'Social Writing Categories'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {writingMode === 'professional' 
                      ? 'Select from documentation, business writing, academic content, or professional communication'
                      : 'Choose from social platforms, content creation, community posts, or personal writing'
                    }
                  </p>
                </div>

                {/* Dropdown Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                  {currentCategories.map((category) => (
                    <div key={category.id} className="relative">
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-sky-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        onClick={(e) => handleDropdownToggle(category.id, e)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-sky-100 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/30 rounded-lg text-sky-600 dark:text-sky-400">
                                {category.icon}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">{category.label}</span>
                            </div>
                            <ChevronDown 
                              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                                openDropdown === category.id ? 'rotate-180' : ''
                              }`} 
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {openDropdown === category.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden"
                          >
                            {category.items.map((item) => (
                              <motion.div
                                key={item.id}
                                whileHover={{ backgroundColor: 'rgb(248, 250, 252)' }}
                                className="p-3 cursor-pointer hover:bg-sky-50 dark:hover:bg-gray-700 transition-colors duration-150 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                onClick={() => handleTypeSelection(item)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-sky-600 dark:text-sky-400">
                                    {item.icon}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-white">{item.label}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">{item.example}</div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Mode-specific tip */}
                <div className="text-center p-4 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                  <p className="text-sm text-sky-700 dark:text-sky-300">
                    {writingMode === 'professional' 
                      ? '💼 Professional mode optimizes for clarity, structure, and business impact'
                      : '🌟 Social mode enhances engagement, personality, and authentic voice'
                    }
                  </p>
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
                      <Badge variant="secondary" className="ml-2">
                        {writingMode === 'professional' ? 'Professional' : 'Social'}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">Start writing - Engie will assist as you go!</p>
                  </div>
                  <Badge variant="secondary" className="bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-700">
                    Live assistance
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Textarea
                    ref={textareaRef}
                    value={userText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={selectedType.placeholder}
                    className="min-h-[150px] text-base border-sky-200 focus:border-sky-400 focus:ring-sky-400"
                  />

                  {userText === selectedType.starterPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2"
                    >
                      <Button 
                        size="sm" 
                        onClick={handleUseStarterPrompt}
                        className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Keep this & see magic
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleWriteMyOwn}>
                        Write my own
                      </Button>
                    </motion.div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground text-center bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 p-3 rounded-lg">
                  Keep writing... Engie will appear when ready to help! ✨
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
                      className="absolute -top-12 -right-8 bg-white dark:bg-gray-800 border border-sky-200 rounded-lg px-3 py-1 shadow-lg"
                    >
                      <div className="text-xs font-medium">
                        {engieIntroductions[Math.floor(Math.random() * engieIntroductions.length)]}
                      </div>
                      <div className="absolute bottom-0 left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-sky-200 dark:border-t-gray-700"></div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Text Comparison */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Your text:</div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm border">
                      {userText}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-sky-600 dark:text-sky-400">✨ With Engie&apos;s enhancement:</div>
                    <div className="p-3 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border border-sky-200 dark:border-sky-800 rounded-lg text-sm">
                      {improvementSuggestion}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleApplyImprovement}
                    className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Use Engie&apos;s version
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleKeepOriginal}
                    className="flex-1 border-sky-200 hover:bg-sky-50"
                  >
                    Keep mine
                  </Button>
                </div>

                <div className="text-center bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    That&apos;s how I work! I&apos;ll suggest improvements as you write in {writingMode} mode. 🚀
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
                  <h3 className="text-lg font-semibold">You&apos;re all set! 🎉</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue writing in {writingMode} mode and Engie will help you along the way. No tutorials needed - just start typing!
                  </p>
                </div>

                <div className="bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-sky-200 dark:border-sky-800">
                  <p className="text-sm font-medium text-sky-600 dark:text-sky-400">Pro tip:</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click me anytime to chat, get suggestions, or switch between professional and social writing modes! 
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