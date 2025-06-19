import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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
import { Moon, Sun, Settings, LogOut, User as UserIcon, CreditCard } from 'lucide-react';
import Logo from './Logo';
import { useMediaQuery } from '@/hooks/use-media-query';

interface HeaderProps {
  user?: {
    email?: string;
    name?: string;
    picture?: string;
  } | null;
}

const Header = ({ user: propUser }: HeaderProps) => {
  const router = useRouter();
  const { user: auth0User, logout } = useAuth0();
  
  // Use either the passed in user prop or the Auth0 user
  const user = propUser || auth0User;
  
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    // Initialize theme based on system preference
    if (isDarkMode === null) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(prefersDark);
      }
    }
  }, [prefersDark, isDarkMode]);

  useEffect(() => {
    // Apply theme to document
    if (isDarkMode !== null) {
      document.documentElement.classList.toggle('dark', isDarkMode);
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleSignOut = async () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 w-full">
      {/* Backdrop blur for a premium feel */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 opacity-70"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 transition-transform duration-300 hover:scale-105">
                <Logo />
              </div>
              <h1 className="text-xl font-bold premium-text-gradient">
                WriteMaster
              </h1>
            </div>
            
            {/* Right side menu */}
            <div className="flex items-center gap-4">
              {/* Theme toggle with smooth animation */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <div className="relative w-5 h-5 transform transition-all duration-500">
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 text-amber-400 animate-in fade-in duration-300" />
                  ) : (
                    <Moon className="h-5 w-5 text-indigo-600 animate-in fade-in duration-300" />
                  )}
                </div>
              </Button>
              
              {user ? (
                <>
                  <span className="hidden md:inline-block text-sm font-medium text-gray-600 dark:text-gray-300">
                    Welcome, <span className="font-semibold text-blue-600 dark:text-blue-400">{user.email ? user.email.split('@')[0] : 'User'}</span>
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="premium-hover-lift rounded-full p-0 h-10 w-10 overflow-hidden border-2 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
                        <Avatar>
                          <AvatarImage src={user.picture} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
                      <DropdownMenuLabel className="font-normal p-4 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.email?.split('@')[0]}</p>
                          <p className="text-xs leading-none text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <div className="p-1">
                        <DropdownMenuItem className="cursor-pointer rounded-lg flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                          <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                          <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                          <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span>Subscription</span>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator />
                      <div className="p-1">
                        <DropdownMenuItem 
                          onClick={handleSignOut} 
                          className="cursor-pointer rounded-lg flex items-center gap-2 p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => router.push('/login')}
                  className="premium-button-gradient"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;