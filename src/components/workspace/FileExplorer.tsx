'use client';

import React, { useState } from 'react';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  FileText, FileCode, FileJson, Search, X
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedFile: string | null;
  onFileSelect: (path: string, name: string) => void;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  '.py':   <FileCode className="h-3.5 w-3.5 text-blue-400" />,
  '.ts':   <FileCode className="h-3.5 w-3.5 text-blue-500" />,
  '.tsx':  <FileCode className="h-3.5 w-3.5 text-cyan-400" />,
  '.js':   <FileCode className="h-3.5 w-3.5 text-yellow-400" />,
  '.jsx':  <FileCode className="h-3.5 w-3.5 text-yellow-300" />,
  '.json': <FileJson className="h-3.5 w-3.5 text-yellow-500" />,
  '.md':   <FileText className="h-3.5 w-3.5 text-gray-300" />,
  '.css':  <FileCode className="h-3.5 w-3.5 text-pink-400" />,
  '.html': <FileCode className="h-3.5 w-3.5 text-orange-400" />,
};

function getFileIcon(name: string) {
  const ext = name.substring(name.lastIndexOf('.'));
  return FILE_ICONS[ext] || <FileText className="h-3.5 w-3.5 text-gray-400" />;
}

function FileTreeNode({
  node, depth, selectedFile, onFileSelect, searchQuery
}: {
  node: FileNode;
  depth: number;
  selectedFile: string | null;
  onFileSelect: (path: string, name: string) => void;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedFile === node.path;
  const isDir = node.type === 'directory';

  // Filter by search
  if (searchQuery) {
    const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
    const childMatches = node.children?.some(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!matches && !childMatches) return null;
  }

  return (
    <div>
      <button
        onClick={() => {
          if (isDir) {
            setExpanded(!expanded);
          } else {
            onFileSelect(node.path, node.name);
          }
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] text-left text-[11px] rounded transition-all group ${
          isSelected
            ? 'bg-[#7C3AED]/20 text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {isDir ? (
          <>
            <span className="text-gray-500">
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
            {expanded
              ? <FolderOpen className="h-3.5 w-3.5 text-[#7C3AED]" />
              : <Folder className="h-3.5 w-3.5 text-[#7C3AED]/70" />
            }
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate font-mono">{node.name}</span>
      </button>

      {isDir && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-[#0D0D10] border-r border-white/[0.06]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Explorer</span>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
          <Search className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent text-[11px] text-gray-300 placeholder-gray-600 flex-1 outline-none min-w-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X className="h-3 w-3 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <Folder className="h-8 w-8 text-gray-700 mb-2" />
            <p className="text-[10px] text-gray-600">No files to display</p>
          </div>
        ) : (
          files.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              searchQuery={searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}
