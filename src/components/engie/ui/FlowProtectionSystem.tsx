import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pause, 
  Play, 
  Timer, 
  Zap,
  Eye,
  EyeOff,
  Coffee
} from 'lucide-react';
import AnimatedEngieBot from '../../AnimatedEngieBot';

interface FlowProtectionProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  pendingSuggestions: number;
  writingSpeed: number; // characters per minute
  lastActivity: Date;
}

export const FlowProtectionSystem: React.FC<FlowProtectionProps> = ({
  isActive,
  onToggle,
  pendingSuggestions,
  writingSpeed,
  lastActivity
}) => {
  const [flowState, setFlowState] = useState<'inactive' | 'detecting' | 'active' | 'cooldown'>('inactive');
  const [autoModeEnabled, setAutoModeEnabled] = useState(true);
  const [showEngieQuietMode, setShowEngieQuietMode] = useState(false);

  // Detect flow state based on writing patterns
  useEffect(() => {
    const timeSinceActivity = Date.now() - lastActivity.getTime();
    const inActiveWriting = timeSinceActivity < 30000; // 30 seconds
    const isFlowSpeed = writingSpeed > 40; // Fast typing indicates flow
    
    if (autoModeEnabled) {
      if (inActiveWriting && isFlowSpeed && flowState !== 'active') {
        setFlowState('detecting');
        setTimeout(() => setFlowState('active'), 3000); // 3 second delay
      } else if (!inActiveWriting && flowState === 'active') {
        setFlowState('cooldown');
        setTimeout(() => setFlowState('inactive'), 10000); // 10 second cooldown
      }
    }
  }, [writingSpeed, lastActivity, autoModeEnabled, flowState]);

  // Show Engie in quiet mode when flow protection is active
  useEffect(() => {
    if (isActive && flowState === 'active') {
      setShowEngieQuietMode(true);
    } else {
      setShowEngieQuietMode(false);
    }
  }, [isActive, flowState]);

  const getFlowStatusColor = () => {
    switch (flowState) {
      case 'detecting': return 'bg-yellow-500';
      case 'active': return 'bg-green-500';
      case 'cooldown': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getFlowStatusText = () => {
    switch (flowState) {
      case 'detecting': return 'Detecting flow...';
      case 'active': return 'In the zone! 🔥';
      case 'cooldown': return 'Flow ending';
      default: return 'Ready to write';
    }
  };

  return (
    <div className="space-y-3">
      {/* Flow Status Card */}
      <Card className={`transition-all duration-300 ${isActive ? 'border-green-200 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8">
                <AnimatedEngieBot 
                  animationState={showEngieQuietMode ? "sleeping" : "idle"}
                  speed={showEngieQuietMode ? "slow" : "normal"}
                  direction="right"
                  emotion={showEngieQuietMode ? "peaceful" : "friendly"}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">Flow Protection</h3>
                  <div className={`w-2 h-2 rounded-full ${getFlowStatusColor()}`} />
                  <span className="text-xs text-muted-foreground">
                    {getFlowStatusText()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isActive 
                    ? "Engie is being extra quiet to keep you focused" 
                    : "Engie will watch for your flow state and step back when you're in the zone"}
                </p>
              </div>
            </div>
            
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onToggle(!isActive)}
              className={`ml-3 ${isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  <span className="text-xs">Protected</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  <span className="text-xs">Enable</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Mode Indicator */}
      {showEngieQuietMode && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 animate-in fade-in slide-in-from-top-2 duration-500">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6">
                <AnimatedEngieBot 
                  animationState="sleeping"
                  speed="slow"
                  direction="right"
                  emotion="peaceful"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Quiet Mode Active
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Engie is staying out of your way while you&apos;re in the zone. 
                  {pendingSuggestions > 0 && (
                    <span className="ml-1">
                      {pendingSuggestions} suggestions waiting quietly.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Suggestions Summary */}
      {pendingSuggestions > 0 && !showEngieQuietMode && (
        <Card className="border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">
                  {pendingSuggestions} suggestion{pendingSuggestions > 1 ? 's' : ''} ready
                </span>
              </div>
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {pendingSuggestions > 5 ? 'Lots to review!' : 'Quick fixes available'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Mode Toggle */}
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Smart Auto Mode</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoModeEnabled(!autoModeEnabled)}
              className={autoModeEnabled ? 'text-green-600' : 'text-gray-400'}
            >
              {autoModeEnabled ? (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  <span className="text-xs">Watching</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  <span className="text-xs">Manual</span>
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {autoModeEnabled 
              ? "Engie automatically detects when you're in flow and steps back"
              : "Manual control - toggle flow protection when you need focus"}
          </p>
        </CardContent>
      </Card>

      {/* Flow Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Flow Tips for Tech Writers
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500 space-y-1">
            <p>• Code reviews: Focus on logic first, polish later</p>
            <p>• Sprint planning: Capture ideas quickly, refine details after</p>
            <p>• LinkedIn posts: Draft your main points, then optimize for engagement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 