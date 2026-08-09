'use client';

import React from 'react';
import { ChevronRight, GitBranch, GitCommit, Shield } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbProps {
  reviewTitle: string;
  selectedFile?: string | null;
  branch?: string | null;
  commitHash?: string | null;
  aiScore?: number | null;
  status?: string;
}

export default function Breadcrumb({
  reviewTitle, selectedFile, branch, commitHash, aiScore, status
}: BreadcrumbProps) {
  const scoreColor = aiScore
    ? aiScore >= 90 ? 'text-emerald-400' : aiScore >= 75 ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-500';

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[#0D0D10] border-b border-white/[0.06] flex-shrink-0">
      {/* Left: breadcrumb path */}
      <div className="flex items-center gap-1 text-[10px] font-mono overflow-hidden">
        <Link href="/reviews" className="text-gray-600 hover:text-gray-400 transition-colors whitespace-nowrap">Reviews</Link>
        <ChevronRight className="h-3 w-3 text-gray-700 flex-shrink-0" />
        <span className="text-gray-400 truncate max-w-[200px]">{reviewTitle}</span>
        {selectedFile && (
          <>
            <ChevronRight className="h-3 w-3 text-gray-700 flex-shrink-0" />
            <span className="text-white truncate max-w-[150px]">{selectedFile}</span>
          </>
        )}
      </div>

      {/* Right: metadata badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {branch && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.07] rounded-md">
            <GitBranch className="h-2.5 w-2.5 text-[#7C3AED]" />
            <span className="text-[9px] text-gray-400 font-mono">{branch}</span>
          </div>
        )}
        {commitHash && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.07] rounded-md">
            <GitCommit className="h-2.5 w-2.5 text-gray-500" />
            <span className="text-[9px] text-gray-500 font-mono">{commitHash.slice(0, 7)}</span>
          </div>
        )}
        {aiScore !== null && aiScore !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
            aiScore >= 90 ? 'bg-emerald-500/10 border-emerald-500/20' :
            aiScore >= 75 ? 'bg-yellow-500/10 border-yellow-500/20' :
            'bg-red-500/10 border-red-500/20'
          }`}>
            <Shield className={`h-2.5 w-2.5 ${scoreColor}`} />
            <span className={`text-[9px] font-black ${scoreColor}`}>{aiScore}/100</span>
          </div>
        )}
        {status && (
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
            status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
            'bg-[#7C3AED]/10 text-[#A78BFA] border border-[#7C3AED]/20'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
