'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Plus, X, Trash2 } from 'lucide-react';
import { getWsUrl } from '../../utils/api';

interface TerminalTab {
  id: string;
  name: string;
  history: string[];
  currentInput: string;
  ws: WebSocket | null;
  historyIndex: number;
  commandHistory: string[];
}

export default function TerminalPanel() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    {
      id: 'tab-1',
      name: 'PowerShell 1',
      history: ['CodeGuardian Enterprise Terminal initialized.\r\nType commands below. Support for PowerShell / CMD.\r\n\r\n'],
      currentInput: '',
      ws: null,
      historyIndex: -1,
      commandHistory: [],
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const outputEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize WebSocket for a tab
  const initWebSocket = (tabId: string) => {
    const wsUrl = getWsUrl(`/terminal/ws/${tabId}`);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === tabId) {
            // Append incoming stream
            return {
              ...t,
              history: [...t.history, event.data],
            };
          }
          return t;
        })
      );
    };

    socket.onclose = () => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === tabId) {
            return {
              ...t,
              history: [...t.history, '\r\nSession disconnected.\r\n'],
              ws: null,
            };
          }
          return t;
        })
      );
    };

    socket.onerror = () => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === tabId) {
            return {
              ...t,
              history: [...t.history, '\r\nConnection error.\r\n'],
            };
          }
          return t;
        })
      );
    };

    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === tabId ? { ...t, ws: socket } : t))
    );
  };

  // Start socket on active tab change or startup
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && !activeTab.ws) {
      initWebSocket(activeTabId);
    }
  }, [activeTabId]);

  // Clean up sockets on unmount
  useEffect(() => {
    return () => {
      tabs.forEach((t) => {
        if (t.ws) t.ws.close();
      });
    };
  }, []);

  // Auto-scroll terminal on content update
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeTab) return;

    if (e.key === 'Enter') {
      const command = activeTab.currentInput.trim();
      if (!command) {
        if (activeTab.ws && activeTab.ws.readyState === WebSocket.OPEN) {
          activeTab.ws.send('\r\n');
        }
        return;
      }

      // Handle local commands
      if (command.toLowerCase() === 'clear' || command.toLowerCase() === 'cls') {
        setTabs((prevTabs) =>
          prevTabs.map((t) =>
            t.id === activeTabId
              ? { ...t, history: [], currentInput: '', historyIndex: -1 }
              : t
          )
        );
        return;
      }

      // Send to backend shell
      if (activeTab.ws && activeTab.ws.readyState === WebSocket.OPEN) {
        activeTab.ws.send(command + '\r\n');
      }

      // Update tab command histories
      const updatedCommandHistory = [...activeTab.commandHistory, command];

      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                commandHistory: updatedCommandHistory,
                currentInput: '',
                historyIndex: -1,
              }
            : t
        )
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeTab.commandHistory.length === 0) return;
      const nextIndex = activeTab.historyIndex === -1
        ? activeTab.commandHistory.length - 1
        : Math.max(0, activeTab.historyIndex - 1);

      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                currentInput: t.commandHistory[nextIndex],
                historyIndex: nextIndex,
              }
            : t
        )
      );
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeTab.commandHistory.length === 0 || activeTab.historyIndex === -1) return;
      const nextIndex = activeTab.historyIndex + 1;
      const hasFinished = nextIndex >= activeTab.commandHistory.length;

      setTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                currentInput: hasFinished ? '' : t.commandHistory[nextIndex],
                historyIndex: hasFinished ? -1 : nextIndex,
              }
            : t
        )
      );
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === activeTabId ? { ...t, currentInput: value } : t))
    );
  };

  const createTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: TerminalTab = {
      id: newId,
      name: `PowerShell ${tabs.length + 1}`,
      history: ['CodeGuardian Enterprise Terminal session initialized.\r\n\r\n'],
      currentInput: '',
      ws: null,
      historyIndex: -1,
      commandHistory: [],
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const tabToClose = tabs.find((t) => t.id === id);
    if (tabToClose && tabToClose.ws) {
      tabToClose.ws.close();
    }
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0C] border border-white/[0.04] rounded-xl overflow-hidden font-mono text-xs">
      {/* Terminal tabs */}
      <div className="flex items-center gap-1 bg-black/30 border-b border-white/[0.04] px-3 py-1.5 flex-shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto flex-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer border transition-all ${
                activeTabId === tab.id
                  ? 'bg-white/5 border-white/10 text-white font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Terminal className="h-3 w-3 text-indigo-400" />
              <span>{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={createTab}
          className="p-1 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center justify-center"
          title="Open new shell tab"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Terminal logs content */}
      <div
        className="flex-1 p-3 overflow-y-auto space-y-1 select-text bg-[#09090B] font-mono leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="whitespace-pre-wrap text-gray-300">
          {activeTab ? activeTab.history.join('') : ''}
        </div>
        <div ref={outputEndRef} />
      </div>

      {/* Interactive command input */}
      <div className="flex items-center bg-[#09090B] border-t border-white/[0.04] px-3 py-2 flex-shrink-0">
        <span className="text-[#A78BFA] font-bold mr-2 select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={activeTab ? activeTab.currentInput : ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder:text-gray-700"
          placeholder="Type shell commands here..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
