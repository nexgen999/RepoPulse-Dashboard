/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, File, ChevronRight, ChevronLeft, Search, 
  Download, Upload, Trash2, Edit2, Copy, Scissors, 
  MoreVertical, Grid, List, LayoutList, RefreshCw, 
  HardDrive, Globe, ArrowRight, ArrowLeft, X, Plus, Monitor,
  CheckCircle2, AlertCircle, Clock, Zap, Info, ShieldCheck,
  FolderTree, FileText, ChevronDown, Link, ExternalLink, ClipboardPaste, FileSearch, Edit3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { AppSettings, Repository, FileItem, TransferTask, SavedConnection } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { getFileIconInfo, FOLDER_ICON, FILE_ICON } from '../lib/icons';

const PathInput = ({ initialPath, onNavigate, type }: { initialPath: string, onNavigate: (p: string) => void, type: 'local' | 'remote' }) => {
  const [value, setValue] = useState(initialPath);

  useEffect(() => {
    setValue(initialPath);
  }, [initialPath]);

  const handleCommit = () => {
    if (value === initialPath) return;
    let p = value;
    if (type === 'local' && p && !p.startsWith('/') && !p.includes(':')) {
       p = '/' + p;
    }
    onNavigate(p);
  };

  return (
    <input 
      type="text"
      className="bg-transparent border-none outline-none w-full py-0 text-[10px] font-mono leading-none"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCommit();
      }}
      onBlur={handleCommit}
    />
  );
};

interface ExplorerFullProps {
  settings: AppSettings;
  repositories: Repository[];
  savedConnections: SavedConnection[];
  onUpdateConnections: (connections: SavedConnection[]) => void;
}

type PaneSide = 'left' | 'right';

interface TabState {
  id: string;
  type: 'local' | 'remote';
  source: 'http' | 'ftp' | 'sftp' | 'smb' | 'webdav' | 'nfs' | 's3' | 'rclone';
  url: string;
  path: string;
  remoteRepoId?: string;
  username?: string;
  password?: string;
  port?: number;
  items: FileItem[];
  loading: boolean;
  selectedItems: string[];
  viewMode: 'icons' | 'list' | 'details';
  search: string;
  sortBy?: 'name' | 'size' | 'date';
  error?: string;
}

interface PaneState {
  side: PaneSide;
  tabs: TabState[];
  activeTabIndex: number;
}

import { FilePreview } from './FilePreview';


