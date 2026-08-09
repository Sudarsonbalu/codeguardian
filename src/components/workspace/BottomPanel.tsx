'use client';

import React, { useState } from 'react';
import { AlertTriangle, Info, Terminal, GitBranch, List, Activity, ChevronDown, Loader2 } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import TerminalPanel from './TerminalPanel';
import GitWorkspacePanel from './GitWorkspacePanel';

interface Issue {
  id: number;
  severity: string;
  category: string;
  message: string;
  file_path: string;
  line_number: number;
  agent_name?: string;
  is_resolved?: boolean;
}

interface BottomPanelProps {
  issues: Issue[];
  logs: string[];
  reviewTitle?: string;
  branch?: string;
  commitHash?: string;
  onIssueClick?: (issue: Issue) => void;
  reviewId?: number;
  token?: string;
}

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-3 w-3 text-red-500" />,
  error:    <AlertTriangle className="h-3 w-3 text-orange-500" />,
  warning:  <Info className="h-3 w-3 text-yellow-500" />,
  info:     <Info className="h-3 w-3 text-blue-400" />,
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  error:    'bg-orange-500',
  warning:  'bg-yellow-500',
  info:     'bg-blue-500',
};

type TabType = 'problems' | 'output' | 'git' | 'terminal';

export default function BottomPanel({ issues, logs, reviewTitle, branch, commitHash, onIssueClick, reviewId, token }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('problems');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPushing, setIsPushing] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);

  const handlePushFix = async () => {
    if (!token || !reviewId) return;
    setIsPushing(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/github/reviews/${reviewId}/push-fix`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ branch: `codeguardian-fixes-${reviewId}` })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Fixes pushed successfully!");
      } else {
        alert("Error pushing fixes: " + (data.detail || "Unknown error"));
      }
    } catch (e) {
      alert("Network connection error");
    } finally {
      setIsPushing(false);
    }
  };

  const handleCreatePR = async () => {
    if (!token || !reviewId) return;
    setIsCreatingPR(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/github/reviews/${reviewId}/create-pr`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `CodeGuardian AI: Refactor & fixes for #${reviewId}`,
          head: `codeguardian-fixes-${reviewId}`,
          base: 'main'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Pull request opened!");
        if (data.pr_url) window.open(data.pr_url, '_blank');
      } else {
        alert("Error creating PR: " + (data.detail || "Unknown error"));
      }
    } catch (e) {
      alert("Network connection error");
    } finally {
      setIsCreatingPR(false);
    }
  };

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const unresolvedCount = issues.filter(i => !i.is_resolved).length;

  const tabs = [
    { id: 'problems' as TabType, label: 'Problems', icon: AlertTriangle, count: unresolvedCount },
    { id: 'output' as TabType,   label: 'Output',   icon: Activity },
    { id: 'git' as TabType,      label: 'Git',      icon: GitBranch },
    { id: 'terminal' as TabType, label: 'Terminal', icon: Terminal },
  ];

  return (
    <div className={`flex flex-col bg-[#09090B] border-t border-white/[0.06] transition-all ${isExpanded ? 'h-48' : 'h-8'}`}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsExpanded(true); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border-t-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#7C3AED] text-white bg-white/[0.03]'
                  : 'border-transparent text-gray-600 hover:text-gray-400'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-0.5 px-1 py-0 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[8px] font-black">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-1.5 text-gray-600 hover:text-gray-400 transition-colors"
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Tab content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'problems' && (
            <div className="p-1">
              {/* Summary bar */}
              {issues.length > 0 && (
                <div className="flex items-center gap-3 px-2 py-1 mb-1 text-[9px] text-gray-500 font-bold">
                  {criticalCount > 0 && <span className="text-red-500">{criticalCount} critical</span>}
                  {errorCount > 0 && <span className="text-orange-500">{errorCount} errors</span>}
                  {warningCount > 0 && <span className="text-yellow-500">{warningCount} warnings</span>}
                </div>
              )}
              {issues.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-[10px] text-gray-600">
                  ✅ No issues detected
                </div>
              ) : (
                issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => onIssueClick?.(issue)}
                    className={`w-full flex items-start gap-2 px-2 py-1 hover:bg-white/[0.03] rounded text-left transition-all ${
                      issue.is_resolved ? 'opacity-40' : ''
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">{SEVERITY_ICON[issue.severity] || SEVERITY_ICON.info}</span>
                    <span className="text-[10px] text-gray-300 flex-1 truncate font-mono">{issue.message}</span>
                    <span className="text-[9px] text-gray-600 flex-shrink-0 font-mono">{issue.file_path}:{issue.line_number}</span>
                    {issue.agent_name && (
                      <span className="text-[8px] text-[#7C3AED]/60 hidden md:block flex-shrink-0">{issue.agent_name.split(' ')[0]}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'output' && (
            <div className="p-2 font-mono text-[10px] text-gray-400 space-y-0.5">
              {logs.length === 0 ? (
                <div className="text-gray-600 py-4 text-center">No output to display</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`${
                    log.includes('✅') ? 'text-emerald-400' :
                    log.includes('⚠️') || log.includes('failed') ? 'text-red-400' :
                    log.includes('🤖') || log.includes('🚀') ? 'text-[#A78BFA]' :
                    'text-gray-400'
                  }`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'git' && (
            <div className="h-full p-1">
              <GitWorkspacePanel token={token || ''} />
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="h-full p-1">
              <TerminalPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
