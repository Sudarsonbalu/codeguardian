'use client';
import React from 'react';
import { Inbox, FolderOpen, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'inbox' | 'folder' | 'alert';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, icon = 'inbox', action }: EmptyStateProps) {
  const IconComponent = {
    inbox: Inbox,
    folder: FolderOpen,
    alert: AlertCircle,
  }[icon];

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass rounded-3xl border border-white/5 max-w-sm mx-auto">
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-4">
        <IconComponent className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#7C3AED]/20"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
