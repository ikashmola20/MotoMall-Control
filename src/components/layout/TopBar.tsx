'use client';

import { useAdminStore } from '@/lib/admin-store';
import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  title: string;
  onMenuToggle: () => void;
}

export default function TopBar({ title, onMenuToggle }: TopBarProps) {
  const { notifications, markNotificationRead, logout } = useAdminStore();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-text-secondary hover:text-text-primary">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center bg-bg-secondary rounded-xl px-3 py-2 border border-border">
          <Search className="w-4 h-4 text-text-muted ml-2" />
          <input
            type="text"
            placeholder="بحث..."
            className="bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-48"
          />
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">الإشعارات</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`w-full text-right p-3 border-b border-border hover:bg-bg-secondary transition-colors ${
                      !n.isRead ? 'bg-accent/5' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-text-primary">{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
