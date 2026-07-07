'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, PlusCircle, FolderGit2, GitPullRequest, 
  Terminal, BarChart3, Users, History, Settings, CreditCard,
  Search, Bell, LogOut, Code2, Menu, X, Check, Brain
} from 'lucide-react';
import Link from 'next/link';
import { getApiUrl } from '../utils/api';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

let isGloballyMounted = false;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [mounted, setMounted] = useState(isGloballyMounted);

  useEffect(() => {
    isGloballyMounted = true;
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !token) {
      router.push('/login');
    }
  }, [token, router, mounted]);

  // Fetch notifications
  useEffect(() => {
    if (!token || !mounted) return;
    fetch(getApiUrl('/api/v1/notifications/'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          logout();
          return null;
        }
        if (!res.ok) {
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) setNotifications(data);
      })
      .catch(err => console.error(err));
  }, [token, mounted]);

  const handleMarkRead = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/v1/notifications/${id}/read`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted || !token) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'New Review', icon: PlusCircle, path: '/new-review' },
    { name: 'Projects', icon: FolderGit2, path: '/projects' },
    { name: 'Pull Requests', icon: GitPullRequest, path: '/pull-requests' },
    { name: 'GitHub', icon: Github, path: '/github' },
    { name: 'AI Tools', icon: Brain, path: '/ai-tools' },
    { name: 'Teams', icon: Users, path: '/teams' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#09090B] flex text-gray-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/5 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="p-2 bg-[#7C3AED]/20 rounded-lg border border-[#7C3AED]/30">
            <Code2 className="h-6 w-6 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white">CodeGuardian</h1>
            <span className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase">AI REVIEW</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20 border border-[#7C3AED]/50' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#7C3AED]'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder'} 
              alt="avatar" 
              className="w-10 h-10 rounded-xl border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Alex Mercer'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'developer@codeguardian.ai'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/5 text-gray-400 hover:text-white hover:bg-[#EF4444]/10 hover:border-[#EF4444]/30 transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="glass-nav sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg border border-white/10"
            >
              <Menu className="h-5 w-5 text-gray-300" />
            </button>
            <div className="relative hidden sm:block w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search reviews, projects..." 
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 hover:bg-white/5 rounded-xl border border-white/10 relative transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-[#EF4444] rounded-full ring-2 ring-[#09090B]"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                    <h3 className="font-semibold text-sm text-white">Notifications</h3>
                    <span className="text-xs text-gray-400">{unreadCount} unread</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-gray-500 py-4">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 rounded-xl border transition-all ${n.is_read ? 'bg-transparent border-transparent' : 'bg-[#7C3AED]/5 border-[#7C3AED]/20'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-xs font-semibold text-white">{n.title}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{n.message}</p>
                            </div>
                            {!n.is_read && (
                              <button 
                                onClick={() => handleMarkRead(n.id)}
                                className="p-1 hover:bg-[#7C3AED]/20 text-[#7C3AED] rounded"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile trigger */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-semibold text-white">{user?.full_name || 'Alex Mercer'}</p>
                <p className="text-[10px] text-gray-500">Enterprise Admin</p>
              </div>
              <img 
                src={user?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder'} 
                alt="avatar" 
                className="w-9 h-9 rounded-lg border border-white/10"
              />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
            <div className="relative flex flex-col w-64 max-w-xs bg-[#09090B] border-r border-white/10 h-full p-6 animate-slide-in">
              <button 
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-5 p-2 hover:bg-white/5 rounded-lg border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-8">
                <Code2 className="h-6 w-6 text-[#7C3AED]" />
                <span className="font-bold text-lg text-white">CodeGuardian</span>
              </div>
              <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-[#7C3AED] text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={logout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Children content page */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
