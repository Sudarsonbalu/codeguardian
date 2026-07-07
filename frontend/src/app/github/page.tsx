'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import {
  Star, GitFork, Lock, Globe, Search, ExternalLink,
  GitBranch, GitCommit, GitPullRequest, RefreshCw, Plus,
  ChevronDown, AlertCircle, Code2, Clock, CheckCircle2
} from 'lucide-react';
import { ListSkeleton } from '../../components/ui/Skeleton';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3776AB', TypeScript: '#3178C6', JavaScript: '#F7DF1E',
  Java: '#ED8B00', Go: '#00ADD8', Rust: '#CE422B', HCL: '#5C4EE5',
};

export default function GitHubPage() {
  const { token } = useAuthStore();
  const [repos, setRepos] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [pulls, setPulls] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [activeTab, setActiveTab] = useState<'repos' | 'commits' | 'pulls'>('repos');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchRepos();
    fetchStatus();
  }, [token]);

  const fetchStatus = async () => {
    if (!token) return;
    const res = await fetch(getApiUrl('/api/v1/github/status'), { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setStatus(data);
  };

  const fetchRepos = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/github/repos${search ? `?search=${search}` : ''}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRepos(data.repos || []);
    } finally {
      setIsLoading(false);
    }
  };

  const selectRepo = async (repo: any) => {
    setSelectedRepo(repo);
    setActiveTab('commits');
    const [branchRes, commitRes, prRes] = await Promise.all([
      fetch(getApiUrl(`/api/v1/github/repos/${repo.name}/branches`), { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(getApiUrl(`/api/v1/github/repos/${repo.name}/commits`), { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(getApiUrl(`/api/v1/github/repos/${repo.name}/pulls`), { headers: { 'Authorization': `Bearer ${token}` } }),
    ]);
    const [bData, cData, pData] = await Promise.all([branchRes.json(), commitRes.json(), prRes.json()]);
    setBranches(bData.branches?.map((b: any) => b.name) || []);
    setCommits(cData.commits || []);
    setPulls(pData.pulls || []);
  };

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Github className="h-7 w-7" />
              GitHub Integration
            </h1>
            <p className="text-gray-400 text-xs mt-1">Browse repositories, commits, and pull requests</p>
          </div>

          {/* Connection status */}
          {status && (
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold ${
                status.connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {status.connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {status.connected ? '✅ Connected' : '🚫 Disconnected'}
              </div>
              {!status.connected && (
                <button
                  onClick={() => { window.location.href = getApiUrl('/auth/github/login'); }}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5"
                >
                  <Github className="h-3.5 w-3.5" />
                  Connect GitHub
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Repo List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass rounded-3xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-white">Repositories</h3>
                <button onClick={fetchRepos} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search repos..."
                  className="bg-transparent text-xs text-gray-300 flex-1 outline-none"
                />
              </div>

              {isLoading ? <ListSkeleton rows={3} /> : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRepos.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => selectRepo(repo)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all ${
                        selectedRepo?.id === repo.id
                          ? 'bg-[#7C3AED]/10 border-[#7C3AED]/30'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">{repo.name}</span>
                        {repo.is_private ? <Lock className="h-3 w-3 text-gray-600 flex-shrink-0" /> : <Globe className="h-3 w-3 text-gray-600 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{repo.description}</p>
                      <div className="flex items-center gap-3 text-[9px] text-gray-600">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#6B7280' }} />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Star className="h-2.5 w-2.5" />{repo.stars}</span>
                        <span className="flex items-center gap-1"><GitFork className="h-2.5 w-2.5" />{repo.forks}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Repo Detail */}
          <div className="lg:col-span-2">
            {!selectedRepo ? (
              <div className="glass rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center">
                <Github className="h-16 w-16 text-gray-800 mb-4" />
                <h3 className="font-bold text-white text-lg mb-2">Select a Repository</h3>
                <p className="text-sm text-gray-500">Choose a repository from the list to view commits, branches, and pull requests</p>
              </div>
            ) : (
              <div className="glass rounded-3xl border border-white/5 overflow-hidden">
                {/* Repo header */}
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {selectedRepo.full_name}
                        {selectedRepo.is_private ? <Lock className="h-3.5 w-3.5 text-gray-500" /> : <Globe className="h-3.5 w-3.5 text-gray-500" />}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{selectedRepo.description}</p>
                    </div>
                    <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View on GitHub
                    </a>
                  </div>

                  {/* Branch selector */}
                  <div className="flex items-center gap-2 mt-3">
                    <GitBranch className="h-3.5 w-3.5 text-[#7C3AED]" />
                    <select
                      value={selectedBranch}
                      onChange={e => setSelectedBranch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none"
                    >
                      {branches.map(b => <option key={b} value={b} className="bg-[#09090B]">{b}</option>)}
                    </select>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5">
                  {[
                    { id: 'commits', label: 'Commits', icon: GitCommit, count: commits.length },
                    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest, count: pulls.length },
                  ].map(tab => (
                    <button key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                        activeTab === tab.id ? 'border-[#7C3AED] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                      <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px]">{tab.count}</span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                  {activeTab === 'commits' && commits.map(commit => (
                    <div key={commit.sha} className="flex items-start gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all">
                      <div className="p-1.5 bg-[#7C3AED]/10 rounded-lg border border-[#7C3AED]/20 flex-shrink-0">
                        <GitCommit className="h-3.5 w-3.5 text-[#7C3AED]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white line-clamp-1">{commit.message}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                          <span>{commit.author}</span>
                          <span>·</span>
                          <span>{new Date(commit.date).toLocaleDateString()}</span>
                          <span className="text-emerald-500">+{commit.additions}</span>
                          <span className="text-red-500">-{commit.deletions}</span>
                        </div>
                      </div>
                      <code className="text-[9px] font-mono text-gray-600 flex-shrink-0">{commit.sha}</code>
                    </div>
                  ))}

                  {activeTab === 'pulls' && pulls.map(pr => (
                    <div key={pr.number} className="flex items-start gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl transition-all">
                      <div className={`p-1.5 rounded-lg border flex-shrink-0 ${
                        pr.state === 'open' ? 'bg-emerald-500/10 border-emerald-500/20' :
                        pr.state === 'merged' ? 'bg-purple-500/10 border-purple-500/20' :
                        'bg-red-500/10 border-red-500/20'
                      }`}>
                        <GitPullRequest className={`h-3.5 w-3.5 ${
                          pr.state === 'open' ? 'text-emerald-400' :
                          pr.state === 'merged' ? 'text-purple-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white line-clamp-1">#{pr.number} {pr.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                          <span>{pr.author}</span>
                          <span className="font-mono">{pr.head} → {pr.base}</span>
                          <span className="text-emerald-500">+{pr.additions}</span>
                          <span className="text-red-500">-{pr.deletions}</span>
                          <span className={pr.ci_status === 'passing' ? 'text-emerald-400' : 'text-red-400'}>
                            CI: {pr.ci_status}
                          </span>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {pr.labels.map((l: string) => (
                            <span key={l} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-bold text-gray-400">{l}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
