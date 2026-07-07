'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import { useReviewStore } from '../../store/reviewStore';
import { 
  Terminal, Upload, FileArchive, GitBranch, ShieldCheck, 
  Settings2, HelpCircle, Code2, AlertTriangle, ArrowRight
} from 'lucide-react';

export default function NewReviewPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { projects, selectedProjectId, setProjects, setSelectedProjectId } = useReviewStore();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  
  // Repo states
  const [branch, setBranch] = useState('main');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');

  // Review Types configuration checkbox
  const [reviewTypes, setReviewTypes] = useState({
    bug: true,
    security: true,
    performance: true,
    documentation: false,
    refactoring: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    if (!token) return;
    fetch(getApiUrl('/api/v1/projects/'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data[0].id);
          }
        }
      })
      .catch(err => console.error(err));
  }, [token]);

  const handleReviewTypeChange = (key: keyof typeof reviewTypes) => {
    setReviewTypes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const selectedTypes = Object.entries(reviewTypes)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name);

    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    if (apiKey) {
      headers['X-OpenAI-Key'] = apiKey;
    }

    try {
      let res;
      if (activeTab === 'paste') {
        res = await fetch(getApiUrl('/api/v1/reviews/paste'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: title || 'Pasted Code Snippet',
            code,
            language,
            project_id: selectedProjectId,
            review_types: selectedTypes
          })
        });
      } else {
        // Create project repo review (simulate cloning and scanning codebase)
        res = await fetch(getApiUrl('/api/v1/reviews/'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: title || 'Repository Review',
            project_id: selectedProjectId,
            branch,
            review_types: selectedTypes
          })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to trigger review');
      }

      // Redirect to review detail / workspace view
      router.push(`/review/${data.id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Trigger New Review</h1>
          <p className="text-gray-400 text-xs mt-1">Submit files, paste codes, or connect public repositories to trigger analysis.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleStartReview} className="space-y-6">
          {/* Base configuration card */}
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[#7C3AED]" />
              Base Parameters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Select Project Workspace</label>
                <select 
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#7C3AED] transition-colors"
                >
                  {projects.length === 0 ? (
                    <option value="" disabled>No projects available. Create one in Settings.</option>
                  ) : (
                    projects.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#111827] text-white">{p.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Review Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Stripe checkout fix"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Submission type tabs */}
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-2xl">
            <button 
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'paste' ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/10' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="h-4 w-4" />
              Paste Code Snippet
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'upload' ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/10' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload className="h-4 w-4" />
              Repository / Upload ZIP
            </button>
          </div>

          {/* Input blocks */}
          {activeTab === 'paste' ? (
            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-white">Write or Paste Code</h3>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
                >
                  <option value="python" className="bg-[#111827]">Python</option>
                  <option value="javascript" className="bg-[#111827]">JavaScript</option>
                  <option value="typescript" className="bg-[#111827]">TypeScript</option>
                  <option value="go" className="bg-[#111827]">Go</option>
                  <option value="cpp" className="bg-[#111827]">C++</option>
                  <option value="rust" className="bg-[#111827]">Rust</option>
                </select>
              </div>

              <textarea 
                required
                rows={12}
                placeholder={`// Paste your code here\n\nfunction processPayment() {\n  const secret_key = "sk_live_12345"; \n  return true;\n}`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#09090B] border border-white/10 rounded-xl p-4 text-xs font-mono text-[#22C55E] focus:outline-none focus:border-[#7C3AED]/50"
              />
            </div>
          ) : (
            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white">Repository & File Upload</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">GitHub Repository URL</label>
                  <input 
                    type="text"
                    placeholder="https://github.com/org/repo"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Branch / Commit Hash</label>
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input 
                      type="text"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>

              {/* Drag and Drop mockup */}
              <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/[0.01] hover:bg-white/[0.02] transition-colors cursor-pointer">
                <FileArchive className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <span className="font-bold text-xs text-white block">Drag and drop ZIP archive or folder</span>
                <span className="text-[10px] text-gray-500 block mt-1">Accepts project bundles up to 50MB</span>
              </div>
            </div>
          )}

          {/* Analysis target settings */}
          <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#7C3AED]" />
              Analysis Scopes & Verification
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.keys(reviewTypes).map((key) => {
                const isChecked = reviewTypes[key as keyof typeof reviewTypes];
                return (
                  <button 
                    type="button"
                    key={key}
                    onClick={() => handleReviewTypeChange(key as keyof typeof reviewTypes)}
                    className={`flex items-center gap-3 p-3.5 border rounded-2xl text-left capitalize transition-all ${
                      isChecked 
                        ? 'bg-[#7C3AED]/10 border-[#7C3AED]/40 text-white' 
                        : 'bg-transparent border-white/5 text-gray-400 hover:border-white/10'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="accent-[#7C3AED] pointer-events-none"
                    />
                    <span className="text-xs font-bold">{key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || (activeTab === 'paste' && !code)}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/35 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Triggering Code Scan...' : 'Start Review'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
