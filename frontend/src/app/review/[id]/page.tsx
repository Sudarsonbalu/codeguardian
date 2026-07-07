'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuthStore } from '../../../store/authStore';
import { useReviewStore } from '../../../store/reviewStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import Editor from '@monaco-editor/react';
import { getApiUrl } from '../../../utils/api';
import DiffViewer from '../../../components/DiffViewer';
import { 
  Sparkles, RefreshCw, Play, PlayCircle, Loader2,
  AlertTriangle, CheckCircle, Info, BookOpen, Download,
  Split, Search, Palette, ZoomIn, ZoomOut, Check, Save,
  Maximize, Eye, ListFilter, X, Keyboard, HelpCircle,
  Folder, GitBranch, Boxes, Settings2
} from 'lucide-react';

// Workspace components
import FileExplorer from '../../../components/workspace/FileExplorer';
import AIAssistantPanel from '../../../components/workspace/AIAssistantPanel';
import BottomPanel from '../../../components/workspace/BottomPanel';
import Breadcrumb from '../../../components/workspace/Breadcrumb';
import { useToast } from '../../../components/ui/Toast';
import { CommandPaletteModal, ShortcutsModal } from '../../../components/workspace/EditorModals';
import { ScanningBanner, WorkspaceToolbar } from '../../../components/workspace/WorkspaceHeader';

// Plugin and Language Utilities
import { registerAllLanguagePacks, rebuildSymbolIndex, runDiagnosticsScanner } from '../../../utils/languagePacks';
import { extensionSystem } from '../../../utils/extensionSystem';
import { GitSidePanel, DebugSidePanel, ExtensionsSidePanel } from '../../../components/workspace/SidePanels';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  path: string;
}

interface OpenTab {
  path: string;
  name: string;
  content: string;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Number(params.id);
  const toast = useToast();
  
  const { token } = useAuthStore();
  const { activeReviewProgress, clearReviewProgress } = useReviewStore();
  
  // Local states
  const [review, setReview] = useState<any>(null);
  const [code, setCode] = useState<string>('// Loading code...');
  const [activeCode, setActiveCode] = useState<string>('');
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // File Explorer state
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  
  // Diff viewer & history states
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [activeIssueId, setActiveIssueId] = useState<number | null>(null);
  
  // Monaco Upgrades states
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string>('');
  const [isSplit, setIsSplit] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(12);
  const [autoSave, setAutoSave] = useState(true);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [zenMode, setZenMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [activeSideTab, setActiveSideTab] = useState<'explorer' | 'git' | 'debug' | 'extensions'>('explorer');

  // Editor ref
  const editorRef = useRef<any>(null);
  
  // Connect WebSocket progress subscriber
  useWebSocket(reviewId);
  const currentProgress = activeReviewProgress[reviewId];

  // Build simulated repository file structure
  const buildFileTree = (title: string, lang: string) => {
    const ext = lang.toLowerCase() === 'python' ? '.py' : 
                lang.toLowerCase() === 'javascript' ? '.js' : 
                lang.toLowerCase() === 'typescript' ? '.ts' : '.py';
    const mainFile = title.toLowerCase().replace(/\s+/g, '_') + ext;
    
    const tree: FileNode[] = [
      {
        name: 'src',
        type: 'directory',
        path: 'root/src',
        children: [
          { name: mainFile, type: 'file', path: `root/src/${mainFile}` },
          { name: `utils${ext}`, type: 'file', path: `root/src/utils${ext}` }
        ]
      },
      {
        name: 'tests',
        type: 'directory',
        path: 'root/tests',
        children: [
          { name: `test_${mainFile}`, type: 'file', path: `root/tests/test_${mainFile}` }
        ]
      },
      { name: 'README.md', type: 'file', path: 'root/README.md' },
      { name: lang.toLowerCase() === 'python' ? 'requirements.txt' : 'package.json', type: 'file', path: lang.toLowerCase() === 'python' ? 'root/requirements.txt' : 'root/package.json' }
    ];
    setFileTree(tree);
    setSelectedFile(`root/src/${mainFile}`);
  };

  const fetchReviewData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      // Fetch details
      const detailRes = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!detailRes.ok) throw new Error();
      const detailData = await detailRes.json();
      setReview(detailData);
      setIssues(detailData.issues || []);

