import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bot } from 'lucide-react';

interface VoiceTabProps {
  documents: Array<{ id: string; title: string }>;
  selectedDocIds: string[];
  isStyleModalOpen: boolean;
  onDocSelectionChange: (docId: string) => void;
  onAnalyzeStyle: () => void;
  onStyleModalOpenChange: (isOpen: boolean) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({
  documents,
  selectedDocIds,
  isStyleModalOpen,
  onDocSelectionChange,
  onAnalyzeStyle,
  onStyleModalOpenChange,
}) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          My Voice Profile
        </CardTitle>
        <CardDescription>
          Analyze your writing to create a personalized style profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Your voice profile is empty. Select documents to analyze and build your profile.
        </p>
        <Dialog open={isStyleModalOpen} onOpenChange={onStyleModalOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full">Analyze My Style</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Style Samples</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`doc-${doc.id}`}
                    checked={selectedDocIds.includes(doc.id)}
                    onCheckedChange={() => onDocSelectionChange(doc.id)}
                  />
                  <Label htmlFor={`doc-${doc.id}`} className="flex-1 truncate">
                    {doc.title}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onStyleModalOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onAnalyzeStyle} disabled={selectedDocIds.length === 0}>
                Analyze {selectedDocIds.length} Document(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}; 