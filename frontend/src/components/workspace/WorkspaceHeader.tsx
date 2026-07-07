import React from 'react';
import { 
  Sparkles, Loader2, Search, Split, Palette, 
  ZoomIn, ZoomOut, Keyboard, Eye
} from 'lucide-react';

interface ScanningBannerProps {
  isScanning: boolean;
  zenMode: boolean;
  displayProgress: number;
  displayMessage: string;
}

export function ScanningBanner({
  isScanning,
  zenMode,
  displayProgress,
  displayMessage
}: ScanningBannerProps) {
  if (!isScanning || zenMode) return null;

  return (
    <div className="glass border border-[#7C3AED]/20 rounded-2xl p-4 bg-[#7C3AED]/5 relative overflow-hidden animate-pulse">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#7C3AED] animate-spin" />
          AI Code Review Executing
        </span>
        <span className="text-xs text-white font-bold">{displayProgress}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div 
          className="bg-gradient-to-r from-[#7C3AED] to-[#2563EB] h-1.5 rounded-full transition-all duration-500" 
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-2 italic font-semibold">{displayMessage}</p>
    </div>
  );
}

interface WorkspaceToolbarProps {
  issuesCount: number;
  zenMode: boolean;
  isFixingAll: boolean;
  handleFixAll: () => void;
  showSearchReplace: boolean;
  setShowSearchReplace: (val: boolean) => void;
  isSplit: boolean;
  setIsSplit: (val: boolean) => void;
  setShowPalette: (val: boolean) => void;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  editorTheme: string;
  setEditorTheme: (val: string) => void;
  setShowShortcuts: (val: boolean) => void;
  setZenMode: (val: boolean) => void;
}

export function WorkspaceToolbar({
  issuesCount,
  zenMode,
  isFixingAll,
  handleFixAll,
  showSearchReplace,
  setShowSearchReplace,
  isSplit,
  setIsSplit,
  setShowPalette,
  fontSize,
  setFontSize,
  editorTheme,
  setEditorTheme,
  setShowShortcuts,
  setZenMode
}: WorkspaceToolbarProps) {
  return (
    <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between bg-black/10 flex-shrink-0 gap-2 select-none font-mono text-[10px]">
      <div className="flex gap-2 items-center">
        {issuesCount > 0 && !zenMode && (
          <button
            onClick={handleFixAll}
            disabled={isFixingAll}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg text-[10px] font-bold text-emerald-400 transition-all disabled:opacity-40"
          >
            {isFixingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Fix All
          </button>
        )}
        
        {/* Search & Replace trigger */}
        <button
          onClick={() => setShowSearchReplace(!showSearchReplace)}
          className={`p-1 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded text-gray-400 hover:text-white transition-all`}
          title="Search & Replace"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Split view trigger */}
        <button
          onClick={() => setIsSplit(!isSplit)}
          className={`p-1 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded text-gray-400 hover:text-white transition-all`}
          title="Split Editor layout"
        >
          <Split className="h-3.5 w-3.5" />
        </button>

        {/* Command palette trigger */}
        <button
          onClick={() => setShowPalette(true)}
          className="p-1 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded text-gray-400 hover:text-white transition-all"
          title="Open Command Palette"
        >
          <Palette className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Font controls, theme, shortcuts, save */}
      <div className="flex gap-1.5 items-center">
        <button onClick={() => setFontSize(prev => Math.max(10, prev - 1))} className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"><ZoomOut className="h-3 w-3" /></button>
        <span className="text-[9px] font-mono text-gray-500">{fontSize}px</span>
        <button onClick={() => setFontSize(prev => Math.min(24, prev + 1))} className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"><ZoomIn className="h-3 w-3" /></button>

        <select 
          value={editorTheme}
          onChange={e => setEditorTheme(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[9px] font-bold text-gray-300 focus:outline-none"
        >
          <option value="vs-dark" className="bg-[#09090B]">VS Dark</option>
          <option value="light" className="bg-[#09090B]">VS Light</option>
          <option value="cyberpunk" className="bg-[#09090B]">Cyberpunk</option>
        </select>

        <button
          onClick={() => setShowShortcuts(true)}
          className="p-1 hover:bg-white/5 text-gray-500 hover:text-white rounded"
          title="Keybind Shortcuts"
        >
          <Keyboard className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => setZenMode(!zenMode)}
          className={`p-1 rounded ${zenMode ? 'bg-[#7C3AED]/20 text-[#A78BFA]' : 'text-gray-500 hover:text-white'}`}
          title="Zen Focus Mode"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