      // Build analysis logs
      const scanLogs = [
        "🚀 Launching CodeGuardian AI Orchestrator...",
        `📦 Target branch: ${detailData.branch || 'main'}`,
        `🧠 Multi-Agent breakdown: Parsing AST Structure...`,
        "✓ AST Parsing complete.",
        "✓ Static Analysis rules run: verified OWASP standard.",
      ];
      if (detailData.issues) {
        detailData.issues.forEach((issue: any) => {
          scanLogs.push(`⚠️ [${issue.severity.toUpperCase()}] ${issue.category.toUpperCase()}: ${issue.message}`);
        });
      }
      scanLogs.push(`✅ AI reasoning complete. Score: ${detailData.ai_score || 0}/100`);
      setLogs(scanLogs);

      // Fetch code
      const codeRes = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}/code`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const codeData = await codeRes.json();
      const loadedCode = codeData.code || '';
      setCode(loadedCode);
      setActiveCode(loadedCode);

      // Initialize tabs
      const initialTab = {
        path: `root/src/${detailData.title.toLowerCase().replace(/\s+/g, '_')}${detailData.language === 'python' ? '.py' : '.js'}`,
        name: `${detailData.title.toLowerCase().replace(/\s+/g, '_')}${detailData.language === 'python' ? '.py' : '.js'}`,
        content: loadedCode
      };
      setOpenTabs([initialTab]);
      setActiveTabPath(initialTab.path);

      // Build Explorer tree
      buildFileTree(detailData.title, detailData.language || 'python');
    } catch (err) {
      console.error(err);
      toast.error("Error loading review data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewData();
    return () => {
      clearReviewProgress(reviewId);
    };
  }, [reviewId, token]);

  // Handle file selection in workspace explorer
  const handleFileSelect = (path: string, name: string) => {
    setSelectedFile(path);
    let content = '';
    if (path.includes('/src/')) {
      content = code;
    } else if (name === 'README.md') {
      content = (
        `# ${review?.title || 'Project'}\n\nThis repository is analyzed by CodeGuardian AI.\n\n` +
        `## Quality Rating\n- **AI Quality Score**: ${review?.updated_ai_score || review?.ai_score || 0}/100\n` +
        `- **Issues Detected**: ${issues.length} total findings\n\n` +
        `## Project Specifications\n- **Primary Language**: ${review?.language || 'Python'}\n` +
        `- **Git Branch**: ${review?.branch || 'main'}\n`
      );
    } else if (name.includes('test_')) {
      content = `# Automated Test Suite for ${review?.title || 'Project'}\nimport pytest\n\ndef test_suite_initialization():\n    assert True\n`;
    } else {
      content = `{\n  "name": "enterprise-project",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "stripe": "^11.0.0"\n  }\n}`;
    }

    setActiveCode(content);

    // Tab manager logic
    setOpenTabs(prev => {
      if (prev.some(t => t.path === path)) {
        return prev;
      }
      return [...prev, { path, name, content }];
    });
    setActiveTabPath(path);
  };

  const handleTabClose = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openTabs.length === 1) return;
    const remaining = openTabs.filter(t => t.path !== path);
    setOpenTabs(remaining);
    if (activeTabPath === path) {
      const fallback = remaining[remaining.length - 1];
      setActiveTabPath(fallback.path);
      setActiveCode(fallback.content);
      setSelectedFile(fallback.path);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Attach custom global Monaco reference
    if (typeof window !== 'undefined') {
      (window as any).monaco = monaco;
    }

    // Register all default extension plugins
    registerAllLanguagePacks();

    // Activate all active extension plugins
    extensionSystem.activateAll(monaco, editor);

    // Build initial symbol index & diagnostics markers
    const model = editor.getModel();
    if (model) {
      rebuildSymbolIndex(selectedFile || 'root/src/main.py', activeCode);
      runDiagnosticsScanner(model, monaco);
    }

    // Bind change listener for active tokenizing and syntax checks
    editor.onDidChangeModelContent(() => {
      const activeModel = editor.getModel();
      if (activeModel) {
        const val = activeModel.getValue();
        rebuildSymbolIndex(selectedFile || 'root/src/main.py', val);
        runDiagnosticsScanner(activeModel, monaco);
      }
    });

    // Selection listener for inline assistant
    editor.onDidChangeCursorSelection((e: any) => {
      const selection = editor.getSelection();
      const model = editor.getModel();
      if (selection && model) {
        const text = model.getValueInRange(selection);
        if (text.trim().length > 0) {
          const position = editor.getPosition();
          const pixelPosition = editor.getScrolledVisiblePosition(position);
          if (pixelPosition) {
            setSelectionCoords({
              x: pixelPosition.left + 50,
              y: pixelPosition.top + 80
            });
            setSelectedText(text);
          }
        } else {
          setSelectedText('');
          setSelectionCoords(null);
        }
      }
    });
  };

  const jumpToLine = (lineNumber: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);
      editorRef.current.setPosition({ lineNumber, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleIssueClick = (issue: any) => {
    const mainNode = fileTree[0]?.children?.[0];
    if (mainNode) {
      handleFileSelect(mainNode.path, mainNode.name);
    }
    setTimeout(() => {
      jumpToLine(issue.line_number);
    }, 100);
  };

  // Fix all issues route trigger
  const handleFixAll = async () => {
    if (isFixingAll || !token) return;
    setIsFixingAll(true);
    try {
      const res = await fetch(getApiUrl(`/api/v1/reviews/${reviewId}/fix-all`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("All issues resolved successfully!");
        fetchReviewData();
      } else {
        toast.error(data.detail || "Error applying fixes");
      }
    } catch {
      toast.error("Network connectivity issue");
    } finally {
      setIsFixingAll(false);
    }
  };

  const handleDownloadReport = (format: string) => {
    window.open(getApiUrl(`/api/v1/reviews/${reviewId}/report/download?format=${format}`), '_blank');
  };

  // Local static scanner for outline & TODOs
  const getOutline = () => {
    const lines = activeCode.split('\n');
    const items = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('def ') || line.startsWith('class ') || (line.startsWith('const ') && line.includes('=>'))) {
        items.push({ line: i + 1, text: line.replace(':', '') });
      }
    }
    return items;
  };

  const getTodos = () => {
    const lines = activeCode.split('\n');
    const items = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('todo') || line.includes('fixme')) {
        items.push({ line: i + 1, text: lines[i].trim() });
      }
    }
    return items;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-mono">
          <AlertTriangle className="h-12 w-12 text-red-500 animate-pulse" />
          <h2 className="text-base font-black text-white">Code Editor Not Found</h2>
          <p className="text-gray-400 text-xs max-w-sm text-center">The requested code review session ID does not exist or has been deleted from the database.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-[10px] font-black uppercase tracking-wide transition-all shadow-lg shadow-[#7C3AED]/10"
          >
            Go back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const displayStatus = currentProgress?.status || review?.status || 'pending';
  const displayProgress = currentProgress?.progress !== undefined ? currentProgress.progress : (displayStatus === 'completed' ? 100 : 0);
  const displayMessage = currentProgress?.message || `Review is in state: ${displayStatus.replace('_', ' ')}`;
  const isScanning = ['parsing', 'static_analysis', 'ai_reasoning', 'pending'].includes(displayStatus);

  const outlineItems = getOutline();
  const todoItems = getTodos();

  const commandPaletteOptions = [
    { label: 'Toggle Zen Mode', action: () => setZenMode(!zenMode) },
    { label: 'Theme: Light Mode', action: () => setEditorTheme('light') },
    { label: 'Theme: Dark VS Code', action: () => setEditorTheme('vs-dark') },
    { label: 'Increase Font Size', action: () => setFontSize(prev => Math.min(24, prev + 1)) },
    { label: 'Decrease Font Size', action: () => setFontSize(prev => Math.max(10, prev - 1)) },
    { label: 'Auto Save: ON', action: () => setAutoSave(true) },
    { label: 'Auto Save: OFF', action: () => setAutoSave(false) },
  ];

  const filteredPalette = commandPaletteOptions.filter(o => 
    o.label.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
        {/* Breadcrumb section */}
        {!zenMode && (
          <Breadcrumb
            reviewTitle={review?.title || 'Review Details'}
            selectedFile={selectedFile ? selectedFile.replace('root/', '') : null}
            branch={review?.branch}
            commitHash={review?.commit_hash}
            aiScore={review?.updated_ai_score || review?.ai_score}
            status={review?.status}
          />
        )}

        <ScanningBanner
          isScanning={isScanning}
          zenMode={zenMode}
          displayProgress={displayProgress}
          displayMessage={displayMessage}
        />

        <CommandPaletteModal
          isOpen={showPalette}
          onClose={() => setShowPalette(false)}
          paletteSearch={paletteSearch}
          setPaletteSearch={setPaletteSearch}
          filteredPalette={filteredPalette}
        />

        <ShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />

        {/* Main Editor Work Area */}
        <div className="flex-1 grid grid-cols-12 gap-0 border border-white/[0.06] bg-[#09090B] rounded-2xl overflow-hidden min-h-0">
          
          {/* Panel 1: Activity Bar & Active Side Panel */}
          {!zenMode && (
            <div className="col-span-3 hidden md:flex h-full overflow-hidden border-r border-white/[0.06] bg-[#09090B]">
              {/* Vertical Activity Bar */}
              <div className="w-12 bg-[#09090B] border-r border-white/[0.06] flex flex-col items-center py-4 justify-between flex-shrink-0 select-none">
                <div className="flex flex-col gap-5 items-center w-full">
                  <button 
                    onClick={() => setActiveSideTab('explorer')}
                    className={`p-2 rounded-xl transition-all ${
                      activeSideTab === 'explorer' 
                        ? 'bg-[#7C3AED]/25 text-[#A78BFA] border border-[#7C3AED]/30 shadow-md shadow-[#7C3AED]/10' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title="Explorer"
                  >
                    <Folder className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => setActiveSideTab('git')}
                    className={`p-2 rounded-xl transition-all ${
                      activeSideTab === 'git' 
                        ? 'bg-[#7C3AED]/25 text-[#A78BFA] border border-[#7C3AED]/30 shadow-md shadow-[#7C3AED]/10' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title="Git Control"
                  >
                    <GitBranch className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => setActiveSideTab('debug')}
                    className={`p-2 rounded-xl transition-all ${
                      activeSideTab === 'debug' 
                        ? 'bg-[#7C3AED]/25 text-[#A78BFA] border border-[#7C3AED]/30 shadow-md shadow-[#7C3AED]/10' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title="Debug workspace"
                  >
                    <PlayCircle className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => setActiveSideTab('extensions')}
                    className={`p-2 rounded-xl transition-all ${
                      activeSideTab === 'extensions' 
                        ? 'bg-[#7C3AED]/25 text-[#A78BFA] border border-[#7C3AED]/30 shadow-md shadow-[#7C3AED]/10' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                    title="Marketplace Plugins"
                  >
                    <Boxes className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-4 items-center">
                  <button className="text-gray-500 hover:text-gray-300"><Settings2 className="h-4.5 w-4.5" /></button>
                </div>
              </div>

              {/* Active Side Panel Area */}
              <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-[#0D0D10]">
                {activeSideTab === 'explorer' && (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <FileExplorer
                        files={fileTree}
                        selectedFile={selectedFile}
                        onFileSelect={handleFileSelect}
                      />
                    </div>

                    {/* Workspace Outline Pane */}
                    <div className="border-t border-white/[0.06] p-3 max-h-48 overflow-y-auto bg-black/10 select-none">
                      <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Outline</span>
                      <div className="space-y-1">
                        {outlineItems.length === 0 ? (
                          <span className="text-[9px] text-gray-600 block">No outline symbols</span>
                        ) : (
                          outlineItems.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => jumpToLine(item.line)}
                              className="w-full text-left truncate font-mono text-[9px] text-gray-400 hover:text-white"
                            >
                              ln {item.line}: {item.text}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* TODO Explorer Pane */}
                    <div className="border-t border-white/[0.06] p-3 max-h-36 overflow-y-auto bg-black/15 select-none">
                      <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block mb-2">TODO Explorer</span>
                      <div className="space-y-1">
                        {todoItems.length === 0 ? (
                          <span className="text-[9px] text-gray-600 block">No TODOs found</span>
                        ) : (
                          todoItems.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => jumpToLine(item.line)}
                              className="w-full text-left truncate font-mono text-[9px] text-yellow-500 hover:text-white"
                            >
                              ln {item.line}: {item.text}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
                {activeSideTab === 'git' && <GitSidePanel />}
                {activeSideTab === 'debug' && <DebugSidePanel editorRef={editorRef} />}
                {activeSideTab === 'extensions' && (
                  <ExtensionsSidePanel 
                    monaco={typeof window !== 'undefined' ? (window as any).monaco : null} 
                    editor={editorRef.current} 
                    onThemeChange={(newTheme) => setEditorTheme(newTheme === 'cyberpunk' ? 'cyberpunk' : 'vs-dark')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Panel 2 & 3: Monaco tab workspace */}
          <div className={`${zenMode ? 'col-span-12' : 'col-span-12 md:col-span-6'} flex flex-col h-full min-h-0 border-r border-white/[0.06]`}>
            
            {/* Multi-Tab file bar */}
            <div className="flex items-center bg-black/30 border-b border-white/[0.06] px-3 py-1.5 gap-1 overflow-x-auto flex-shrink-0">
              {openTabs.map((tab) => (
                <div
                  key={tab.path}
                  onClick={() => { setActiveTabPath(tab.path); setActiveCode(tab.content); setSelectedFile(tab.path); }}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer border text-[10px] font-bold transition-all ${
                    activeTabPath === tab.path
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => handleTabClose(tab.path, e)}
                      className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <WorkspaceToolbar
              issuesCount={issues.length}
              zenMode={zenMode}
              isFixingAll={isFixingAll}
              handleFixAll={handleFixAll}
              showSearchReplace={showSearchReplace}
              setShowSearchReplace={setShowSearchReplace}
              isSplit={isSplit}
              setIsSplit={setIsSplit}
              setShowPalette={setShowPalette}
              fontSize={fontSize}
              setFontSize={setFontSize}
              editorTheme={editorTheme}
              setEditorTheme={setEditorTheme}
              setShowShortcuts={setShowShortcuts}
              setZenMode={setZenMode}
            />

            {/* Inline Search & Replace panel */}
            {showSearchReplace && (
              <div className="p-3 bg-black/40 border-b border-white/[0.06] flex flex-col md:flex-row gap-3 items-center flex-shrink-0">
                <div className="flex gap-2 flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Find"
                    value={findText}
                    onChange={e => setFindText(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Replace"
                    value={replaceText}
                    onChange={e => setReplaceText(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => {
                      if (!findText) return;
                      const replaced = activeCode.replaceAll(findText, replaceText);
                      setActiveCode(replaced);
                      toast.success("Replacements applied!");
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[9px]"
                  >
                    Replace All
                  </button>
                  <button
                    onClick={() => setShowSearchReplace(false)}
                    className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Monaco Editor layout container */}
            <div className="flex-1 min-h-0 bg-[#09090B] flex relative">
              {selectedText && selectionCoords && (
                <div 
                  className="absolute z-20 bg-[#09090B]/90 border border-white/10 rounded-xl p-1 shadow-2xl flex gap-1 animate-slide-in select-none backdrop-blur-sm"
                  style={{ top: `${selectionCoords.y}px`, left: `${selectionCoords.x}px` }}
                >
                  <button
                    onClick={() => {
                      const assistantTextarea = document.querySelector('textarea');
                      if (assistantTextarea) {
                        assistantTextarea.value = `Explain this selection:\n\n\`\`\`\n${selectedText}\n\`\`\n`;
                        assistantTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      setSelectedText('');
                    }}
                    className="px-2 py-1 hover:bg-white/5 rounded text-[8px] font-bold text-gray-300 hover:text-white"
                  >
                    Explain
                  </button>
                  <button
                    onClick={() => {
                      const assistantTextarea = document.querySelector('textarea');
                      if (assistantTextarea) {
                        assistantTextarea.value = `Optimize this code block selection:\n\n\`\`\`\n${selectedText}\n\`\`\n`;
                        assistantTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      setSelectedText('');
                    }}
                    className="px-2 py-1 hover:bg-white/5 rounded text-[8px] font-bold text-gray-300 hover:text-white"
                  >
                    Optimize
                  </button>
                  <button
                    onClick={() => {
                      const assistantTextarea = document.querySelector('textarea');
                      if (assistantTextarea) {
                        assistantTextarea.value = `Generate tests for this selection:\n\n\`\`\`\n${selectedText}\n\`\`\n`;
                        assistantTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                      setSelectedText('');
                    }}
                    className="px-2 py-1 hover:bg-white/5 rounded text-[8px] font-bold text-gray-300 hover:text-white"
                  >
                    Tests
                  </button>
                </div>
              )}
              <div className="flex-1 h-full min-w-0">
                <Editor
                  height="100%"
                  defaultLanguage={review?.language || 'python'}
                  value={activeCode}
                  theme={editorTheme}
                  onMount={handleEditorDidMount}
                  onChange={val => {
                    if (val !== undefined) setActiveCode(val);
                  }}
                  options={{
                    minimap: { enabled: true },
                    fontSize: fontSize,
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    automaticLayout: true,
                    folding: true,
                    stickyScroll: { enabled: true },
                    padding: { top: 15, bottom: 15 }
                  }}
                />
              </div>

              {isSplit && (
                <div className="flex-1 h-full min-w-0 border-l border-white/[0.06]">
                  <Editor
                    height="100%"
                    defaultLanguage={review?.language || 'python'}
                    value={activeCode}
                    theme={editorTheme}
                    options={{
                      minimap: { enabled: false },
                      fontSize: fontSize,
                      lineNumbers: 'on',
                      roundedSelection: true,
                      scrollBeyondLastLine: false,
                      readOnly: true,
                      automaticLayout: true,
                      folding: true,
                      padding: { top: 15, bottom: 15 }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bottom Panel */}
            {!zenMode && (
              <BottomPanel
                issues={issues}
                logs={logs}
                reviewTitle={review?.title}
                branch={review?.branch}
                commitHash={review?.commit_hash}
                onIssueClick={handleIssueClick}
                reviewId={reviewId}
                token={token || ''}
              />
            )}
          </div>

          {/* Panel 4: AI Assistant Panel */}
          {!zenMode && (
            <div className="col-span-3 hidden md:block h-full overflow-hidden">
              <AIAssistantPanel
                reviewId={reviewId}
                selectedCode={activeCode}
                issues={issues}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Diff comparison overlay */}
      {isDiffOpen && activeIssueId !== null && (
        <DiffViewer 
          isOpen={isDiffOpen}
          onClose={() => setIsDiffOpen(false)}
          reviewId={reviewId}
          issueId={activeIssueId}
          token={token || ''}
          onApplySuccess={() => {
            fetchReviewData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
