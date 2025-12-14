import { useState } from 'react';
import { Menu, X, User, Search, BookOpen, Settings, Home, MessageSquare, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavigationProps {
  onNavigate: (screen: string) => void;
  currentScreen: string;
}

export function Navigation({ onNavigate, currentScreen }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
        <div className="glass rounded-full px-8 py-3 shadow-2xl border border-white/20 backdrop-blur-xl">
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => onNavigate('home')}
            >
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-xl shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-bold gradient-text">VoyageAI</span>
            </div>

            <div className="flex items-center space-x-2 border-l border-white/20 pl-6">
              <button
                onClick={() => onNavigate('home')}
                className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                  currentScreen === 'home' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">Home</span>
              </button>
              <button
                onClick={() => onNavigate('chat')}
                className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                  currentScreen === 'chat' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Plan</span>
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center space-x-2 ${
                  currentScreen === 'dashboard' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Trips</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 border-l border-white/20 pl-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-white/10 text-slate-200"
                onClick={() => onNavigate('chat')}
              >
                <Search className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm">
                        JD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass border-white/20 text-slate-100">
                  <DropdownMenuLabel className="text-slate-200">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={() => onNavigate('profile')}
                    className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onNavigate('dashboard')}
                    className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Saved Plans
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onNavigate('profile')}
                    className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="text-pink-400 hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                    ✨ Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/10">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => onNavigate('home')}
            >
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-bold gradient-text">VoyageAI</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 transition-all"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('chat');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 transition-all"
              >
                <MessageSquare className="h-5 w-5" />
                <span>Plan a Trip</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 transition-all"
              >
                <Calendar className="h-5 w-5" />
                <span>My Itineraries</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="h-0 md:h-24" />
    </>
  );
}
