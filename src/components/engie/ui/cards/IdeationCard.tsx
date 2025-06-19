import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '../../types';

interface IdeationCardProps {
  message: ChatMessage;
  onDismiss: () => void;
}

export const IdeationCard: React.FC<IdeationCardProps> = ({ message, onDismiss }) => {
  return (
    <Card className="mb-4 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">
          Engie's Idea Corner
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {message.content}
        </p>
      </CardContent>
      <CardFooter className="p-3 pt-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
}; 