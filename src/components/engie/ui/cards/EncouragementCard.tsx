import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChatMessage } from '../../types';

interface EncouragementCardProps {
  message: ChatMessage;
}

export const EncouragementCard: React.FC<EncouragementCardProps> = ({ message }) => {
  return (
    <Card className="mb-4 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">
          A little boost from Engie!
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {message.content}
        </p>
      </CardContent>
    </Card>
  );
}; 