import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TimerIcon } from 'lucide-react';

interface GrokTabProps {
  isGrokActive: boolean;
  grokEndTime: number | null;
  researchTopic: string;
  onResearchTopicChange: (topic: string) => void;
  onToggleGrokMode: () => void;
  onResearchWithGrok: (topic: string) => void;
}

export const GrokTab: React.FC<GrokTabProps> = ({
  isGrokActive,
  grokEndTime,
  researchTopic,
  onResearchTopicChange,
  onToggleGrokMode,
  onResearchWithGrok,
}) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    if (isGrokActive && grokEndTime) {
      const intervalId = setInterval(() => {
        const now = Date.now();
        const diff = grokEndTime - now;
        if (diff <= 0) {
          setTimeLeft('Expired');
          clearInterval(intervalId);
          // Optionally call a deactivation function if not handled by controller's timer
        } else {
          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(intervalId);
    } else {
      setTimeLeft('');
    }
  }, [isGrokActive, grokEndTime]);

  const handleResearch = () => {
    if (researchTopic.trim()) {
      onResearchWithGrok(researchTopic.trim());
    }
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center space-x-2">
        <Switch
          id="grok-mode-toggle"
          checked={isGrokActive}
          onCheckedChange={onToggleGrokMode}
        />
        <Label htmlFor="grok-mode-toggle" className="cursor-pointer">
          Inject Engie with Grok
        </Label>
      </div>

      {isGrokActive && grokEndTime && (
        <div className="flex items-center text-xs text-purple-600 dark:text-purple-400">
          <TimerIcon className="h-4 w-4 mr-1" />
          Grok mode active. Time remaining: {timeLeft}
        </div>
      )}

      {isGrokActive && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="grok-research-topic">Research Topic with Grok</Label>
          <div className="flex space-x-2">
            <Input
              id="grok-research-topic"
              type="text"
              placeholder="Enter a topic..."
              value={researchTopic}
              onChange={(e) => onResearchTopicChange(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleResearch} variant="outline" size="sm">
              Research
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Grok will provide a concise summary or answer related to your topic.
          </p>
        </div>
      )}

      {!isGrokActive && (
        <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
          Activate Grok mode to enable opinionated comments and research capabilities.
        </p>
      )}
    </div>
  );
};
