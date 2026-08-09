import React from 'react';
import { X } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  paletteSearch: string;
  setPaletteSearch: (val: string) => void;
  filteredPalette: { label: string; action: () => void }[];
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  paletteSearch,
  setPaletteSearch,
  filteredPalette
}: CommandPaletteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-[#09090B] border border-white/10 rounded-2xl p-4 z-10 shadow-2xl space-y-3 font-mono text-xs">
        <input
          type="text"
          autoFocus
          placeholder="Search commands..."
          value={paletteSearch}
          onChange={e => setPaletteSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
        />
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {filteredPalette.length === 0 ? (
            <div className="text-gray-500 p-2 text-center">No commands match your query</div>
          ) : (
            filteredPalette.map((o, idx) => (
              <button
                key={idx}
                onClick={() => { o.action(); onClose(); }}
                className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-xl text-gray-300 hover:text-white transition-all"
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-[#09090B] border border-white/10 rounded-2xl p-5 z-10 shadow-2xl space-y-4 font-mono text-xs text-gray-300">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <span className="font-extrabold text-white">Keyboard Shortcuts</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Open Command Palette</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/5 shadow">Ctrl+P</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Toggle Zen Mode</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/5 shadow">Ctrl+Z</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Toggle Split View</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/5 shadow">Ctrl+\</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Search & Replace</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white border border-white/5 shadow">Ctrl+F</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
