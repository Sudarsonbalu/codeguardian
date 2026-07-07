'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import { 
  User, Key, BrainCircuit, Bell, CreditCard, Shield, 
  Settings, Check, Save, Sparkles, FolderKanban, Plus, RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const { token, user, setUser } = useAuthStore();
  
  // Settings form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [openaiKey, setOpenaiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Workspace creation state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [projectList, setProjectList] = useState<any[]>([]);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const fetchWorkspaceInfo = async () => {
    if (!token) return;
    try {
      // Teams
      const teamsRes = await fetch(getApiUrl('/api/v1/teams/'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamsData = await teamsRes.json();
      if (Array.isArray(teamsData)) {
        setTeamsList(teamsData);
        if (teamsData.length > 0) setSelectedTeamId(teamsData[0].id);
      }

      // Projects
      const projectsRes = await fetch(getApiUrl('/api/v1/projects/'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const projectsData = await projectsRes.json();
      if (Array.isArray(projectsData)) setProjectList(projectsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspaceInfo();
  }, [token]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    
    // Simulate saving profile values and updating state
    if (user) {
      const updatedUser = { ...user, full_name: fullName, email };
      setUser(updatedUser);
      setSuccessMsg('Profile settings updated successfully!');
    }
  };

  const handleSaveAIConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    // Write AI API settings to localStorage for front-end query use
    localStorage.setItem('openai_api_key', openaiKey);
    localStorage.setItem('ai_model', selectedModel);
    setSuccessMsg('AI review engine configuration updated!');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !newProjectName) return;

    try {
      const res = await fetch(getApiUrl('/api/v1/projects/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDesc,
          team_id: selectedTeamId
        })
      });
      if (res.ok) {
        setNewProjectName('');
        setNewProjectDesc('');
        setSuccessMsg('New workspace project created successfully!');
        fetchWorkspaceInfo();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">System Settings</h1>
          <p className="text-gray-400 text-xs mt-1">Configure profile details, AI model selections, APIs, billing scopes, and teams.</p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] text-xs rounded-xl text-center">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu Sidebar */}
          <div className="space-y-2">
            <div className="glass rounded-2xl p-4 border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold px-3 mb-2">Category</span>
              <a href="#profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-white/5">
                <User className="h-4 w-4 text-[#7C3AED]" />
                User Profile
              </a>
              <a href="#ai-model" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.02]">
                <BrainCircuit className="h-4 w-4 text-[#2563EB]" />
                AI Model Config
              </a>
              <a href="#workspaces" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.02]">
                <FolderKanban className="h-4 w-4 text-emerald-500" />
                Manage Projects
              </a>
              <a href="#billing" className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.02]">
                <CreditCard className="h-4 w-4 text-amber-500" />
                Subscription & Plan
              </a>
            </div>
          </div>

          {/* Form content */}
          <div className="md:col-span-2 space-y-6">
            {/* User Profile Settings */}
            <div id="profile" className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <User className="h-4 w-4 text-[#7C3AED]" />
                Profile Settings
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit"
                    className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#7C3AED]/20"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* AI Model Config Settings */}
            <div id="ai-model" className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <BrainCircuit className="h-4 w-4 text-[#2563EB]" />
                AI Model Engine settings
              </h3>

              <form onSubmit={handleSaveAIConfig} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Select Default OpenAI Model</label>
                    <select 
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="gpt-4o-mini" className="bg-[#111827]">GPT-4o Mini (Default - High Speed)</option>
                      <option value="gpt-4o" className="bg-[#111827]">GPT-4o (Premium - Deep Review)</option>
                      <option value="gpt-3.5-turbo" className="bg-[#111827]">GPT-3.5 Turbo (Legacy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">OpenAI API Authorization Key</label>
                    <input 
                      type="password"
                      placeholder="sk-proj-..."
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#2563EB] placeholder:text-gray-700"
                    />
                    <span className="text-[10px] text-gray-500 block mt-1">If blank, CodeGuardian operates in sandbox simulation mode.</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit"
                    className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#2563EB]/20"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save AI Config
                  </button>
                </div>
              </form>
            </div>

            {/* Manage Projects Workspaces */}
            <div id="workspaces" className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <FolderKanban className="h-4 w-4 text-emerald-500" />
                Workspaces & Projects
              </h3>

              <form onSubmit={handleCreateProject} className="space-y-4 border-b border-white/5 pb-5">
                <h4 className="font-bold text-xs text-gray-400">Add New Project</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Project Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Authentication API"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Project Description</label>
                    <input 
                      type="text"
                      placeholder="Optional brief description"
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit"
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Project
                  </button>
                </div>
              </form>

              <div>
                <h4 className="font-bold text-xs text-gray-400 mb-3">Active Workspace Projects ({projectList.length})</h4>
                <div className="space-y-2">
                  {projectList.map(p => (
                    <div key={p.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-white block">{p.name}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">{p.description || 'No description provided.'}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">ID: {p.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Billing Page Mockup */}
            <div id="billing" className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <CreditCard className="h-4 w-4 text-amber-500" />
                Subscription Billing Info
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div>
                  <span className="font-bold text-sm text-amber-500 block">Enterprise Active Plan</span>
                  <span className="text-xs text-gray-400 mt-1 block">Full AI reviewers and priority worker queues active.</span>
                </div>
                <span className="text-xs text-white font-bold bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/35">$149 / mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
