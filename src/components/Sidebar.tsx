import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Bell, 
  Settings,
  LogOut,
  GitCompare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/LanguageSelector';

const navigation = [
  {
    name: 'dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    thaiName: 'แดชบอร์ด'
  },
  {
    name: 'portfolio',
    href: '/portfolio',
    icon: TrendingUp,
    thaiName: 'พอร์ตการลงทุน'
  },
  {
    name: 'compare',
    href: '/compare',
    icon: GitCompare,
    thaiName: 'เปรียบเทียบหุ้น'
  },
  {
    name: 'analysis',
    href: '/analysis',
    icon: BarChart3,
    thaiName: 'การวิเคราะห์ Buffett'
  },
  {
    name: 'dividends',
    href: '/dividends',
    icon: DollarSign,
    thaiName: 'เงินปันผล'
  },
  {
    name: 'notifications',
    href: '/notifications',
    icon: Bell,
    thaiName: 'การแจ้งเตือน'
  },
  {
    name: 'settings',
    href: '/settings',
    icon: Settings,
    thaiName: 'ตั้งค่า'
  }
];

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { language } = useLanguage();

  return (
    <div className={cn("flex h-full flex-col bg-sidebar border-r border-sidebar-border", className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-premium flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold bg-gradient-premium bg-clip-text text-transparent">
            Thai Investment
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive 
                    ? "text-sidebar-primary" 
                    : "text-sidebar-foreground group-hover:text-sidebar-primary"
                )}
              />
              {language === 'th' ? item.thaiName : item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Settings */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        <LanguageSelector />
        
        <div className="flex items-center space-x-3 p-3 rounded-md bg-sidebar-accent/30">
          <div className="w-8 h-8 rounded-full bg-gradient-premium flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-primary-foreground">
              {user?.user_metadata?.display_name?.[0] || user?.email?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.user_metadata?.display_name || 'ผู้ใช้'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="w-full border-sidebar-border hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
};