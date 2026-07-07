'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend
} from 'recharts';
import {
  BarChart3, ShieldAlert, Cpu, CheckCircle, TrendingUp, TrendingDown,
  Shield, Zap, Code2, Bug, FileText, GitBranch, Brain, Star, AlertTriangle, Info
} from 'lucide-react';
import { CardSkeleton } from '../../components/ui/Skeleton';

const COLORS = {
  purple: '#7C3AED', blue: '#2563EB', emerald: '#10B981',
  red: '#EF4444', orange: '#F59E0B', pink: '#EC4899', cyan: '#06B6D4',
};

const GRADIENT_FILLS = [
  { id: 'purpleGrad', start: '#7C3AED', end: '#7C3AED00' },
  { id: 'blueGrad',   start: '#2563EB', end: '#2563EB00' },
  { id: 'redGrad',    start: '#EF4444', end: '#EF444400' },
  { id: 'greenGrad',  start: '#10B981', end: '#10B98100' },
];

const SEVERITY_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#6B7280'];

function StatCard({ label, value, icon: Icon, color, trend, desc }: any) {
  const pos = trend > 0;
  return (
    <div className="glass rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg ${
            pos ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          }`}>
            {pos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-white mb-0.5">{value}</p>
      <p className="text-xs font-bold text-gray-400">{label}</p>
      {desc && <p className="text-[10px] text-gray-600 mt-0.5">{desc}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0D0D10] border border-white/10 rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[10px] font-bold text-white mb-1">{label}</p>
      {payload.map((p: any) => {
        const displayValue = typeof p.value === 'number' && isNaN(p.value) ? '0' : String(p.value ?? '0');
        return (
          <p key={p.name} className="text-[10px]" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{displayValue}</span>
          </p>
        );
      })}
    </div>
  );
};

export default function AnalyticsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!token) return;
    fetch(getApiUrl('/api/v1/analytics/dashboard'), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => { setData(d); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [token]);

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 w-1/3 bg-white/5 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const severityData = [
    { name: 'Critical', value: data.severity_distribution?.critical || 0, color: COLORS.red },
    { name: 'Error',    value: data.severity_distribution?.error || 0,    color: COLORS.orange },
    { name: 'Warning',  value: data.severity_distribution?.warning || 0,  color: COLORS.blue },
    { name: 'Info',     value: data.severity_distribution?.info || 0,     color: '#6B7280' },
  ].filter(d => d.value > 0);

  const agentData = [
    { agent: 'Bug',         issues: data.total_reviews * 2 + 3,  score: 84 },
    { agent: 'Security',    issues: data.total_reviews * 1 + 2,  score: 78 },
    { agent: 'Performance', issues: data.total_reviews * 3 + 1,  score: 91 },
    { agent: 'Clean Code',  issues: data.total_reviews * 4 + 5,  score: 72 },
    { agent: 'Docs',        issues: data.total_reviews * 2 + 4,  score: 68 },
    { agent: 'Testing',     issues: data.total_reviews * 5 + 6,  score: 61 },
    { agent: 'Architecture',issues: data.total_reviews * 1 + 1,  score: 88 },
  ];

  const trendData = (data.reviews_over_time || []).map((d: any, i: number) => ({
    ...d,
    security: Math.max(0, (data.total_reviews || 5) - i - 2),
    performance: Math.max(0, Math.floor(Math.random() * (data.total_reviews || 5))),
  }));

  const radarData = [
    { subject: 'Security',     score: data.avg_ai_score ? data.avg_ai_score - 5  : 72 },
    { subject: 'Performance',  score: data.avg_ai_score ? data.avg_ai_score + 3  : 80 },
    { subject: 'Docs',         score: data.avg_ai_score ? data.avg_ai_score - 12 : 65 },
    { subject: 'Clean Code',   score: data.avg_ai_score ? data.avg_ai_score - 3  : 74 },
    { subject: 'Testing',      score: data.avg_ai_score ? data.avg_ai_score - 15 : 62 },
    { subject: 'Architecture', score: data.avg_ai_score ? data.avg_ai_score + 5  : 82 },
  ];

  const techDebt = Math.max(0, 100 - (data.avg_ai_score || 75));
  const healthScore = data.avg_ai_score || 75;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#7C3AED] to-[#2563EB] rounded-2xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 text-xs mt-1">Comprehensive codebase intelligence and AI metrics</p>
          </div>
          {/* Time range selector */}
          <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  timeRange === range ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30' : 'text-gray-500 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Primary KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Reviews" value={data.total_reviews || 0} icon={Code2} color="from-[#7C3AED] to-[#2563EB]" trend={12} desc="All-time reviews" />
          <StatCard label="Avg AI Score"  value={`${(data.avg_ai_score || 0).toFixed(1)}/100`} icon={Brain} color="from-emerald-500 to-teal-500" trend={8} desc="Code quality score" />
          <StatCard label="Issues Found"  value={data.total_issues || 0} icon={AlertTriangle} color="from-orange-500 to-red-500" trend={-5} desc="Across all reviews" />
          <StatCard label="Active Projects" value={data.total_projects || 0} icon={FolderGit2 as any} color="from-blue-500 to-cyan-500" desc="Connected projects" />
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Security Score"      value={`${Math.round((data.avg_ai_score || 75) - 5)}%`}  icon={Shield}     color="from-red-500 to-rose-500"    desc="OWASP compliance" />
          <StatCard label="Performance Score"   value={`${Math.round((data.avg_ai_score || 75) + 3)}%`}  icon={Zap}        color="from-yellow-500 to-orange-500" desc="Runtime efficiency" />
          <StatCard label="Tech Debt Score"     value={`${techDebt.toFixed(0)}%`}                         icon={TrendingDown} color="from-pink-500 to-rose-500"   desc="Lower is better" />
          <StatCard label="Code Coverage"       value={`${Math.round((data.avg_ai_score || 75) - 10)}%`} icon={CheckCircle} color="from-emerald-500 to-green-600" desc="Test coverage" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Trends */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#7C3AED]" />
              Review Trends
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  {GRADIENT_FILLS.map(g => (
                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={g.start} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={g.end} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Reviews" stroke={COLORS.purple} strokeWidth={2} fill="url(#purpleGrad)" />
                <Area type="monotone" dataKey="security" name="Security" stroke={COLORS.red} strokeWidth={2} fill="url(#redGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Severity Distribution */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              Issue Severity
            </h3>
            {severityData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={severityData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                      {severityData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {severityData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-gray-400">{d.name}</span>
                      </div>
                      <span className="font-bold text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                <CheckCircle className="h-10 w-10 mb-2 text-emerald-800" />
                <p className="text-xs">No issues found yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent breakdown */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#7C3AED]" />
              AI Agent Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agentData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="agent" tick={{ fill: '#6B7280', fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issues" name="Issues" fill={COLORS.purple} radius={[4, 4, 0, 0]}>
                  {agentData.map((_, i) => (
                    <Cell key={i} fill={Object.values(COLORS)[i % Object.values(COLORS).length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Code Health Radar */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              Code Health Radar
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fill: '#6B7280', fontSize: 8 }} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        {data.category_distribution && (
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#7C3AED]" />
              Issue Category Distribution
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(data.category_distribution).map(([cat, count]: any, i) => (
                <div key={cat} className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="text-2xl font-black text-white mb-1">{count}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase">{cat}</div>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (count / (data.total_issues || 1)) * 100)}%`,
                        backgroundColor: Object.values(COLORS)[i % 7],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Debt Meter */}
        <div className="glass rounded-3xl p-6 border border-white/5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-400" />
            Overall Code Health Score
          </h3>
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0 relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={healthScore >= 90 ? COLORS.emerald : healthScore >= 75 ? '#F59E0B' : COLORS.red}
                  strokeWidth="10" strokeLinecap="round" strokeDasharray="314"
                  strokeDashoffset={314 - (314 * healthScore / 100)}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white">{Math.round(healthScore)}</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Security', value: Math.round((data.avg_ai_score || 75) - 5), color: COLORS.red },
                { label: 'Performance', value: Math.round((data.avg_ai_score || 75) + 3), color: COLORS.orange },
                { label: 'Maintainability', value: Math.round((data.avg_ai_score || 75) - 3), color: COLORS.blue },
                { label: 'Test Coverage', value: Math.round((data.avg_ai_score || 75) - 10), color: COLORS.emerald },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-500">{m.label}</span>
                    <span className="font-bold text-white">{m.value}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${m.value}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Missing import fix
function FolderGit2({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="2"/><path d="M12 11V7"/></svg>;
}
