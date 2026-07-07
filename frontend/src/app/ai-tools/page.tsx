'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import {
  Wand2, Zap, FileText, GitCommit, BookOpen, Code2, Copy,
  Check, Download, ChevronDown, Loader2, Sparkles, RefreshCw,
  Brain, Terminal, AlignLeft
} from 'lucide-react';

const TOOLS = [
  {
    id: 'explain', icon: BookOpen, label: 'Code Explainer',
    description: 'Understand what any code does in plain English',
    color: 'from-blue-500 to-cyan-500',
    placeholder: 'Paste your code here to get a detailed explanation...',
    endpoint: '/api/v1/ai/explain-code',
    resultKey: 'summary',
  },
  {
    id: 'optimize', icon: Zap, label: 'Code Optimizer',
    description: 'Get a performance-optimized version of your code',
    color: 'from-yellow-500 to-orange-500',
    placeholder: 'Paste code to optimize...',
    endpoint: '/api/v1/ai/optimize-code',
    resultKey: 'optimized_code',
  },
  {
    id: 'docs', icon: FileText, label: 'Documentation Generator',
    description: 'Auto-generate comprehensive documentation',
    color: 'from-emerald-500 to-teal-500',
    placeholder: 'Paste code to generate documentation...',
    endpoint: '/api/v1/ai/generate-docs',
    resultKey: 'documentation',
  },
  {
    id: 'commit', icon: GitCommit, label: 'Commit Message Generator',
    description: 'Generate conventional commit messages',
    color: 'from-purple-500 to-pink-500',
    placeholder: 'Describe your changes or paste diff...',
    endpoint: '/api/v1/ai/generate-commit',
    resultKey: 'full_message',
  },
  {
    id: 'readme', icon: AlignLeft, label: 'README Generator',
    description: 'Create a professional README.md for your project',
    color: 'from-pink-500 to-rose-500',
    placeholder: 'Describe your project (name, features, language)...',
    endpoint: '/api/v1/ai/generate-readme',
    resultKey: 'readme',
  },
  {
    id: 'error', icon: Terminal, label: 'Error Explainer',
    description: 'Understand and fix any error or exception',
    color: 'from-red-500 to-orange-500',
    placeholder: 'Paste your error message or stack trace...',
    endpoint: '/api/v1/ai/explain-error',
    resultKey: 'explanation',
  },
];

export default function AIToolsPage() {
  const { token } = useAuthStore();
  const [activeTool, setActiveTool] = useState(TOOLS[0]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('python');

  const runTool = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setResult(null);
    try {
      const payload: any = { language };
      if (activeTool.id === 'explain' || activeTool.id === 'optimize' || activeTool.id === 'docs') {
        payload.code = input;
      } else if (activeTool.id === 'commit') {
        payload.description = input;
        payload.title = 'code changes';
      } else if (activeTool.id === 'readme') {
        payload.project_name = input.split('\n')[0] || 'My Project';
        payload.description = input;
      } else if (activeTool.id === 'error') {
        payload.error = input;
      }

      const res = await fetch(getApiUrl(activeTool.endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to connect to AI backend. Ensure the server is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    const text = result?.[activeTool.resultKey] || JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResult = () => {
    const text = result?.[activeTool.resultKey] || JSON.stringify(result, null, 2);
    const ext = activeTool.id === 'readme' ? 'md' : activeTool.id === 'commit' ? 'txt' : 'txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeguardian_${activeTool.id}.${ext}`;
    a.click();
  };

  const getDisplayResult = () => {
    if (!result) return '';
    if (activeTool.id === 'explain') {
      return [
        `📋 **Summary:** ${result.summary || ''}`,
        `🎯 **Purpose:** ${result.purpose || ''}`,
        `⚡ **Complexity:** ${result.complexity || ''}`,
        `🔐 **Security Notes:** ${result.security_notes?.join(', ') || 'None'}`,
        `⚡ **Performance Notes:** ${result.performance_notes?.join(', ') || 'None'}`,
        `💡 **Key Concepts:** ${result.key_concepts?.join(', ') || ''}`,
      ].join('\n\n');
    }
    if (activeTool.id === 'error') {
      return [
        `🔴 **Error Type:** ${result.error_type || ''}`,
        `📝 **Explanation:** ${result.explanation || ''}`,
        `🔍 **Root Cause:** ${result.root_cause || ''}`,
        `🛠️ **Fix:**\n${result.fix || ''}`,
        `💡 **Example Fix:**\n\`\`\`\n${result.example_fix || ''}\n\`\`\``,
        `🛡️ **Prevention:** ${result.prevention || ''}`,
      ].join('\n\n');
    }
    if (activeTool.id === 'commit') {
      return result.full_message || '';
    }
    return result[activeTool.resultKey] || JSON.stringify(result, null, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#7C3AED] to-[#2563EB] rounded-2xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            AI Developer Tools
          </h1>
          <p className="text-gray-400 text-xs mt-2">Powered by CodeGuardian AI — your intelligent coding assistant</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Tool selector sidebar */}
          <div className="xl:col-span-1 space-y-2">
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool); setResult(null); setInput(''); }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                  activeTool.id === tool.id
                    ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30 text-white'
                    : 'bg-white/[0.02] border-white/5 text-gray-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${tool.color} flex-shrink-0`}>
                  <tool.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{tool.label}</p>
                  <p className="text-[9px] text-gray-600 line-clamp-1 mt-0.5">{tool.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Main tool workspace */}
          <div className="xl:col-span-3 space-y-4">
            {/* Tool header */}
            <div className="glass rounded-3xl p-5 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${activeTool.color}`}>
                  <activeTool.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">{activeTool.label}</h2>
                  <p className="text-xs text-gray-400">{activeTool.description}</p>
                </div>
                {/* Language selector */}
                <div className="ml-auto flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-gray-500" />
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                  >
                    {['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'cpp'].map(l => (
                      <option key={l} value={l} className="bg-[#09090B]">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input area */}
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={activeTool.placeholder}
                rows={8}
                className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 font-mono placeholder-gray-700 outline-none resize-none focus:border-[#7C3AED]/50 transition-colors"
              />

              <div className="flex justify-end gap-3 mt-3">
                <button onClick={() => { setInput(''); setResult(null); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Clear
                </button>
                <button
                  onClick={runTool}
                  disabled={!input.trim() || isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#2563EB] hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                >
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isLoading ? 'Processing...' : 'Run AI Tool'}
                </button>
              </div>
            </div>

            {/* Result area */}
            {result && (
              <div className="glass rounded-3xl p-5 border border-[#7C3AED]/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#7C3AED]" />
                    AI Result
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={copyResult} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={downloadResult} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                </div>

                <pre className="bg-black/30 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                  {getDisplayResult()}
                </pre>

                {/* Extra fields for specific tools */}
                {activeTool.id === 'optimize' && result.optimizations_applied && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-white">Optimizations Applied:</p>
                    {result.optimizations_applied.map((opt: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {opt}
                      </div>
                    ))}
                    {result.performance_gain && (
                      <div className="mt-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold">
                        ⚡ Estimated Gain: {result.performance_gain}
                      </div>
                    )}
                  </div>
                )}

                {activeTool.id === 'commit' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] text-gray-500 uppercase font-bold">Type</p>
                      <p className="text-xs text-white font-mono mt-0.5">{result.commit_type}</p>
                    </div>
                    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] text-gray-500 uppercase font-bold">Scope</p>
                      <p className="text-xs text-white font-mono mt-0.5">{result.scope}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
