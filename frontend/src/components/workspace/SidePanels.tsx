import React, { useState, useEffect } from 'react';
import { 
  GitBranch, Check, Plus, RefreshCw, Play, Circle, 
  Terminal, ShieldCheck, HelpCircle, Layers, Settings2, Boxes
} from 'lucide-react';
import { extensionSystem } from '../../utils/extensionSystem';

// --- EXTENSIONS SIDE PANEL ---
export function ExtensionsSidePanel({ monaco, editor, onThemeChange }: { monaco: any; editor: any; onThemeChange?: (theme: string) => void }) {
  const [extensions, setExtensions] = useState<any[]>([]);

  useEffect(() => {
    setExtensions(extensionSystem.getExtensions());
  }, []);

  const handleToggle = (id: string) => {
    if (extensionSystem.isEnabled(id)) {
      extensionSystem.disableExtension(id);
    } else {
      extensionSystem.enableExtension(id, monaco, editor);
      // Auto-switch theme if a theme was enabled
      if (id.startsWith('theme-')) {
        const themeName = id.replace('theme-', '');
        if (onThemeChange) onThemeChange(themeName);
      }
    }
    // Re-trigger re-render
    setExtensions(extensionSystem.getExtensions());
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D10] text-gray-300 font-mono text-xs select-none">
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5" /> Marketplace Plugins
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {extensions.map(ext => {
          const isEnabled = extensionSystem.isEnabled(ext.id);
          return (
            <div key={ext.id} className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="font-extrabold text-white text-[11px] truncate w-32">{ext.name}</span>
                <button
                  onClick={() => handleToggle(ext.id)}
                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border transition-all ${
                    isEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                  }`}
                >
                  {isEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed">{ext.description}</p>
              <div className="flex gap-2">
                <span className="text-[8px] px-1.5 py-0.2 bg-white/5 text-gray-400 rounded-md font-extrabold uppercase">{ext.category}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- GIT PANEL ---
export function GitSidePanel() {
  const [commitMsg, setCommitMsg] = useState('');
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState('main');

  const modifiedFiles = [
    'src/main.py',
    'tests/test_main.py',
    'requirements.txt'
  ];

  const handleStage = (file: string) => {
    if (stagedFiles.includes(file)) {
      setStagedFiles(stagedFiles.filter(f => f !== file));
    } else {
      setStagedFiles([...stagedFiles, file]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D10] text-gray-300 font-mono text-xs select-none">
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" /> Source Control
        </span>
        <span className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-white font-extrabold">{currentBranch}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Commit form */}
        <div className="space-y-2">
          <textarea
            placeholder="Commit message... (Ctrl+Enter)"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            className="w-full h-16 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-[10px] text-white focus:outline-none placeholder-gray-600 resize-none"
          />
          <button
            onClick={() => {
              if (!commitMsg) return;
              alert(`Committed staged modifications as: "${commitMsg}"`);
              setCommitMsg('');
              setStagedFiles([]);
            }}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl transition-all"
          >
            Commit to {currentBranch}
          </button>
        </div>

        {/* Changes lists */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Changes</span>
            {modifiedFiles.map(file => {
              const isStaged = stagedFiles.includes(file);
              return (
                <div key={file} className="flex justify-between items-center py-1 hover:bg-white/5 px-1.5 rounded">
                  <span className="text-[10px] truncate w-36">{file}</span>
                  <button onClick={() => handleStage(file)}>
                    {isStaged ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-gray-600 hover:text-white" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DEBUG PANEL ---
export function DebugSidePanel({ editorRef }: { editorRef: any }) {
  const [breakpoints, setBreakpoints] = useState<number[]>([12, 24]);
  const [watchExpr, setWatchExpr] = useState<string[]>(['self.token', 'user.email']);
  const [newWatch, setNewWatch] = useState('');
  const [isDebugRunning, setIsDebugRunning] = useState(false);

  const variables = [
    { name: 'self', value: 'WorkspaceContext' },
    { name: 'user_id', value: '45' },
    { name: 'token', value: '"eyJhbGciOi..."' },
    { name: 'session_active', value: 'true' }
  ];

  const callStack = [
    { func: 'validate_session', line: 24, file: 'main.py' },
    { func: 'handle_request', line: 112, file: 'router.py' },
    { func: 'dispatch', line: 402, file: 'orchestrator.py' }
  ];

  const handleAddWatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWatch) {
      setWatchExpr([...watchExpr, newWatch]);
      setNewWatch('');
    }
  };

  const handleLaunchDebug = () => {
    setIsDebugRunning(true);
    alert("Debugger attached successfully! Simulation running on backend environment...");
    setTimeout(() => {
      setIsDebugRunning(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D10] text-gray-300 font-mono text-xs select-none">
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
          <Play className="h-3.5 w-3.5" /> Debug Workspace
        </span>
        <button
          onClick={handleLaunchDebug}
          disabled={isDebugRunning}
          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border flex items-center gap-1 transition-all ${
            isDebugRunning 
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              : 'bg-indigo-600/10 border-indigo-600/35 text-indigo-400 hover:bg-indigo-600/25'
          }`}
        >
          {isDebugRunning ? 'Running' : 'Launch'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Watch Expressions */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Watch Expressions</span>
          <form onSubmit={handleAddWatch} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Add watch..."
              value={newWatch}
              onChange={e => setNewWatch(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none"
            />
          </form>
          <div className="space-y-1">
            {watchExpr.map((expr, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] text-gray-400">
                <span>{expr}</span>
                <span className="text-gray-600">undefined</span>
              </div>
            ))}
          </div>
        </div>

        {/* Variables Scope */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Variables (Local Scope)</span>
          <div className="space-y-1">
            {variables.map(v => (
              <div key={v.name} className="flex justify-between items-center text-[10px]">
                <span className="text-indigo-400">{v.name}</span>
                <span className="text-gray-400 text-right truncate w-24">{v.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakpoints */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Breakpoints</span>
          <div className="space-y-1">
            {breakpoints.map(bp => (
              <div key={bp} className="flex items-center gap-2 text-[10px] text-gray-400">
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                <span>Line {bp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Stack */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Call Stack</span>
          <div className="space-y-1">
            {callStack.map((stack, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9px] text-gray-500">
                <span className="text-gray-400">{stack.func}()</span>
                <span>{stack.file}:{stack.line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
