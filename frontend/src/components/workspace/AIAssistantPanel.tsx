'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, Copy, Check, Sparkles, Code2, FileText,
  Zap, GitCommit, ChevronDown, Loader2, BookOpen, Wand2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantPanelProps {
  reviewId: number;
  selectedCode?: string;
  issues?: any[];
}

const QUICK_ACTIONS = [
  { label: 'Explain Code', icon: BookOpen, prompt: 'explain this code in detail' },
  { label: 'Optimize', icon: Zap, prompt: 'optimize this code for performance' },
  { label: 'Generate Tests', icon: FileText, prompt: 'generate unit tests for this code' },
  { label: 'Fix Issues', icon: Wand2, prompt: 'how do I fix the detected issues?' },
  { label: 'Commit Message', icon: GitCommit, prompt: 'generate a commit message for these changes' },
];

export default function AIAssistantPanel({ reviewId, selectedCode, issues }: AIAssistantPanelProps) {
  const { token } = useAuthStore();
  const [context, setContext] = useState<'file' | 'repo'>('file');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your **CodeGuardian AI Assistant** 🤖\n\nI can help you:\n- **Explain** any part of your code\n- **Optimize** performance bottlenecks\n- **Generate** unit tests\n- **Fix** detected security and bug issues\n- **Generate** commit messages\n\nWhat would you like to explore?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'actions'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    const userMsg = prompt.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const endpoint = context === 'file' 
        ? `/api/v1/reviews/${reviewId}/chat`
        : '/api/v1/copilot/query';
      
      const body = context === 'file'
        ? { prompt: userMsg, code: selectedCode }
        : { query: userMsg };

      const res = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const answer = context === 'file' ? data.response : data.answer;
      setMessages(prev => [...prev, { role: 'assistant', content: answer || 'No response received.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Unable to reach AI backend. Please ensure the server is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 text-[#A78BFA] px-1 rounded text-[10px] font-mono">$1</code>')
      .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-black/40 border border-white/10 rounded-lg p-2 mt-1 mb-1 text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre">$1</pre>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D10] border-l border-white/[0.06]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-[#7C3AED] to-[#2563EB] rounded-md flex items-center justify-center">
            <Bot className="h-3 w-3 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white">AI Assistant</span>
        </div>
        <div className="flex gap-1">
          {['chat', 'actions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wide transition-all ${
                activeTab === tab ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Context scope toggle */}
      {activeTab === 'chat' && (
        <div className="px-3 py-1.5 border-b border-white/[0.04] bg-black/10 flex items-center justify-between text-[9px]">
          <span className="text-gray-500 font-bold uppercase tracking-wider">Scope:</span>
          <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={() => setContext('file')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                context === 'file' ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Selected File
            </button>
            <button
              onClick={() => setContext('repo')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                context === 'repo' ? 'bg-[#7C3AED] text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Entire Repository
            </button>
          </div>
        </div>
      )}

      {activeTab === 'actions' ? (
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          <p className="text-[10px] text-gray-600 mb-3">Quick AI actions for your current code context:</p>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => { setActiveTab('chat'); sendMessage(action.prompt); }}
              className="w-full flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-all text-left group"
            >
              <div className="p-1.5 bg-[#7C3AED]/10 rounded-lg border border-[#7C3AED]/20 group-hover:bg-[#7C3AED]/20 transition-all">
                <action.icon className="h-3.5 w-3.5 text-[#7C3AED]" />
              </div>
              <span className="text-[11px] font-semibold text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
            </button>
          ))}

          {issues && issues.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-[10px] text-gray-600 mb-2 uppercase font-bold tracking-wide">Issues to Fix ({issues.length})</p>
              {issues.slice(0, 3).map((issue, idx) => (
                <button
                  key={idx}
                  onClick={() => { setActiveTab('chat'); sendMessage(`How do I fix: ${issue.message}`); }}
                  className="w-full text-left p-2 mb-1 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-lg transition-all"
                >
                  <span className={`text-[9px] font-bold uppercase mr-1 ${
                    issue.severity === 'critical' ? 'text-red-500' :
                    issue.severity === 'error' ? 'text-orange-500' :
                    issue.severity === 'warning' ? 'text-yellow-500' : 'text-blue-400'
                  }`}>{issue.severity}</span>
                  <span className="text-[10px] text-gray-400 line-clamp-1">{issue.message?.substring(0, 60)}...</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`relative group max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-white'
                      : 'bg-white/[0.04] border border-white/[0.07] text-gray-200'
                  }`}>
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.content, idx)}
                      className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] text-gray-600 hover:text-gray-400"
                    >
                      {copiedIdx === idx ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                      {copiedIdx === idx ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-3 w-3 text-white animate-spin" />
                </div>
                <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 focus-within:border-[#7C3AED]/50 transition-colors">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask about this code..."
                rows={1}
                className="flex-1 bg-transparent text-[11px] text-gray-200 placeholder-gray-600 resize-none outline-none leading-relaxed"
                style={{ maxHeight: '80px', overflowY: 'auto' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="p-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 rounded-lg transition-all flex-shrink-0"
              >
                <Send className="h-3 w-3 text-white" />
              </button>
            </div>
            <p className="text-[9px] text-gray-700 mt-1 text-center">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </>
      )}
    </div>
  );
}
