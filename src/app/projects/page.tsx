'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import { 
  FolderKanban, Plus, ExternalLink, Calendar, 
  Trash2, ShieldAlert, CheckCircle, RefreshCw, X
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create project dialog
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(getApiUrl('/api/v1/projects/'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const teamsRes = await fetch(getApiUrl('/api/v1/teams/'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamsData = await teamsRes.json();
      if (!teamsRes.ok || teamsData.length === 0) {
        throw new Error("You must belong to at least one workspace team to create projects.");
      }
      
      const teamId = teamsData[0].id;
      
      const res = await fetch(getApiUrl('/api/v1/projects/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, team_id: teamId })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create project");
      }
      
      setName('');
      setDescription('');
      setIsOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Workspace Projects</h1>
            <p className="text-gray-400 text-xs mt-1">Manage, categorize and launch scans on all your repository applications.</p>
          </div>
          
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md text-white"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Loading / Empty States */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/5 space-y-4">
            <FolderKanban className="h-12 w-12 text-gray-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Projects Registered</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">Create a workspace project first to map repositories and launch AI static code scans.</p>
            <button 
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-xs font-semibold text-[#7C3AED] rounded-xl transition-colors"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                className="glass rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                      <FolderKanban className="h-4 w-4 text-[#7C3AED]" />
                    </div>
                    <h4 className="font-extrabold text-sm text-white group-hover:text-[#7C3AED] transition-colors">{proj.name}</h4>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{proj.description || 'No description provided.'}</p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[10px] text-gray-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(proj.created_at).toLocaleDateString()}
                  </span>
                  
                  <Link 
                    href="/new-review" 
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Start Scan
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsOpen(false)}></div>
            
            <div className="relative w-full max-w-md bg-[#09090B] border border-white/10 rounded-3xl p-6 z-10 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-[#7C3AED]" />
                  Create Workspace Project
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl text-center font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Project Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Stripe Payments Capture"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea 
                    placeholder="Provide description of backend repos/services..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-bold rounded-xl text-white transition-colors"
                >
                  {isSubmitting ? 'Creating Project...' : 'Register Project'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
