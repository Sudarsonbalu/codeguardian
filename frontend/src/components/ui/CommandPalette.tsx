'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, Sparkles, Code2, Users, Settings, BarChart3, Brain } from 'lucide-react';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  action: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    { id: 'dashboard', name: 'Go to Dashboard', description: 'View recent reviews and repo health', icon: Code2, category: 'Navigation', action: () => router.push('/dashboard') },
    { id: 'new-review', name: 'Start New Review', description: 'Analyze new code snippet or repo', icon: Sparkles, category: 'Review', action: () => router.push('/new-review') },
    { id: 'github', name: 'GitHub Integration', description: 'Browse remote git repos', icon: Github, category: 'Integration', action: () => router.push('/github') },
    { id: 'ai-tools', name: 'AI Developer Tools', description: 'Explain, optimize or document code', icon: Brain, category: 'AI Tools', action: () => router.push('/ai-tools') },
    { id: 'teams', name: 'Manage Teams', description: 'Invite developers and organize collaboration', icon: Users, category: 'Collaboration', action: () => router.push('/teams') },
    { id: 'analytics', name: 'System Analytics', description: 'Verify performance and security trends', icon: BarChart3, category: 'Analytics', action: () => router.push('/analytics') },
    { id: 'settings', name: 'Account Settings', description: 'Manage profiles and access tokens', icon: Settings, category: 'Configuration', action: () => router.push('/settings') },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Palette Box */}
      <div
        ref={containerRef}
        className="relative w-full max-w-xl bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-0 z-10"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-black/10">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or page name..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
          <kbd className="flex items-center gap-0.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-500 font-bold font-mono">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>

        <div className="flex-1 overflow-y-auto max-h-80 p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No matching commands found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => { cmd.action(); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/35 text-white' : 'border border-transparent text-gray-400 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#7C3AED]/20' : 'bg-white/5'}`}>
                    <cmd.icon className={`h-4 w-4 ${isSelected ? 'text-[#A78BFA]' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      {cmd.name}
                      <span className="text-[9px] font-semibold text-gray-600 px-1.5 py-0.2 bg-white/5 border border-white/10 rounded">{cmd.category}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{cmd.description}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
