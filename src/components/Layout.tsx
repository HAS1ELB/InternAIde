import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, FileText, Plus, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: 'dashboard' | 'profile' | 'cvs';
  onNavigate?: (page: 'dashboard' | 'profile' | 'cvs') => void;
}

export function Layout({ children, currentPage = 'dashboard', onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                InternAIde
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate?.('dashboard')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={currentPage === 'cvs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate?.('cvs')}
              >
                <Plus className="h-4 w-4 mr-2" />
                CVs
              </Button>
              <Button
                variant={currentPage === 'profile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate?.('profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b bg-background">
        <div className="container px-4 py-2">
          <div className="flex gap-1">
            <Button
              variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onNavigate?.('dashboard')}
              className="flex-1"
            >
              Dashboard
            </Button>
            <Button
              variant={currentPage === 'cvs' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onNavigate?.('cvs')}
              className="flex-1"
            >
              CVs
            </Button>
            <Button
              variant={currentPage === 'profile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onNavigate?.('profile')}
              className="flex-1"
            >
              Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container px-4 py-6">
        {children}
      </main>
    </div>
  );
}