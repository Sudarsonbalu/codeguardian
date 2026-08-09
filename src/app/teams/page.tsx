'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import { 
  Users, UserPlus, ClipboardList, ShieldAlert, 
  Calendar, Check, AlertCircle, Trash2, Mail
} from 'lucide-react';

export default function TeamsPage() {
  const { token, user } = useAuthStore();
  
  // Lists
  const [members, setMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchTeamData = async () => {
    if (!token || !mounted) return;
    try {
      // 1. Fetch Teams
      const teamsRes = await fetch(getApiUrl('/api/v1/teams/'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamsData = await teamsRes.json();
      if (Array.isArray(teamsData) && teamsData.length > 0) {
        setTeams(teamsData);
        setSelectedTeamId(teamsData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeamDetails = async (teamId: number) => {
    if (!token || !mounted) return;
    try {
      // 2. Fetch Members
      const membersRes = await fetch(getApiUrl(`/api/v1/teams/${teamId}/members`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const membersData = await membersRes.json();
      if (Array.isArray(membersData)) setMembers(membersData);

      // 3. Fetch Audit Logs
      const logsRes = await fetch(getApiUrl(`/api/v1/teams/${teamId}/audit-logs`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = await logsRes.json();
      if (Array.isArray(logsData)) setAuditLogs(logsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchTeamData();
    }
  }, [token, mounted]);

  useEffect(() => {
    if (mounted && selectedTeamId) {
      fetchTeamDetails(selectedTeamId);
    }
  }, [selectedTeamId, mounted]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !inviteEmail) return;

    setIsSubmitting(true);
    setInviteSuccess(null);
    setInviteError(null);

    try {
      const res = await fetch(getApiUrl(`/api/v1/teams/${selectedTeamId}/members`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invite operation failed');
      }

      setInviteEmail('');
      setInviteSuccess(`Successfully invited user ${inviteEmail}!`);
      fetchTeamDetails(selectedTeamId);
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!selectedTeamId || !token) return;
    if (!confirm("Are you sure you want to remove this member from the team?")) return;

    try {
      const res = await fetch(getApiUrl(`/api/v1/teams/${selectedTeamId}/members/${memberId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTeamDetails(selectedTeamId);
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to remove member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Team Workspace</h1>
            <p className="text-gray-400 text-xs mt-1">Manage team roles, invite members and view team event audit trails.</p>
          </div>
          
          {teams.length > 1 && (
            <select 
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} className="bg-[#111827]">{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members list */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Users className="h-4 w-4 text-[#7C3AED]" />
              Workspace Members ({members.length})
            </h3>
            
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={m.user?.avatar_url || 'https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder'} 
                      alt="avatar" 
                      className="w-9 h-9 rounded-xl border border-white/10"
                    />
                    <div>
                      <span className="font-bold text-xs text-white block">{m.user?.full_name || m.user?.email?.split('@')[0] || 'Member'}</span>
                      <span className="text-[10px] text-gray-500 block">{m.user?.email || ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/10 bg-white/5 capitalize text-gray-300">
                      {m.role}
                    </span>
                    {user && m.user_id !== user.id && (
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invite block */}
          <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <UserPlus className="h-4 w-4 text-[#2563EB]" />
                Invite Member
              </h3>

              {inviteSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#22C55E] text-xs rounded-xl text-center">
                  {inviteSuccess}
                </div>
              )}
              {inviteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl text-center">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input 
                      type="email"
                      required
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Workspace Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="admin" className="bg-[#111827]">Workspace Admin</option>
                    <option value="reviewer" className="bg-[#111827]">AI Reviewer</option>
                    <option value="developer" className="bg-[#111827]">Developer</option>
                    <option value="viewer" className="bg-[#111827]">Viewer</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#2563EB]/25"
                >
                  {isSubmitting ? 'Inviting...' : 'Send Invitation'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Audit trail / Activity Timeline */}
        <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <ClipboardList className="h-4 w-4 text-emerald-500" />
            Workspace Activity Log (Audit Trail)
          </h3>
          
          <div className="space-y-4">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-xs py-4 text-center">No workspace logs yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start text-xs border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="p-2 bg-white/5 border border-white/5 rounded-xl text-gray-400">
                    <Calendar className="h-4 w-4 text-[#7C3AED]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white uppercase tracking-wider text-[10px]">{log.action}</span>
                      <span className="text-gray-500 text-[10px]">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-400 mt-1">{log.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