export function ExplorerFull({ settings, repositories, savedConnections, onUpdateConnections }: ExplorerFullProps) {
  const { t: translate } = useTranslation(settings.language);
  const t = translate('explorer') as any;

  const [leftPane, setLeftPane] = useState<PaneState>({
    side: 'left',
    tabs: [{
      id: 'tab-1',
      type: 'local',
      source: 'http',
      url: '',
      path: '/',
      items: [],
      loading: false,
      selectedItems: [],
      viewMode: 'details',
      search: '',
    }],
    activeTabIndex: 0
  });

  const [rightPane, setRightPane] = useState<PaneState>({
    side: 'right',
    tabs: [{
      id: 'tab-2',
      type: 'remote',
      source: 'http',
      url: '',
      path: '/',
      items: [],
      loading: false,
      selectedItems: [],
      viewMode: 'details',
      search: '',
    }],
    activeTabIndex: 0
  });

  const [transfers, setTransfers] = useState<TransferTask[]>([]);
  const [activePane, setActivePane] = useState<PaneSide>('left');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem, side: PaneSide } | null>(null);
  const [clipboard, setClipboard] = useState<{ items: FileItem[], action: 'copy' | 'cut', sourceSide: PaneSide } | null>(null);
  const [showDirectConnect, setShowDirectConnect] = useState<{ side: PaneSide } | null>(null);
  const [directConnectUrl, setDirectConnectUrl] = useState('');
  const [directConnectSource, setDirectConnectSource] = useState<'http' | 'ftp' | 'sftp' | 'smb' | 'webdav' | 'nfs' | 's3' | 'rclone'>('http');
  const [showProperties, setShowProperties] = useState<{ item: FileItem, side: PaneSide } | null>(null);
  const [showPreview, setShowPreview] = useState<{ item: FileItem, side: PaneSide } | null>(null);
  const [showEditor, setShowEditor] = useState<{ item: FileItem, side: PaneSide, content: string } | null>(null);
  const [showChmod, setShowChmod] = useState<{ item: FileItem, side: PaneSide } | null>(null);
  const [chmodValue, setChmodValue] = useState('644');
  const [verifyHash, setVerifyHash] = useState(false);
  const [useTrash, setUseTrash] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [transferLogs, setTransferLogs] = useState<any[]>([]);
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [systemDrives, setSystemDrives] = useState<{name: string, path: string, type: string}[]>([]);
  const [editingConnection, setEditingConnection] = useState<SavedConnection | null>(null);
  const [multiSelect, setMultiSelect] = useState<boolean>(false);
  const [leftColumnWidths, setLeftColumnWidths] = useState({ name: 250, size: 100, modified: 200 });
  const [rightColumnWidths, setRightColumnWidths] = useState({ name: 250, size: 100, modified: 200 });
  const [resizing, setResizing] = useState<{ side: PaneSide, col: string } | null>(null);

  const [connForm, setConnForm] = useState<Partial<SavedConnection>>({
    name: '',
    type: 'remote',
    source: 'http',
    url: '',
    username: '',
    password: '',
    port: 80
  });

  const remoteRepos = useMemo(() => 
    repositories.filter(r => ['ftp', 'smb', 'webdav', 'nfs', 'http', 's3', 'rclone'].includes(r.source)),
  [repositories]);

  const getDefaultPort = (source: string, url: string) => {
    if (source === 'ftp') return 21;
    if (source === 'smb') return 445;
    if (source === 'nfs') return 2049;
    if (source === 'webdav' || source === 'http') {
      return url.startsWith('https') ? 443 : 80;
    }
    return 80;
  };

  const getActiveTab = (pane: PaneState) => pane.tabs[pane.activeTabIndex];

  const updateActiveTab = (side: PaneSide, updates: Partial<TabState>) => {
    const setPane = side === 'left' ? setLeftPane : setRightPane;
    setPane(prev => ({
      ...prev,
      tabs: prev.tabs.map((tab, i) => i === prev.activeTabIndex ? { ...tab, ...updates } : tab)
    }));
  };

  const fetchFiles = async (pane: PaneState): Promise<FileItem[]> => {
    const tab = getActiveTab(pane);
    try {
      if (tab.type === 'local') {
        const res = await fetch(`/api/explorer/local?path=${encodeURIComponent(tab.path)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch local files');
        }
        const items = await res.json();
        if (tab.path !== '/' && tab.path !== '') {
          items.unshift({
            name: '..',
            path: '..',
            type: 'directory',
            size: 0,
            modified: new Date().toISOString(),
          });
        }
        return items;
      } else if (tab.type === 'remote') {
        if (!tab.url) return [];
        
        const res = await fetch('/api/proxy-explorer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: tab.source,
            url: tab.url,
            overrideUrl: tab.source === 'http' 
              ? (tab.url.endsWith('/') ? tab.url : tab.url + '/') + tab.path.replace(/^\//, '') 
              : tab.url,
            // For non-http sources, we should explicitly pass the path if the backend expects it
            path: tab.path,
            username: tab.username,
            password: tab.password,
            port: tab.port || getDefaultPort(tab.source, tab.url)
          })
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch remote files');
        }
        const data = await res.json();
        const items = data.map((item: any) => ({
          name: item.name,
          path: tab.path.replace(/\/$/, '') + '/' + item.name,
          type: item.type === 'directory' ? 'directory' : 'file',
          size: item.size || 0,
          modified: item.modified || new Date().toISOString(),
          extension: item.name.split('.').pop(),
          permissions: item.permissions
        }));

        if (tab.path !== '/' && tab.path !== '') {
          items.unshift({
            name: '..',
            path: '..',
            type: 'directory',
            size: 0,
            modified: new Date().toISOString(),
          });
        }
        return items;
      }
      return [];
    } catch (err: any) {
      console.error('Fetch error:', err);
      throw err;
    }
  };

  const refreshPane = async (side: PaneSide) => {
    const pane = side === 'left' ? leftPane : rightPane;

    updateActiveTab(side, { loading: true, error: undefined });
    try {
      const items = await fetchFiles(pane);
      updateActiveTab(side, { items, loading: false, selectedItems: [] });
    } catch (err: any) {
      updateActiveTab(side, { items: [], loading: false, error: err.message });
    }
  };

  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const res = await fetch('/api/system/drives');
        if (res.ok) {
          const drives = await res.json();
          setSystemDrives(drives);
        }
      } catch (e) {
        console.error("Failed to fetch drives");
      }
    };
    fetchDrives();
  }, []);

  useEffect(() => {
    refreshPane('left');
  }, [getActiveTab(leftPane).path, getActiveTab(leftPane).type, getActiveTab(leftPane).remoteRepoId, leftPane.activeTabIndex]);

  useEffect(() => {
    refreshPane('right');
  }, [getActiveTab(rightPane).path, getActiveTab(rightPane).type, getActiveTab(rightPane).remoteRepoId, rightPane.activeTabIndex]);

  const handleNavigate = (side: PaneSide, newPath: string) => {
    const pane = side === 'left' ? leftPane : rightPane;
    const tab = getActiveTab(pane);

    if (newPath === '..') {
      const parts = tab.path.split('/').filter(Boolean);
      parts.pop();
      const parentPath = parts.length === 1 && parts[0].includes(':') 
        ? parts[0] + '/' 
        : (parts.length === 0 ? '/' : '/' + parts.join('/'));
      updateActiveTab(side, { path: parentPath, error: undefined });
    } else {
      updateActiveTab(side, { path: newPath, error: undefined });
    }
  };

  const handleItemClick = (side: PaneSide, item: FileItem, e?: React.MouseEvent) => {
    setActivePane(side);
    const pane = side === 'left' ? leftPane : rightPane;
    const tab = getActiveTab(pane);
    
    if (e?.ctrlKey) {
      updateActiveTab(side, {
        selectedItems: tab.selectedItems.includes(item.path) 
          ? tab.selectedItems.filter(p => p !== item.path)
          : [...tab.selectedItems, item.path]
      });
    } else if (e?.shiftKey && tab.selectedItems.length > 0) {
      const lastSelected = tab.selectedItems[tab.selectedItems.length - 1];
      const lastIdx = tab.items.findIndex(i => i.path === lastSelected);
      const currentIdx = tab.items.findIndex(i => i.path === item.path);
      const start = Math.min(lastIdx, currentIdx);
      const end = Math.max(lastIdx, currentIdx);
      const range = tab.items.slice(start, end + 1).map(i => i.path);
      updateActiveTab(side, {
        selectedItems: Array.from(new Set([...tab.selectedItems, ...range]))
      });
    } else {
      updateActiveTab(side, {
        selectedItems: [item.path]
      });
    }
  };

  const handleDoubleClick = (side: PaneSide, item: FileItem) => {
    if (item.type === 'directory') {
      handleNavigate(side, item.path);
    } else {
      setShowPreview({ item, side });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (side: PaneSide, items: FileItem[]) => {
    if (items.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${items.length === 1 ? items[0].name : items.length + ' items'}?`)) return;
    
    const pane = side === 'left' ? leftPane : rightPane;
    const tab = getActiveTab(pane);
    try {
      for (const item of items) {
        if (tab.type === 'local') {
          const res = await fetch(`/api/explorer/local?path=${encodeURIComponent(item.path)}`, { method: 'DELETE' });
          if (!res.ok) throw new Error(`Delete failed for ${item.name}`);
        } else if (tab.remoteRepoId) {
          const repo = repositories.find(r => r.id === tab.remoteRepoId);
          if (!repo) continue;
          const res = await fetch('/api/proxy-explorer-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: repo.source,
              action: 'delete',
              url: repo.url,
              path: item.path,
              username: repo.username,
              password: repo.password,
              port: repo.port
            })
          });
          if (!res.ok) throw new Error(`Delete failed for ${item.name}`);
        }
      }
      refreshPane(side);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRename = async (side: PaneSide, item: FileItem) => {
    const newName = prompt(`Rename ${item.name} to:`, item.name);
    if (!newName || newName === item.name) return;

    const pane = side === 'left' ? leftPane : rightPane;
    const tab = getActiveTab(pane);
    try {
      if (tab.type === 'local') {
        const parent = item.path.split('/').slice(0, -1).join('/');
        const newPath = (parent ? parent + '/' : '') + newName;
        const res = await fetch('/api/explorer/local/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPath: item.path, newPath })
        });
        if (!res.ok) throw new Error('Rename failed');
      } else if (tab.remoteRepoId) {
        const repo = repositories.find(r => r.id === tab.remoteRepoId);
        if (!repo) return;
        const res = await fetch('/api/proxy-explorer-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: repo.source,
            action: 'rename',
            url: repo.url,
            path: item.path,
            newName,
            username: repo.username,
            password: repo.password,
            port: repo.port
          })
        });
        if (!res.ok) throw new Error('Rename failed');
      }
      refreshPane(side);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransfer = async (side: PaneSide, items: FileItem[]) => {
    const sourcePane = side === 'left' ? leftPane : rightPane;
    const destPane = side === 'left' ? rightPane : leftPane;
    const source = getActiveTab(sourcePane);
    const dest = getActiveTab(destPane);
    
    if (items.length === 0) return;

    const newTasks: TransferTask[] = items.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: item.name,
      sourcePath: item.path,
      destPath: dest.path,
      type: source.type === 'local' ? 'upload' : 'download',
      status: 'running',
      progress: 0,
      speed: 0,
      totalSize: item.size,
      transferredSize: 0,
      startTime: Date.now()
    }));

    setTransfers(prev => [...newTasks, ...prev]);
    
    try {
      const res = await fetch('/api/explorer/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            type: source.type,
            source: source.source,
            url: source.url,
            path: source.path,
            username: source.username,
            password: source.password,
            port: source.port
          },
          dest: {
            type: dest.type,
            source: dest.source,
            url: dest.url,
            path: dest.path,
            username: dest.username,
            password: dest.password,
            port: dest.port
          },
          action: 'copy',
          items: items.map(i => ({ name: i.name, path: i.path })),
          verifyHash
        })
      });

      if (!res.ok) throw new Error('Transfer failed');
      
      setTransfers(prev => prev.map(t => 
        newTasks.find(nt => nt.id === t.id) ? { ...t, progress: 100, status: 'completed' } : t
      ));
      refreshPane(destPane.side);
    } catch (err: any) {
      setTransfers(prev => prev.map(t => 
        newTasks.find(nt => nt.id === t.id) ? { ...t, status: 'error', error: err.message } : t
      ));
    }
    
    setContextMenu(null);
  };

  const handleChmod = async () => {
    if (!showChmod) return;
    const { item, side } = showChmod;
    const pane = side === 'left' ? leftPane : rightPane;
    const tab = getActiveTab(pane);
    
    try {
      const res = await fetch('/api/explorer/chmod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: tab.source,
          url: tab.url,
          path: item.path || item.name,
          mode: chmodValue,
          username: tab.username,
          password: tab.password,
          port: tab.port
        })
      });
      if (!res.ok) throw new Error("Failed to change permissions");
      refreshPane(side);
      setShowChmod(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveFile = async () => {
    if (!showEditor) return;
    const { item, side, content } = showEditor;
    const pane = side === 'left' ? leftPane : rightPane;
    const tab = getActiveTab(pane);
    
    try {
      const res = await fetch('/api/explorer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: tab.type === 'local' ? 'local' : tab.source,
          url: tab.url,
          path: item.path || item.name,
          content,
          username: tab.username,
          password: tab.password,
          port: tab.port
        })
      });
      if (!res.ok) throw new Error("Failed to save file");
      refreshPane(side);
      setShowEditor(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDirectConnect = (side: PaneSide) => {
    updateActiveTab(side, {
      type: 'remote',
      source: directConnectSource,
      url: directConnectUrl,
      path: '/',
      remoteRepoId: undefined,
      items: [],
      loading: true,
      port: getActiveTab(side === 'left' ? leftPane : rightPane).port || getDefaultPort(directConnectSource, directConnectUrl)
    });
    setShowDirectConnect(null);
    setDirectConnectUrl('');
  };

  const handleCopy = (side: PaneSide, items: FileItem[]) => {
    setClipboard({ items, action: 'copy', sourceSide: side });
    setContextMenu(null);
  };

  const handleCut = (side: PaneSide, items: FileItem[]) => {
    setClipboard({ items, action: 'cut', sourceSide: side });
    setContextMenu(null);
  };

  const handlePaste = async (side: PaneSide) => {
    if (!clipboard) return;
    const destPane = side === 'left' ? leftPane : rightPane;
    const sourcePane = clipboard.sourceSide === 'left' ? leftPane : rightPane;
    const dest = getActiveTab(destPane);
    const source = getActiveTab(sourcePane);
    
    const newTasks: TransferTask[] = clipboard.items.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: item.name,
      sourcePath: item.path,
      destPath: dest.path,
      type: clipboard.action === 'copy' ? 'download' : 'upload', // simplified
      status: 'running',
      progress: 0,
      speed: 0,
      totalSize: item.size,
      transferredSize: 0,
      startTime: Date.now()
    }));

    setTransfers(prev => [...newTasks, ...prev]);
    
    try {
      const res = await fetch('/api/explorer/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            type: source.type,
            source: source.source,
            url: source.url,
            path: source.path,
            username: source.username,
            password: source.password,
            port: source.port
          },
          dest: {
            type: dest.type,
            source: dest.source,
            url: dest.url,
            path: dest.path,
            username: dest.username,
            password: dest.password,
            port: dest.port
          },
          action: clipboard.action,
          items: clipboard.items.map(i => ({ name: i.name, path: i.path }))
        })
      });

      if (!res.ok) throw new Error('Paste failed');
      
      setTransfers(prev => prev.map(t => 
        newTasks.find(nt => nt.id === t.id) ? { ...t, progress: 100, status: 'completed' } : t
      ));
      
      refreshPane(side);
      if (clipboard.action === 'cut') {
        refreshPane(clipboard.sourceSide);
        setClipboard(null);
      }
    } catch (err: any) {
      setTransfers(prev => prev.map(t => 
        newTasks.find(nt => nt.id === t.id) ? { ...t, status: 'error', error: err.message } : t
      ));
    }
    
    setContextMenu(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const delta = e.movementX;
        const setWidths = resizing.side === 'left' ? setLeftColumnWidths : setRightColumnWidths;
        setWidths(prev => ({
          ...prev,
          [resizing.col]: Math.max(50, (prev as any)[resizing.col] + delta)
        }));
      }
    };
    const handleMouseUp = () => setResizing(null);

    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const renderPane = (pane: PaneState) => {
    const tab = getActiveTab(pane);
    const filteredItems = tab.items.filter(item => 
      item.name === '..' || item.name.toLowerCase().includes(tab.search.toLowerCase())
    );

    return (
      <div className={cn(
        "flex-1 flex flex-col border border-border rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm transition-all",
        activePane === pane.side ? "ring-2 ring-[var(--accent)]/30 border-[var(--accent)]/30" : ""
      )}
      onClick={() => setActivePane(pane.side)}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-[var(--accent)]/5');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('bg-[var(--accent)]/5');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-[var(--accent)]/5');
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          const { side, items } = JSON.parse(data);
          if (side !== pane.side) {
            handleTransfer(side, items);
          }
        }
      }}
      >
        {/* Tabs UI */}
        <div className="flex items-center bg-muted/50 border-b border-border overflow-x-auto no-scrollbar">
          {pane.tabs.map((t, i) => (
            <div 
              key={t.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-xs font-medium border-r border-border cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                pane.activeTabIndex === i ? "bg-card text-[var(--accent)] border-b-2 border-b-[var(--accent)]" : "text-muted-foreground hover:bg-muted"
              )}
              onClick={(e) => {
                e.stopPropagation();
                const setPane = pane.side === 'left' ? setLeftPane : setRightPane;
                setPane(prev => ({ ...prev, activeTabIndex: i }));
              }}
            >
              <div className="flex items-center gap-1.5 truncate flex-1">
                {t.type === 'local' ? <Monitor className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                <span className="truncate">{t.type === 'local' ? 'Local' : (t.url || 'Remote')}</span>
              </div>
              {pane.tabs.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const setPane = pane.side === 'left' ? setLeftPane : setRightPane;
                    setPane(prev => {
                      const newTabs = prev.tabs.filter((_, idx) => idx !== i);
                      const newActiveIndex = prev.activeTabIndex >= newTabs.length ? newTabs.length - 1 : prev.activeTabIndex;
                      return { ...prev, tabs: newTabs, activeTabIndex: newActiveIndex };
                    });
                  }}
                  className="p-0.5 hover:bg-muted-foreground/20 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const setPane = pane.side === 'left' ? setLeftPane : setRightPane;
              setPane(prev => ({
                ...prev,
                tabs: [...prev.tabs, {
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'local',
                  source: 'http',
                  url: '',
                  path: '/',
                  items: [],
                  loading: false,
                  selectedItems: [],
                  viewMode: 'details',
                  search: '',
                }],
                activeTabIndex: prev.tabs.length
              }));
            }}
            className="p-2 hover:bg-muted text-muted-foreground"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Pane Header */}
        <div className="p-3 border-b border-border bg-muted/30 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <select 
                className="bg-background border border-border rounded px-2 text-xs outline-none focus:ring-1 focus:ring-[var(--accent)] h-9"
                value={tab.type === 'local' ? 'local' : (tab.remoteRepoId || savedConnections.find(c => c.url === tab.url)?.id || tab.url)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'local') {
                    updateActiveTab(pane.side, { type: 'local', path: '/', remoteRepoId: undefined, url: '', source: 'http' });
                  } else {
                    const repo = repositories.find(r => r.id === val);
                    const savedConn = savedConnections.find(c => c.id === val);
                    
                    if (repo) {
                      updateActiveTab(pane.side, { 
                        type: 'remote', 
                        path: '/', 
                        remoteRepoId: val,
                        url: repo.url,
                        source: repo.source as any,
                        username: repo.username,
                        password: repo.password,
                        port: repo.port
                      });
                    } else if (savedConn) {
                      updateActiveTab(pane.side, {
                        type: 'remote',
                        path: '/',
                        remoteRepoId: undefined,
                        url: savedConn.url || '',
                        source: (savedConn.source as any) || 'http',
                        username: savedConn.username,
                        password: savedConn.password,
                        port: savedConn.port
                      });
                    }
                  }
                }}
              >
                <option value="local">{t.local}</option>
                {remoteRepos.length > 0 && (
                  <optgroup label={t.remote}>
                    {remoteRepos.map(repo => (
                      <option key={repo.id} value={repo.id}>{repo.name} ({repo.source.toUpperCase()})</option>
                    ))}
                  </optgroup>
                )}
                {savedConnections.length > 0 && (
                  <optgroup label={t.connections}>
                    {savedConnections.map(conn => (
                      <option key={conn.id} value={conn.id}>{conn.name} ({conn.source?.toUpperCase()})</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <div className="flex items-center gap-1 bg-background border border-border rounded px-2 flex-1 min-w-0 overflow-hidden h-9">
                <button 
                  onClick={() => {
                    if (tab.path === '/' || tab.path === '') {
                      if (tab.type === 'remote' && tab.url.length > 8) {
                        try {
                          const url = new URL(tab.url);
                          const parts = url.pathname.split('/').filter(Boolean);
                          if (parts.length > 0) {
                            parts.pop();
                            const newUrl = url.origin + '/' + parts.join('/') + (parts.length > 0 ? '/' : '');
                            updateActiveTab(pane.side, { url: newUrl, path: '/' });
                          }
                        } catch (e) {
                          console.error("Invalid URL for navigation:", tab.url);
                        }
                      }
                    } else {
                      const parts = tab.path.split('/').filter(Boolean);
                      parts.pop();
                      // Improved: don't prepended slash if first part is a drive
                      const parentPath = parts.length === 1 && parts[0].includes(':') 
                        ? parts[0] + '/' 
                        : (parts.length === 0 ? '/' : '/' + parts.join('/'));
                      handleNavigate(pane.side, parentPath);
                    }
                  }} 
                  className="hover:text-[var(--accent)] shrink-0"
                  title={t.up}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center overflow-x-auto no-scrollbar whitespace-nowrap text-[10px] flex-1 h-full">
                  <div className="flex items-center gap-1 bg-muted/50 rounded-md px-2 w-full h-[26px]">
                    <PathInput 
                      initialPath={tab.path}
                      type={tab.type}
                      onNavigate={(p) => handleNavigate(pane.side, p)}
                    />
                  </div>
                </div>
              </div>
              {tab.type === 'local' && systemDrives.length > 0 && (
                <select 
                  className="bg-background border border-border rounded px-1 text-[10px] outline-none max-w-[65px] h-9"
                  value={systemDrives.find(d => tab.path.startsWith(d.path))?.path || '/'}
                  onChange={(e) => handleNavigate(pane.side, e.target.value)}
                >
                  {systemDrives.map(d => (
                    <option key={d.path} value={d.path}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input 
                type="text"
                placeholder={t.search}
                className="w-full pl-8 pr-3 py-1 bg-background border border-border rounded text-xs outline-none focus:ring-1 focus:ring-[var(--accent)] h-9"
                value={tab.search}
                onChange={(e) => updateActiveTab(pane.side, { search: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setShowConnectionManager(true)}
                className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-[var(--accent)]"
                title={t.connections}
              >
                <HardDrive className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowDirectConnect({ side: pane.side })}
                className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-[var(--accent)]"
                title={t.directConnect}
              >
                <Link className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-border mx-1" />
              <button 
                onClick={() => refreshPane(pane.side)}
                className="p-1.5 hover:bg-muted rounded transition-colors"
                title={t.refresh}
              >
                <RefreshCw className={cn("w-4 h-4", tab.loading && "animate-spin")} />
              </button>
              <div className="h-4 w-px bg-border mx-1" />
              <button 
                onClick={() => updateActiveTab(pane.side, { viewMode: 'icons' })}
                className={cn("p-1.5 rounded transition-colors", tab.viewMode === 'icons' ? "bg-[var(--accent)] text-white" : "hover:bg-muted")}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => updateActiveTab(pane.side, { viewMode: 'list' })}
                className={cn("p-1.5 rounded transition-colors", tab.viewMode === 'list' ? "bg-[var(--accent)] text-white" : "hover:bg-muted")}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => updateActiveTab(pane.side, { viewMode: 'details' })}
                className={cn("p-1.5 rounded transition-colors", tab.viewMode === 'details' ? "bg-[var(--accent)] text-white" : "hover:bg-muted")}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pane Content */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative">
          {tab.loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tab.error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2 opacity-50" />
              <p className="text-sm font-medium text-red-500 mb-2">Error: {tab.error}</p>
              <button 
                onClick={() => refreshPane(pane.side)}
                className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Try Again
              </button>
            </div>
          ) : tab.viewMode === 'details' ? (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="min-w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-muted-foreground border-b border-border sticky top-0 bg-card/80 backdrop-blur-md z-10">
                    <th className="px-2 py-2 font-medium relative whitespace-nowrap" style={{ width: (pane.side === 'left' ? leftColumnWidths : rightColumnWidths).name }}>
                      {t.name}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)]/50 transition-colors"
                        onMouseDown={() => setResizing({ side: pane.side, col: 'name' })}
                      />
                    </th>
                    <th className="px-2 py-2 font-medium relative whitespace-nowrap" style={{ width: (pane.side === 'left' ? leftColumnWidths : rightColumnWidths).size }}>
                      {t.size}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)]/50 transition-colors"
                        onMouseDown={() => setResizing({ side: pane.side, col: 'size' })}
                      />
                    </th>
                    <th className="px-2 py-2 font-medium relative whitespace-nowrap" style={{ width: (pane.side === 'left' ? leftColumnWidths : rightColumnWidths).modified }}>
                      {t.modified}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)]/50 transition-colors"
                        onMouseDown={() => setResizing({ side: pane.side, col: 'modified' })}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                {filteredItems.map((item, idx) => (
                  <tr 
                    key={`${item.path}-${idx}`}
                    draggable
                    onDragStart={(e) => {
                      const paneItems = tab.items.filter(i => tab.selectedItems.includes(i.path));
                      const itemsToDrag = paneItems.length > 0 ? paneItems : [item];
                      e.dataTransfer.setData('application/json', JSON.stringify({ side: pane.side, items: itemsToDrag }));
                    }}
                    className={cn(
                      "hover:bg-muted/50 cursor-pointer group",
                      tab.selectedItems.includes(item.path) ? "bg-[var(--accent)]/10" : ""
                    )}
                    onClick={(e) => handleItemClick(pane.side, item, e)}
                    onDoubleClick={() => handleDoubleClick(pane.side, item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const x = e.clientX;
                      const y = e.clientY;
                      const menuWidth = 180;
                      const menuHeight = 500; 
                      
                      let adjX = x;
                      let adjY = y;
                      
                      if (x + menuWidth > window.innerWidth) {
                        adjX = window.innerWidth - menuWidth - 10;
                      }
                      if (y + menuHeight > window.innerHeight) {
                        adjY = window.innerHeight - menuHeight - 10;
                      }
                      
                      // Final safety checks
                      adjX = Math.max(10, adjX);
                      adjY = Math.max(10, adjY);
                      
                      setContextMenu({ x: adjX, y: adjY, item, side: pane.side });
                    }}
                  >
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img 
                          src={getFileIconInfo(item.name, item.type === 'directory')} 
                          alt="" 
                          className={cn("w-4 h-4 shrink-0 object-contain", item.type === 'directory' ? "" : "opacity-90")}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== (item.type === 'directory' ? FOLDER_ICON : FILE_ICON)) {
                              target.src = item.type === 'directory' ? FOLDER_ICON : FILE_ICON;
                            }
                          }}
                        />
                        <span className="truncate" title={item.name}>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {item.type === 'directory' ? '--' : formatSize(item.size)}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {item.modified && !isNaN(new Date(item.modified).getTime()) 
                        ? formatDistanceToNow(new Date(item.modified), { addSuffix: true }) 
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className={cn(
              "grid gap-2",
              tab.viewMode === 'icons' ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-1"
            )}>
              {filteredItems.map((item, idx) => (
                <div 
                  key={`${item.path}-${idx}`}
                  className={cn(
                    "p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all hover:bg-muted/50 text-center",
                    tab.selectedItems.includes(item.path) ? "bg-[var(--accent)]/10 ring-1 ring-[var(--accent)]/30" : "",
                    tab.viewMode === 'list' ? "flex-row text-left" : ""
                  )}
                  onClick={(e) => handleItemClick(pane.side, item, e)}
                  onDoubleClick={() => handleDoubleClick(pane.side, item)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    const x = e.clientX;
                    const y = e.clientY;
                    const menuWidth = 180;
                    const menuHeight = 500; // conservative estimate
                    
                    let adjX = x;
                    let adjY = y;
                    
                    if (x + menuWidth > window.innerWidth) {
                      adjX = window.innerWidth - menuWidth - 10;
                    }
                    if (y + menuHeight > window.innerHeight) {
                      adjY = window.innerHeight - menuHeight - 10;
                    }
                    
                    // Safety check if click is too high
                    adjX = Math.max(10, adjX);
                    adjY = Math.max(10, adjY);
                    
                    setContextMenu({ x: adjX, y: adjY, item, side: pane.side });
                  }}
                >
                  <img 
                    src={getFileIconInfo(item.name, item.type === 'directory')} 
                    alt="" 
                    className={cn(tab.viewMode === 'icons' ? "w-10 h-10 mb-1" : "w-4 h-4 shrink-0", "object-contain")}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== (item.type === 'directory' ? FOLDER_ICON : FILE_ICON)) {
                        target.src = item.type === 'directory' ? FOLDER_ICON : FILE_ICON;
                      }
                    }}
                  />
                  <span className={cn("break-all w-full line-clamp-2", tab.viewMode === 'icons' ? "text-[10px]" : "text-sm")} title={item.name}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pane Footer */}
        <div className="p-2 border-t border-border bg-muted/10 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{filteredItems.length} {t.items}</span>
          <span>{tab.selectedItems.length} {t.selected}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
      {/* Transfer Queue */}
      {transfers.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              {t.queue} ({transfers.filter(t => t.status === 'running').length})
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  const res = await fetch('/api/explorer/transfer-logs');
                  if (res.ok) {
                    const logs = await res.json();
                    setTransferLogs(logs);
                    setShowLogs(true);
                  }
                }}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                title="View Transfer Logs"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTransfers([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t.clear}
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {transfers.map(task => (
              <div key={task.id} className="space-y-1 p-2 hover:bg-muted/30 rounded-lg group">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate flex-1">
                    {task.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : 
                     task.status === 'error' ? <AlertCircle className="w-3 h-3 text-red-500" /> :
                     <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent)]" />}
                    <span className="truncate font-medium">{task.fileName}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-muted-foreground">
                      {task.status === 'completed' ? '100%' : `${formatSize(task.speed)}/s`}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status === 'running' ? (
                        <button onClick={() => setTransfers(prev => prev.map(t => t.id === task.id ? { ...t, status: 'pending' } : t))} className="p-1 hover:bg-muted rounded">
                          <Clock className="w-3 h-3" />
                        </button>
                      ) : (
                        <button onClick={() => setTransfers(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' } : t))} className="p-1 hover:bg-muted rounded">
                          <Zap className="w-3 h-3" />
                        </button>
                      )}
                      <button onClick={() => setTransfers(prev => prev.filter(t => t.id !== task.id))} className="p-1 hover:bg-muted rounded text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      task.status === 'completed' ? "bg-green-500" : 
                      task.status === 'error' ? "bg-red-500" : 
                      task.status === 'pending' ? "bg-amber-500" : "bg-[var(--accent)]"
                    )}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Pane Explorer */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {renderPane(leftPane)}
        {renderPane(rightPane)}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div 
            className="fixed z-50 bg-card/95 backdrop-blur-md border border-border shadow-2xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100 flex flex-col text-[11px]"
            style={{ 
              left: contextMenu.x, 
              top: contextMenu.y,
              maxHeight: 'calc(100vh - 20px)',
              overflowY: 'auto'
            }}
          >
            <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1 truncate max-w-[180px]">
              {contextMenu.item.name}
            </div>
            
            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center justify-between group"
              onClick={() => {
                const pane = contextMenu.side === 'left' ? leftPane : rightPane;
                const selected = pane.items.filter(i => getActiveTab(pane).selectedItems.includes(i.path));
                handleTransfer(contextMenu.side, selected.length > 0 ? selected : [contextMenu.item]);
                setContextMenu(null);
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Transfer
              </div>
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground">
                {contextMenu.side === 'left' ? '→' : '←'}
              </span>
            </button>

            <div className="h-px bg-border my-1" />

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                setShowPreview({ item: contextMenu.item, side: contextMenu.side });
                setContextMenu(null);
              }}
            >
              <FileSearch className="w-3.5 h-3.5 text-blue-500" /> Preview
            </button>

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                const pane = contextMenu.side === 'left' ? leftPane : rightPane;
                const tab = getActiveTab(pane);
                fetch(`/api/explorer/preview?${new URLSearchParams({
                  source: tab.type === 'local' ? 'local' : tab.source,
                  url: tab.url,
                  path: contextMenu.item.path || contextMenu.item.name
                })}`).then(res => res.text()).then(content => {
                  setShowEditor({ item: contextMenu.item, side: contextMenu.side, content });
                  setContextMenu(null);
                });
              }}
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-500" /> Edit
            </button>

            <div className="h-px bg-border my-1" />

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                const pane = contextMenu.side === 'left' ? leftPane : rightPane;
                const tab = getActiveTab(pane);
                const selected = tab.items.filter(i => tab.selectedItems.includes(i.path));
                handleCopy(contextMenu.side, selected.length > 0 ? selected : [contextMenu.item]);
              }}
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                const pane = contextMenu.side === 'left' ? leftPane : rightPane;
                const tab = getActiveTab(pane);
                const selected = tab.items.filter(i => tab.selectedItems.includes(i.path));
                handleCut(contextMenu.side, selected.length > 0 ? selected : [contextMenu.item]);
              }}
            >
              <Scissors className="w-3.5 h-3.5" /> Cut
            </button>
            <button 
              className={cn(
                "w-full px-3 py-1.5 text-left flex items-center gap-2",
                clipboard ? "hover:bg-muted" : "opacity-30 cursor-not-allowed"
              )}
              onClick={() => clipboard && handlePaste(contextMenu.side)}
              disabled={!clipboard}
            >
              <ClipboardPaste className="w-3.5 h-3.5" /> Paste
            </button>
            
            <div className="h-px bg-border my-1" />

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.item.path);
                setContextMenu(null);
              }}
            >
              <Link className="w-3.5 h-3.5 text-muted-foreground" /> Copy Path
            </button>
            
            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                handleRename(contextMenu.side, contextMenu.item);
                setContextMenu(null);
              }}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Rename
            </button>

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-red-500/10 text-red-500 flex items-center gap-2"
              onClick={() => {
                const pane = contextMenu.side === 'left' ? leftPane : rightPane;
                const tab = getActiveTab(pane);
                const selected = tab.items.filter(i => tab.selectedItems.includes(i.path));
                handleDelete(contextMenu.side, selected.length > 0 ? selected : [contextMenu.item]);
                setContextMenu(null);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>

            <div className="h-px bg-border my-1" />

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                refreshPane(contextMenu.side);
                setContextMenu(null);
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Refresh
            </button>

            <div className="h-px bg-border my-1" />

            {/* View Mode Submenu */}
            <div className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase">Display</div>
            <div className="flex px-1 gap-1 mb-1">
              <button 
                onClick={() => { updateActiveTab(contextMenu.side, { viewMode: 'icons' }); setContextMenu(null); }}
                className={cn("p-1.5 rounded flex-1 flex justify-center", getActiveTab(contextMenu.side === 'left' ? leftPane : rightPane).viewMode === 'icons' ? "bg-accent text-white" : "hover:bg-muted")}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => { updateActiveTab(contextMenu.side, { viewMode: 'list' }); setContextMenu(null); }}
                className={cn("p-1.5 rounded flex-1 flex justify-center", getActiveTab(contextMenu.side === 'left' ? leftPane : rightPane).viewMode === 'list' ? "bg-accent text-white" : "hover:bg-muted")}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => { updateActiveTab(contextMenu.side, { viewMode: 'details' }); setContextMenu(null); }}
                className={cn("p-1.5 rounded flex-1 flex justify-center", getActiveTab(contextMenu.side === 'left' ? leftPane : rightPane).viewMode === 'details' ? "bg-accent text-white" : "hover:bg-muted")}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Submenu */}
            <div className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase">Sort By</div>
            <div className="flex px-1 gap-1 mb-1">
              <button 
                onClick={() => { updateActiveTab(contextMenu.side, { sortBy: 'name' }); setContextMenu(null); }}
                className={cn("p-1.5 rounded flex-1 text-[8px] flex flex-col items-center justify-center gap-1", getActiveTab(contextMenu.side === 'left' ? leftPane : rightPane).sortBy === 'name' ? "bg-accent text-white" : "hover:bg-muted")}
                title="Name"
              >
                Name
              </button>
              <button 
                onClick={() => { updateActiveTab(contextMenu.side, { sortBy: 'size' }); setContextMenu(null); }}
                className={cn("p-1.5 rounded flex-1 text-[8px] flex flex-col items-center justify-center gap-1", getActiveTab(contextMenu.side === 'left' ? leftPane : rightPane).sortBy === 'size' ? "bg-accent text-white" : "hover:bg-muted")}
                title="Size"
              >
                Size
              </button>
              <button 
                onClick={() => { updateActiveTab(contextMenu.side, { sortBy: 'date' }); setContextMenu(null); }}
                className={cn("p-1.5 rounded flex-1 text-[8px] flex flex-col items-center justify-center gap-1", getActiveTab(contextMenu.side === 'left' ? leftPane : rightPane).sortBy === 'date' ? "bg-accent text-white" : "hover:bg-muted")}
                title="Date"
              >
                Date
              </button>
            </div>

            <div className="h-px bg-border my-1" />

            <button 
              className="w-full px-3 py-1.5 text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                setShowProperties({ item: contextMenu.item });
                setContextMenu(null);
              }}
            >
              <Info className="w-3.5 h-3.5 text-muted-foreground" /> Properties
            </button>
          </div>
        </>
      )}

      {/* Connection Manager Modal */}
      {showConnectionManager && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card/90 border border-border/50 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--accent)]/10 rounded-2xl text-[var(--accent)]">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{t.connections}</h3>
                  <p className="text-xs text-muted-foreground">Manage your saved local and remote locations</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowConnectionManager(false); setEditingConnection(null); }} 
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex divide-x divide-border/50">
              {/* Sidebar List */}
              <div className="w-80 flex flex-col bg-muted/10">
                <div className="p-4">
                  <button 
                    onClick={() => {
                      setEditingConnection(null);
                      setConnForm({ name: '', type: 'remote', source: 'http', url: '', username: '', password: '', port: 80 });
                    }}
                    className="w-full p-3 border-2 border-dashed border-border rounded-2xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 flex items-center justify-center gap-2 text-sm font-bold transition-all text-[var(--accent)]"
                  >
                    <Plus className="w-4 h-4" /> {t.addConnection}
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 space-y-2">
                  {savedConnections.map(conn => (
                    <div 
                      key={conn.id}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer group relative",
                        editingConnection?.id === conn.id 
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-lg shadow-[var(--accent)]/5" 
                          : "border-transparent hover:bg-muted hover:border-border/50"
                      )}
                      onClick={() => {
                        setEditingConnection(conn);
                        setConnForm(conn);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-xl",
                          editingConnection?.id === conn.id ? "bg-[var(--accent)] text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {conn.type === 'local' ? <Monitor className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{conn.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate uppercase">{conn.source || 'LOCAL'}</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateConnections(savedConnections.filter(c => c.id !== conn.id));
                          }}
                          className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {savedConnections.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <RefreshCw className="w-6 h-6 opacity-20" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">No saved connections</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              <div className="flex-1 flex flex-col bg-background/50">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  <div className="max-w-xl mx-auto space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.name}</label>
                        <input 
                          type="text" 
                          placeholder="My Server"
                          className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                          value={connForm.name}
                          onChange={e => setConnForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.type}</label>
                        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-2xl border border-border/50">
                          <button
                            onClick={() => setConnForm(prev => ({ ...prev, type: 'local' }))}
                            className={cn(
                              "py-2 rounded-xl text-xs font-bold transition-all",
                              connForm.type === 'local' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Local
                          </button>
                          <button
                            onClick={() => setConnForm(prev => ({ ...prev, type: 'remote' }))}
                            className={cn(
                              "py-2 rounded-xl text-xs font-bold transition-all",
                              connForm.type === 'remote' ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Remote
                          </button>
                        </div>
                      </div>
                    </div>

                    {connForm.type === 'remote' && (
                      <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.protocol}</label>
                          <div className="grid grid-cols-4 gap-2">
                            {(['http', 'ftp', 'sftp', 'smb', 'webdav', 'nfs'] as const).map(p => (
                              <button
                                key={p}
                                onClick={() => setConnForm(prev => ({ ...prev, source: p, port: getDefaultPort(p, connForm.url || '') }))}
                                className={cn(
                                  "py-2.5 rounded-xl text-[10px] font-bold border transition-all uppercase",
                                  connForm.source === p 
                                    ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20" 
                                    : "bg-muted/30 border-border/50 text-muted-foreground hover:border-muted-foreground"
                                )}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.url}</label>
                          <div className="relative">
                            <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input 
                              type="text" 
                              placeholder="https://example.com"
                              className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                              value={connForm.url}
                              onChange={e => setConnForm(prev => ({ ...prev, url: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.username}</label>
                            <input 
                              type="text" 
                              className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                              value={connForm.username}
                              onChange={e => setConnForm(prev => ({ ...prev, username: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.password}</label>
                            <input 
                              type="password" 
                              className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                              value={connForm.password}
                              onChange={e => setConnForm(prev => ({ ...prev, password: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.port}</label>
                          <input 
                            type="number" 
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                            value={connForm.port}
                            onChange={e => setConnForm(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                    )}

                    {connForm.type === 'local' && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Local Path</label>
                        <div className="relative">
                          <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type="text" 
                            placeholder="/home/user/files"
                            className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                            value={connForm.url}
                            onChange={e => setConnForm(prev => ({ ...prev, url: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-top border-border/50 flex gap-4 bg-muted/10">
                  <button
                    onClick={() => {
                      const newConn = { ...connForm, id: editingConnection?.id || Math.random().toString(36).substr(2, 9) } as SavedConnection;
                      if (editingConnection) {
                        onUpdateConnections(savedConnections.map(c => c.id === newConn.id ? newConn : c));
                        alert('Connection updated');
                      } else {
                        onUpdateConnections([...savedConnections, newConn]);
                        alert('Connection saved');
                      }
                      setEditingConnection(null);
                      setConnForm({ name: '', type: 'remote', source: 'http', url: '', username: '', password: '', port: 80 });
                    }}
                    className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-bold shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={!connForm.name || !connForm.url}
                  >
                    {editingConnection ? 'Update Connection' : 'Save Connection'}
                  </button>
                  {editingConnection && (
                    <button
                      onClick={() => {
                        const side = activePane;
                        const setPane = side === 'left' ? setLeftPane : setRightPane;
                        const targetSide = side === 'left' ? leftPane : rightPane;
                        
                        setPane(prev => ({
                          ...prev,
                          type: editingConnection.type,
                          source: editingConnection.source || 'http',
                          url: editingConnection.url,
                          path: editingConnection.type === 'local' ? editingConnection.url : '/',
                          username: editingConnection.username,
                          password: editingConnection.password,
                          port: editingConnection.port
                        }));
                        setShowConnectionManager(false);
                      }}
                      className="px-8 py-4 bg-foreground text-background rounded-2xl font-bold hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t.connect}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Direct Connect Modal */}
      {showDirectConnect && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-card/90 border border-border/50 rounded-3xl p-8 w-full max-w-md shadow-2xl overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[var(--accent)]/10 rounded-2xl text-[var(--accent)]">
                  <Link className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{t.directConnect}</h3>
                  <p className="text-xs text-muted-foreground">Quickly connect to a temporary location</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDirectConnect(null)} 
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.protocol}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['http', 'ftp', 'sftp', 'smb', 'webdav', 'nfs'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setDirectConnectSource(p);
                        const setPane = showDirectConnect.side === 'left' ? setLeftPane : setRightPane;
                        setPane(prev => ({ ...prev, port: getDefaultPort(p, directConnectUrl) }));
                      }}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-bold border transition-all uppercase",
                        directConnectSource === p 
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20" 
                          : "bg-muted/30 border-border/50 text-muted-foreground hover:border-muted-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.url}</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={directConnectSource === 'http' ? 'https://server.com/files' : `${directConnectSource}://server.com`}
                    className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all placeholder:opacity-30"
                    value={directConnectUrl}
                    onChange={(e) => {
                      setDirectConnectUrl(e.target.value);
                      const setPane = showDirectConnect.side === 'left' ? setLeftPane : setRightPane;
                      setPane(prev => ({ ...prev, port: getDefaultPort(directConnectSource, e.target.value) }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.username}</label>
                  <input
                    type="text"
                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                    value={(showDirectConnect.side === 'left' ? leftPane : rightPane).username || ''}
                    onChange={(e) => {
                      const setPane = showDirectConnect.side === 'left' ? setLeftPane : setRightPane;
                      setPane(prev => ({ ...prev, username: e.target.value }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.password}</label>
                  <input
                    type="password"
                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                    value={(showDirectConnect.side === 'left' ? leftPane : rightPane).password || ''}
                    onChange={(e) => {
                      const setPane = showDirectConnect.side === 'left' ? setLeftPane : setRightPane;
                      setPane(prev => ({ ...prev, password: e.target.value }));
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t.port}</label>
                <input
                  type="number"
                  className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] outline-none transition-all"
                  value={(showDirectConnect.side === 'left' ? leftPane : rightPane).port || getDefaultPort(directConnectSource, directConnectUrl)}
                  onChange={(e) => {
                    const setPane = showDirectConnect.side === 'left' ? setLeftPane : setRightPane;
                    setPane(prev => ({ ...prev, port: parseInt(e.target.value) }));
                  }}
                />
              </div>

              <button
                onClick={() => handleDirectConnect(showDirectConnect.side)}
                className="w-full py-4 bg-[var(--accent)] text-white rounded-2xl font-bold shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
                disabled={!directConnectUrl}
              >
                {t.connect}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Properties Modal */}
      {showProperties && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                {t.properties}
              </h3>
              <button onClick={() => setShowProperties(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4 bg-muted/30 rounded-xl mb-4">
                {showProperties.item.type === 'directory' ? <Folder className="w-16 h-16 text-amber-500 mb-2" /> : <FileText className="w-16 h-16 text-blue-500 mb-2" />}
                <span className="font-bold text-center px-4 break-all">{showProperties.item.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">{t.type}:</span>
                <span className="font-medium capitalize">{showProperties.item.type}</span>
                
                <span className="text-muted-foreground">{t.size}:</span>
                <span className="font-medium">{showProperties.item.type === 'directory' ? '--' : formatSize(showProperties.item.size)}</span>
                
                <span className="text-muted-foreground">{t.modified}:</span>
                <span className="font-medium">{new Date(showProperties.item.modified).toLocaleString()}</span>
                
                <span className="text-muted-foreground">{t.path}:</span>
                <span className="font-medium break-all text-xs">{showProperties.item.path}</span>
              </div>

              <button
                onClick={() => setShowProperties(null)}
                className="w-full py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-all mt-4"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* File Preview */}
      {showPreview && (
        <FilePreview 
          item={showPreview.item} 
          source={showPreview.side === 'left' ? (leftPane.type === 'local' ? 'local' : leftPane.source) : (rightPane.type === 'local' ? 'local' : rightPane.source)}
          url={showPreview.side === 'left' ? leftPane.url : rightPane.url}
          username={showPreview.side === 'left' ? leftPane.username : rightPane.username}
          password={showPreview.side === 'left' ? leftPane.password : rightPane.password}
          port={showPreview.side === 'left' ? leftPane.port : rightPane.port}
          onClose={() => setShowPreview(null)}
          onEdit={() => {
            const side = showPreview.side;
            const item = showPreview.item;
            const pane = side === 'left' ? leftPane : rightPane;
            const query = new URLSearchParams({
              source: pane.type === 'local' ? 'local' : pane.source,
              url: pane.url || '',
              path: item.path || item.name
            });
            if (pane.username) query.set('username', pane.username);
            if (pane.password) query.set('password', pane.password);
            if (pane.port) query.set('port', pane.port.toString());

            fetch(`/api/explorer/preview?${query.toString()}`)
              .then(res => res.text())
              .then(content => {
                setShowEditor({ item, side, content });
                setShowPreview(null);
              });
          }}
        />
      )}

      {/* Code Editor */}
      {showEditor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold truncate text-slate-900 dark:text-slate-100">
                  {t.edit || 'Edit'}: {showEditor.item.name}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveFile}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 active:scale-95 transition-all text-sm font-bold shadow-lg shadow-[var(--accent)]/20"
                >
                  {t.save || 'Save'}
                </button>
                <button 
                  onClick={() => setShowEditor(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <textarea 
              className="flex-1 p-6 font-mono text-sm bg-white dark:bg-slate-950 outline-none resize-none selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)]"
              value={showEditor.content}
              onChange={(e) => setShowEditor(prev => prev ? { ...prev, content: e.target.value } : null)}
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Chmod Dialog */}
      {showChmod && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in scale-in-95 duration-200">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-[var(--accent)]/10 rounded-2xl text-[var(--accent)] mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{t.permissions || 'File Permissions'}</h3>
              <p className="text-xs text-muted-foreground">Change access mode for {showChmod.item.name}</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">{t.mode || 'Mode (Octal)'}</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-muted/50 border-2 border-border/50 rounded-xl px-4 py-3 text-lg font-mono text-center outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 transition-all"
                    value={chmodValue}
                    onChange={(e) => setChmodValue(e.target.value)}
                    placeholder="644"
                    maxLength={4}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowChmod(null)}
                  className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold transition-all text-foreground active:scale-95"
                >
                  {t.cancel || 'Cancel'}
                </button>
                <button 
                  onClick={handleChmod}
                  className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl font-bold shadow-xl shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {t.apply || 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--accent)]" />
                Transfer Logs
              </h3>
              <button onClick={() => setShowLogs(null)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">File</th>
                    <th className="text-left p-2">Source</th>
                    <th className="text-left p-2">Dest</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transferLogs.map((log, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-2 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-2 font-medium">{log.fileName}</td>
                      <td className="p-2 truncate max-w-[150px] text-xs" title={log.source}>{log.source}</td>
                      <td className="p-2 truncate max-w-[150px] text-xs" title={log.dest}>{log.dest}</td>
                      <td className="p-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
