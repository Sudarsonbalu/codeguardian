'use client';

import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { 
  X, Check, Clipboard, Download, RefreshCw, 
  ChevronDown, HelpCircle, TestTube, Sparkles 
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: number;
  issueId: number;
  token: string;
  onApplySuccess: (updatedScore: number) => void;
}

export default function DiffViewer({ 
  isOpen, 
  onClose, 
  reviewId, 
  issueId, 
  token,
  onApplySuccess 
}: DiffViewerProps) {
  
  const [originalCode, setOriginalCode] = useState('');
  const [fixedCode, setFixedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [impact, setImpact] = useState<any>(null);
  
  const [fixType, setFixType] = useState('best_practice');
  const [isLoading, setIsLoading] = useState(true);
  
  // Test states
  const [showTests, setShowTests] = useState(false);
  const [testFramework, setTestFramework] = useState('pytest');
  const [testCode, setTestCode] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);

  const fetchFix = async (type: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}/issues/${issueId}/fix`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fix_type: type })
      });
      const data = await res.json();
      setOriginalCode(data.original_code);
      setFixedCode(data.fixed_code);
      setExplanation(data.explanation);
      setImpact(data.impact);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFix(fixType);
      setShowTests(false);
      setTestCode('');
    }
  }, [isOpen, issueId, fixType]);

  const handleApply = async () => {
    try {
      const res = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}/issues/${issueId}/apply`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fixed_code: fixedCode,
          original_code: originalCode,
          fix_type: fixType,
          explanation: explanation
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onApplySuccess(data.updated_ai_score);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const generateTests = async () => {
    setIsTestLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}/issues/${issueId}/test`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ framework: testFramework })
      });
      const data = await res.json();
      setTestCode(data.test_code);
      setShowTests(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fixedCode);
  };

  const downloadFixedFile = () => {
    const element = document.createElement("a");
    const file = new Blob([fixedCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "fixed_code.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Box */}
      <div className="relative w-full max-w-6xl h-[85vh] bg-[#09090B] border border-white/10 rounded-3xl overflow-hidden flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7C3AED]/20 rounded-xl border border-[#7C3AED]/35">
              <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">AI Code Auto-Fix Comparison</h2>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Side-by-Side Code Reviewer</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Fix Type Select */}
            <select 
              value={fixType}
              onChange={(e) => setFixType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value="best_practice" className="bg-[#111827]">Best Practice Fix</option>
              <option value="performance" className="bg-[#111827]">Performance Optimized Fix</option>
              <option value="security" className="bg-[#111827]">Security Focused Fix</option>
              <option value="beginner" className="bg-[#111827]">Beginner Friendly Fix</option>
              <option value="minimal" className="bg-[#111827]">Minimal Changes Fix</option>
            </select>

            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable split view */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:grid lg:grid-cols-12">
          {/* Left panel: Info & Diffs explanation (Col 4) */}
          <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Why apply this fix?</h4>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">{explanation || 'Analyzing issue changes...'}</p>
              </div>

              {impact && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Impact Analysis</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Security</span>
                      <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">{impact.security}</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Performance</span>
                      <span className="text-[10px] text-blue-400 font-bold block mt-0.5">{impact.performance}</span>
                    </div>
                    <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                      <span className="text-[9px] text-gray-500 block uppercase font-bold">Readability</span>
                      <span className="text-[10px] text-[#7C3AED] font-bold block mt-0.5">{impact.readability}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test generation panel */}
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <TestTube className="h-4 w-4 text-emerald-500" />
                  Auto Unit Tests
                </span>
                
                <select 
                  value={testFramework}
                  onChange={(e) => setTestFramework(e.target.value)}
                  className="bg-transparent border-0 text-[10px] text-gray-400 font-semibold focus:outline-none"
                >
                  <option value="pytest" className="bg-[#111827]">pytest (Python)</option>
                  <option value="Jest" className="bg-[#111827]">Jest (JS)</option>
                  <option value="JUnit" className="bg-[#111827]">JUnit (Java)</option>
                </select>
              </div>

              {showTests && testCode ? (
                <pre className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] font-mono text-emerald-400 leading-relaxed overflow-x-auto max-h-40">
                  <code>{testCode}</code>
                </pre>
              ) : (
                <button 
                  onClick={generateTests}
                  disabled={isTestLoading}
                  className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] hover:bg-emerald-500/20 rounded-xl text-[10px] font-bold transition-all"
                >
                  {isTestLoading ? 'Generating Tests...' : 'Generate Auto Unit Test'}
                </button>
              )}
            </div>
          </div>

          {/* Right panel: Monaco Diff Editor (Col 8) */}
          <div className="lg:col-span-8 flex flex-col h-[400px] lg:h-full min-h-0 relative">
            <div className="flex-1 min-h-0 bg-[#09090B]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-[#7C3AED] animate-spin" />
                </div>
              ) : (
                <DiffEditor
                  height="100%"
                  original={originalCode}
                  modified={fixedCode}
                  language="python"
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    originalEditable: false,
                    automaticLayout: true,
                    minimap: { enabled: false }
                  }}
                />
              )}
            </div>
            
            {/* Split pane control actions bar */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex gap-3 justify-end items-center">
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-white transition-colors"
              >
                <Clipboard className="h-4 w-4" />
                Copy Code
              </button>
              <button 
                onClick={downloadFixedFile}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-white transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button 
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-xs font-bold rounded-xl text-white transition-colors shadow-md"
              >
                <Check className="h-4 w-4" />
                Apply Fix
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
