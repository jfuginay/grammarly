"use client";

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast'; // Assuming toast is set up
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  content: string;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ content, className }) => {
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Copied to clipboard!' });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: 'Failed to copy to clipboard', variant: 'destructive' });
    }
  };

  const handleShareEmail = () => {
    const subject = 'Check out this text';
    const body = encodeURIComponent(content);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(content);
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  };

  const handleShareFacebook = () => {
    // Facebook requires a URL to share. For text, we can use a quote.
    // Note: This opens the share dialog, but Facebook might not prefill the quote for all users/setups.
    // A more robust solution might involve creating a temporary page or using the Feed Dialog with an API key.
    const text = encodeURIComponent(content);
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${text}`, '_blank', 'noopener,noreferrer');
    toast({ title: 'Facebook share dialog opened.', description: 'Note: Facebook may not always prefill text content directly.' });
  };

  const handleShareLinkedIn = () => {
    // LinkedIn sharing - for text-only content, we'll use the newer LinkedIn sharing approach
    // that focuses on the text content rather than requiring a URL
    const text = encodeURIComponent(content);
    
    // Use LinkedIn's intent URL which is better for text sharing
    // This opens the LinkedIn compose dialog with the text pre-filled
    const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${text}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    
    toast({ 
      title: 'LinkedIn share dialog opened.', 
      description: 'Your text should be pre-filled in the LinkedIn post composer.' 
    });
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'exported_text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: 'Text downloaded as .txt' });
  };

  const menuItems = [
    {
      label: 'Copy to Clipboard',
      icon: Copy,
      action: handleCopy,
    },
    {
      label: 'Download as .txt',
      icon: Download,
      action: handleDownloadTxt,
    },
    { type: 'separator' as const },
    {
      label: 'Share via Email',
      icon: Mail,
      action: handleShareEmail,
    },
    {
      label: 'Share to Twitter',
      icon: Twitter,
      action: handleShareTwitter,
    },
    {
      label: 'Share to Facebook',
      icon: Facebook,
      action: handleShareFacebook,
    },
    {
      label: 'Share to LinkedIn',
      icon: Linkedin,
      action: handleShareLinkedIn,
    },
  ];

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn('flex items-center space-x-2', className)}>
          <Share2 className="h-4 w-4" />
          <span>Export</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }
          const IconComponent = item.icon;
          return (
            <DropdownMenuItem key={item.label} onClick={item.action} className="flex items-center space-x-2">
              <IconComponent className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
