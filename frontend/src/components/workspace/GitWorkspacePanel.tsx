'use client';

import React, { useState, useEffect } from 'react';
import { GitBranch, RefreshCw, GitCommit, FileText, ArrowDown, ArrowUp, Plus, History } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

interface GitWorkspacePanelProps {
  token: string;
}

export default function GitWorkspacePanel({ token }: GitWorkspacePanelProps) {
  const [status, setStatus] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [commits, setCommits] = useState<any[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);

  const fetchGitData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Fetch Status
      const statusRes = await fetch(getApiUrl('/api/v1/git/status'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data.changes || []);
      }

      // 2. Fetch Branches
      const branchesRes = await fetch(getApiUrl('/api/v1/git/branches'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data.branches || []);
        setCurrentBranch(data.current || 'main');
      }

      // 3. Fetch Log
      const logRes = await fetch(getApiUrl('/api/v1/git/log'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logRes.ok) {
        const data = await logRes.json();
        setCommits(data.commits || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGitData();
  }, [token]);

  const handleCheckout = async (branchName: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/api/v1/git/checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ branch: branchName })
      });
      if (res.ok) {
        fetchGitData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to switch branch");
      }
    } catch (e) {
      alert("Error switching branch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/api/v1/git/branch'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBranchName.trim() })
      });
      if (res.ok) {
        setNewBranchName('');
        setShowCreateBranch(false);
        fetchGitData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create branch");
      }
    } catch (e) {
      alert("Error creating branch");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/api/v1/git/commit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: commitMessage.trim() })
      });
      if (res.ok) {
        setCommitMessage('');
        fetchGitData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to commit");
      }
    } catch (e) {
      alert("Error committing changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/api/v1/git/pull'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message || "Pull completed");
      fetchGitData();
    } catch (e) {
      alert("Error pulling updates");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/api/v1/git/push'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message || "Push completed");
      fetchGitData();
    } catch (e) {
      alert("Error pushing updates");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 h-full min-h-0 text-[10px] text-gray-300">
      {/* Col 1: Staging & Changes */}
      <div className="border border-white/[0.04] bg-black/10 rounded-lg p-3 flex flex-col min-h-0 overflow-y-auto">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest">Changes ({status.length})</span>
          <button
            onClick={fetchGitData}
            disabled={isLoading}
            className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {status.length === 0 ? (
            <div className="text-gray-600 italic py-6 text-center">No modified files. Working tree clean.</div>
          ) : (
            status.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                  <span className="truncate font-mono">{item.file}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                  item.status.includes('M') ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25' :
                  item.status.includes('A') || item.status.includes('?') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' :
                  'bg-red-500/10 text-red-500 border border-red-500/25'
                }`}>
                  {item.status.trim()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Col 2: Active Branch & Commit Action */}
      <div className="border border-white/[0.04] bg-black/10 rounded-lg p-3 flex flex-col justify-between min-h-0">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span className="font-extrabold uppercase text-gray-400 tracking-widest">Active Branch</span>
            </div>
            <button
              onClick={() => setShowCreateBranch(!showCreateBranch)}
              className="p-1 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1"
            >
              <Plus className="h-3 w-3" />
              New Branch
            </button>
          </div>

          {showCreateBranch ? (
            <form onSubmit={handleCreateBranch} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 focus:outline-none text-[10px] text-white font-mono"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded"
              >
                Create
              </button>
            </form>
          ) : (
            <select
              value={currentBranch}
              onChange={(e) => handleCheckout(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 focus:outline-none text-[10px] text-white font-mono"
            >
              {branches.map((b) => (
                <option key={b} value={b} className="bg-[#09090B]">
                  {b}
                </option>
              ))}
            </select>
          )}

          {/* Sync actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePull}
              className="flex items-center justify-center gap-1 px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg font-bold transition-all text-gray-400 hover:text-white"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Pull Origin
            </button>
            <button
              onClick={handlePush}
              className="flex items-center justify-center gap-1 px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg font-bold transition-all text-gray-400 hover:text-white"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Push Origin
            </button>
          </div>
        </div>

        {/* Commit form */}
        <form onSubmit={handleCommit} className="space-y-2 pt-4 border-t border-white/[0.04]">
          <input
            type="text"
            required
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none text-[10px] text-white placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={status.length === 0}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold rounded-lg transition-all shadow-md shadow-indigo-600/10"
          >
            <GitCommit className="h-3.5 w-3.5" />
            Stage & Commit All
          </button>
        </form>
      </div>

      {/* Col 3: Commit History Log */}
      <div className="border border-white/[0.04] bg-black/10 rounded-lg p-3 flex flex-col min-h-0 overflow-y-auto">
        <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex-shrink-0 flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-indigo-400" />
          Commit Log History
        </span>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {commits.length === 0 ? (
            <div className="text-gray-600 italic py-6 text-center">No commits logged.</div>
          ) : (
            commits.map((commit, idx) => (
              <div key={idx} className="p-2 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                <div className="flex justify-between items-center gap-2 mb-1">
                  <span className="font-bold text-gray-400 truncate text-[9px]">{commit.subject}</span>
                  <span className="text-indigo-400 font-mono text-[8px] font-semibold bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/25">
                    {commit.hash.slice(0, 7)}
                  </span>
                </div>
                <div className="flex justify-between text-[8px] text-gray-500">
                  <span className="font-bold">{commit.author}</span>
                  <span>{new Date(commit.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
