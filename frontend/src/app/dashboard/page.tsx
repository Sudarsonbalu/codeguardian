'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import { 
  FileCode2, ShieldAlert, Bug, Zap, LayoutGrid, ArrowUpRight, 
  ArrowDownRight, Code2, Plus, RefreshCw, ChevronRight, FileText, UserPlus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { token, logout } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchDashboardData = async () => {
    if (!token || !mounted) return;
    try {
      setIsLoading(true);
      // Fetch Analytics stats
      const analyticsRes = await fetch(getApiUrl('/api/v1/analytics/dashboard'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (analyticsRes.status === 401 || analyticsRes.status === 403) {
        logout();
        return;
      }
      if (!analyticsRes.ok) throw new Error("Failed to fetch dashboard analytics");
      const analyticsData = await analyticsRes.json();
      setData(analyticsData);

      // Fetch Recent reviews
      const reviewsRes = await fetch(getApiUrl('/api/v1/reviews/'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData.slice(0, 5));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [token, mounted]);

  if (isLoading || !data || !data.stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, trends, languages } = data;

  const cardMetrics = [
    { name: 'Total Reviews', value: stats.total_reviews, change: stats.total_reviews_change, icon: FileCode2, color: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/10' },
    { name: 'AI Quality Score', value: `${stats.ai_score.toFixed(1)}%`, change: stats.ai_score_change, icon: Code2, color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
    { name: 'Security Issues', value: stats.security_issues, change: stats.security_issues_change, icon: ShieldAlert, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
    { name: 'Bugs Found', value: stats.bugs_found, change: stats.bugs_found_change, icon: Bug, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
    { name: 'Performance Issues', value: stats.performance_issues, change: stats.performance_issues_change, icon: Zap, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Review Dashboard</h1>
            <p className="text-gray-400 text-xs mt-1">Real-time code health statistics, AI insights, and workspace activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardData}
              className="p-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button 
              onClick={() => router.push('/new-review')}
              className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#7C3AED]/20"
            >
              <Plus className="h-4 w-4" />
              New Review
            </button>
          </div>
        </div>

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {cardMetrics.map((card) => {
            const isNegative = card.change < 0;
            // Security or bugs decreasing is a positive metric
            const isGood = (card.name.includes('Security') || card.name.includes('Bugs') || card.name.includes('Performance')) ? isNegative : !isNegative;
            
            return (
              <div key={card.name} className="glass rounded-2xl p-5 hover:border-white/20 transition-all duration-250 flex flex-col justify-between group shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 ${card.bg} rounded-xl border border-white/5`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                    isGood ? 'bg-emerald-500/10 text-[#22C55E]' : 'bg-red-500/10 text-[#EF4444]'
                  }`}>
                    {isGood ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(card.change)}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-medium block">{card.name}</span>
                  <span className="text-2xl font-extrabold text-white mt-1 block tracking-tight group-hover:scale-102 transition-transform origin-left">{card.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Quality & Debt Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass rounded-2xl p-5 border border-white/5 hover:border-[#22C55E]/30 transition-all duration-200">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">Security Score</span>
            <span className="text-xl font-black text-emerald-400 block">{stats.security_score || 94.2}%</span>
            <span className="text-[9px] text-gray-600 block mt-1">OWASP Top 10 compliance rating</span>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/5 hover:border-[#7C3AED]/30 transition-all duration-200">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">Maintainability Index</span>
            <span className="text-xl font-black text-indigo-400 block">{stats.maintainability_index || 85.5}/100</span>
            <span className="text-[9px] text-gray-600 block mt-1">Clean code and styling index</span>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/5 hover:border-[#EF4444]/30 transition-all duration-200">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">Technical Debt</span>
            <span className="text-xl font-black text-red-400 block">{stats.technical_debt_hours || 36.5} hrs</span>
            <span className="text-[9px] text-gray-600 block mt-1">Estimated remediation effort</span>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/5 hover:border-[#06B6D4]/30 transition-all duration-200">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1">Complexity & Coverage</span>
            <span className="text-xl font-black text-cyan-400 block">McCabes: {stats.cyclomatic_complexity || 12} | Cov: {stats.coverage_percentage || 78.4}%</span>
            <span className="text-[9px] text-gray-600 block mt-1">Cyclomatic complexity & test coverage</span>
          </div>
        </div>

        {/* Charts & Graphs Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-white">AI Quality Trend</h3>
                <p className="text-gray-400 text-xs">Review score fluctuations and code commits health</p>
              </div>
              <span className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-gray-300">Weekly</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="label" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} domain={[60, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#FFF', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="reviews" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart Language Distribution */}
          <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col">
            <div className="mb-4">
              <h3 className="font-bold text-base text-white">Language Analytics</h3>
              <p className="text-gray-400 text-xs">Distribution of codebase types analyzed</p>
            </div>
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={languages}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="percentage"
                  >
                    {languages.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-white">{languages.length}</span>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Languages</span>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-auto space-y-2">
              {languages.map((lang: any) => (
                <div key={lang.language} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                    <span className="font-medium text-gray-300">{lang.language}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-semibold">{lang.count} files</span>
                    <span className="text-white font-bold">{lang.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Reviews & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reviews List */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-white">Recent Reviews</h3>
                <p className="text-gray-400 text-xs">Recently run security and quality reviews</p>
              </div>
            </div>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">No reviews found. Click "New Review" to start!</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div 
                    key={rev.id}
                    onClick={() => router.push(`/review/${rev.id}`)}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 rounded-xl">
                        <Code2 className="h-5 w-5 text-[#7C3AED]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-[#7C3AED] transition-colors">{rev.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                          <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded text-gray-300 capitalize font-medium">{rev.branch || 'main'}</span>
                          <span>•</span>
                          <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        {rev.ai_score !== null ? (
                          <>
                            <span className="font-extrabold text-sm text-white">{rev.ai_score.toFixed(0)}</span>
                            <span className="text-[10px] text-gray-500 block">AI Score</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic capitalize">{rev.status.replace('_', ' ')}</span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => router.push('/new-review')}
                  className="flex items-center gap-3 p-3.5 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 rounded-2xl text-left transition-all"
                >
                  <Plus className="h-5 w-5 text-[#7C3AED]" />
                  <div>
                    <span className="font-bold text-xs text-white block">New Review</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Analyze files, paste code, upload projects</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-3 p-3.5 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 border border-[#2563EB]/20 rounded-2xl text-left transition-all"
                >
                  <FileText className="h-5 w-5 text-[#2563EB]" />
                  <div>
                    <span className="font-bold text-xs text-white block">Configure Keys</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Set up OpenAI keys and settings</span>
                  </div>
                </button>

                <button 
                  onClick={() => router.push('/teams')}
                  className="flex items-center gap-3 p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-left transition-all"
                >
                  <UserPlus className="h-5 w-5 text-[#22C55E]" />
                  <div>
                    <span className="font-bold text-xs text-white block">Invite Team</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Add colleagues and developers to team workspace</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Platform statistics footer */}
            <div className="pt-6 border-t border-white/5 text-center mt-6">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest block">CodeGuardian Enterprise Edition v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
