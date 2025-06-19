import React from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';

interface DashboardHeaderProps {
    // For now, let's assume we might pass user info here
    userName: string;
    userEmail: string;
    onMenuClick?: () => void;
}

const DashboardHeader = ({ userName, userEmail, onMenuClick }: DashboardHeaderProps) => {
    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b premium-gradient-subtle">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu />
        </Button>
        <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                    <AvatarImage src={`https://avatar.vercel.sh/${userEmail}.png`} alt={userEmail} />
                    <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Dashboard</DropdownMenuItem>
                <DropdownMenuItem disabled>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
       </div>
    </header>
  );
};

export default DashboardHeader; 