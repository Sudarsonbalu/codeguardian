'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import { getApiUrl } from '../../utils/api';
import { 
  GitPullRequest, ExternalLink, Calendar, 
  CheckCircle2, AlertCircle, Clock, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function PullRequestsPage() {
  const { token } = useAuthStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPullRequests = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const res = await fetch(getApiUrl('/api/v1/reviews/'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPullRequests();
  }, [token]);

  // Seeded demo pull requests list if none exist
  const displayPRs = reviews.length > 0 
    ? reviews 
    : [
        {
          id: 101,
          title: "PR #14: Implement Stripe payment verification webhook secure checks",
          branch: "feature/stripe-webhooks",
          commit_hash: "a8e9102c",
          pull_request_id: "14",
          status: "completed",
          ai_score: 92,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 102,
          title: "PR #15: Fix SQL Injection in user validation logs query",
          branch: "bugfix/sql-inject-fix",
          commit_hash: "82f81a3d",
          pull_request_id: "15",
          status: "completed",
          ai_score: 88,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Pull Requests</h1>
            <p className="text-gray-400 text-xs mt-1">Review active code merge requests, verify branch analysis, and inspect security thresholds.</p>
          </div>
        </div>

        {/* PR list grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPRs.map((pr) => {
              const score = pr.ai_score || 0;
              const hasAlerts = score < 85;

              return (
                <div 
                  key={pr.id} 
                  className="glass rounded-3xl p-5 border border-white/5 hover:border-[#7C3AED]/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#7C3AED]/10 rounded-2xl border border-[#7C3AED]/20 text-[#7C3AED] mt-1 md:mt-0">
                      <GitPullRequest className="h-5 w-5" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        {pr.title}
                        {pr.pull_request_id && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                            PR #{pr.pull_request_id}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono">
                        {pr.branch} &rarr; <span className="text-gray-400">main</span>
                      </p>
                      
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(pr.created_at).toLocaleDateString()}
                        </span>
                        <span>Commit: <span className="font-mono text-gray-400">{pr.commit_hash?.slice(0, 7) || 'N/A'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* PR analysis score rating and review redirection */}
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-white/5 pt-3 md:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block uppercase font-bold">AI Score</span>
                        <span className={`text-xs font-black block mt-0.5 ${
                          score >= 90 ? 'text-emerald-500' : score >= 80 ? 'text-[#7C3AED]' : 'text-red-500'
                        }`}>
                          {score ? `${score}/100` : 'Pending'}
                        </span>
                      </div>
                      
                      {score ? (
                        score >= 85 ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="h-5 w-5 text-red-500" />
                        )
                      ) : (
                        <Clock className="h-5 w-5 text-gray-500" />
                      )}
                    </div>

                    <Link 
                      href={`/review/${pr.id}`}
                      className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold px-4 py-2.5 rounded-xl transition-all text-white"
                    >
                      View Review
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
