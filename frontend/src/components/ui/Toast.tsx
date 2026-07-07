'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error:   <XCircle className="h-4 w-4 text-red-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  info:    <Info className="h-4 w-4 text-blue-400" />,
};

const STYLES = {
  success: 'border-emerald-500/20 bg-emerald-500/5',
  error:   'border-red-500/20 bg-red-500/5',
  warning: 'border-yellow-500/20 bg-yellow-500/5',
  info:    'border-[#7C3AED]/20 bg-[#7C3AED]/5',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error', title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl pointer-events-auto
              shadow-2xl shadow-black/50 animate-in slide-in-from-right-full duration-300 ${STYLES[t.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{t.title}</p>
              {t.message && <p className="text-xs text-gray-400 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="flex-shrink-0 text-gray-600 hover:text-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
