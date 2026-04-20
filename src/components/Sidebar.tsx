/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ChevronDown, ChevronRight, Code, Film, Folder, LucideIcon, Wrench,
  Terminal, Cpu, Settings, Package, Box, Layers, Monitor, Smartphone, Globe,
  Music, Camera, Gamepad2, Book, Heart, Star, Cloud, Zap, Shield, 
  Anchor, Coffee, Gift, Home, Mail, Map, Phone, Search, User, Users, Bell, Calendar, Clock, Hammer, Mountain,
  Github, Gitlab, Gamepad, Disc, MonitorPlay, Joystick, Filter, MoreVertical, RefreshCw, ShieldCheck, Download, Settings as SettingsIcon, ExternalLink, Layout, FolderTree, HardDrive, GitBranch
} from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Category, Repository, Release, AppSettings } from '../types';
import { useTranslation } from '../lib/i18n';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'motion/react';

const ICON_MAP: Record<string, LucideIcon> = {
  Code, Wrench, Film, Folder, Terminal, Cpu, Settings, 
  Package, Box, Layers, Monitor, Smartphone, Globe,
  Music, Camera, Gamepad2, Book, Heart, Star, Cloud, 
  Zap, Shield, Anchor, Coffee, Gift, Home, Mail, 
  Map, Phone, Search, User, Users, Bell, Calendar, Clock,
  Gamepad, Disc, MonitorPlay, Joystick
};

// Console-like icons mapping
const CONSOLE_ICONS: Record<string, LucideIcon> = {
  'PlayStation': Disc,
  'Xbox': Gamepad,
  'Nintendo': MonitorPlay,
  'Sega': Joystick
};

interface SidebarProps {
  categories: Category[];
  repositories: Repository[];
  activeCategoryPath: string[];
  activeRepoId: string | null;
  onSelect: (path: string[], repoId?: string | null) => void;
  onMoveRepo?: (repoId: string, newCategoryPath: string[]) => void;
  language?: string;
  width?: number;
  onResizeStart?: () => void;
  isFavoritesView?: boolean;
  onToggleFavorite?: (id: string) => void;
  onRefreshRepo?: (id: string) => void;
  onToggleBackup?: (id: string) => void;
  onDownloadSource?: (rel: Release) => void;
  onEditRepo?: (id: string) => void;
  onSettingsChange: (settings: AppSettings) => void;
  allReleases?: Release[];
  settings: AppSettings;
}

function DraggableRepo({ repo, currentPath, activeRepoId, onSelect, onContextMenu, settings, viewMode }: { 
  repo: Repository, 
  currentPath: string[], 
  activeRepoId: string | null, 
  onSelect: (path: string[], repoId?: string | null) => void,
  onContextMenu: (e: React.MouseEvent, repo: Repository) => void,
  settings: AppSettings,
  viewMode?: 'cascading' | 'list',
  key?: React.Key
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `repo-${repo.id}`,
    data: { repoId: repo.id }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const renderIcon = () => {
    const customIcon = settings.serviceIcons?.[repo.source];
    if (customIcon) return <img src={customIcon} alt="" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />;

    if (repo.source === 'github') return <Github className="w-3.5 h-3.5" />;
    if (repo.source === 'gitlab') return <Gitlab className="w-3.5 h-3.5" />;
    if (repo.source === 'gitea') return <Coffee className="w-3.5 h-3.5" />;
    if (repo.source === 'codeberg') return <Mountain className="w-3.5 h-3.5" />;
    if (repo.source === 'git') return <GitBranch className="w-3.5 h-3.5" />;
    if (['ftp', 'sftp', 'smb', 'webdav', 'nfs'].includes(repo.source)) return <FolderTree className="w-3.5 h-3.5" />;
    if (repo.source.startsWith('android_')) return <Smartphone className="w-3.5 h-3.5" />;
    if (repo.source === 'forgejo') {
      if (repo.url.includes('codeberg.org')) {
        const codebergIcon = settings.serviceIcons?.['codeberg'];
        if (codebergIcon) return <img src={codebergIcon} alt="" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />;
        return <Mountain className="w-3.5 h-3.5" />;
      }
      return <Hammer className="w-3.5 h-3.5" />;
    }
    return <Globe className="w-3.5 h-3.5" />;
  };

  return (
    <div className="group/repo relative" ref={setNodeRef} style={style}>
      <div className="flex items-center w-full h-full">
        <button
          {...listeners}
          {...attributes}
          className="p-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          title="Drag to move"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
        <button
          onClick={() => onSelect(currentPath, repo.id)}
          onContextMenu={(e) => onContextMenu(e, repo)}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left truncate pr-8",
            activeRepoId === repo.id
              ? "text-[var(--accent)] font-medium bg-accent/5"
              : "text-muted-foreground hover:text-foreground",
            isDragging && "opacity-50"
          )}
        >
          <div>
            {renderIcon()}
          </div>
          <span className="truncate w-full">{repo.name}</span>
        </button>
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e, repo);
        }}
        className="absolute p-1 opacity-0 group-hover/repo:opacity-100 hover:bg-muted rounded text-muted-foreground transition-all right-1 top-1/2 -translate-y-1/2"
      >
        <MoreVertical className="w-3 h-3" />
      </button>
    </div>
  );
}

function DroppableCategory({ cat, currentPath, isExpanded, isActive, activeRepoId, onSelect, toggleExpand, t, children, viewMode }: {
  cat: Category,
  currentPath: string[],
  isExpanded: boolean,
  isActive: boolean,
  activeRepoId: string | null,
  onSelect: (path: string[], repoId?: string | null) => void,
  toggleExpand: (id: string) => void,
  t: any,
  children?: React.ReactNode,
  viewMode?: 'list' | 'cascading',
  key?: React.Key
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cat-${cat.id}`,
    data: { path: currentPath }
  });

  return (
    <div ref={setNodeRef} className={cn(
      "rounded-md transition-colors", 
      isOver && "bg-accent/5 ring-1 ring-accent/20",
      "space-y-1"
    )}>
      <div className={cn("flex items-center group")}>
        <button
          onClick={() => toggleExpand(cat.id)}
          className="p-1 hover:bg-muted rounded text-muted-foreground"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <button
          onClick={() => onSelect(currentPath, null)}
          onDoubleClick={() => toggleExpand(cat.id)}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors text-left",
            isActive && !activeRepoId ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <div 
            className={cn(
              "p-1 rounded flex items-center justify-center w-6 h-6", 
              !cat.color && "text-[var(--accent)]"
            )}
            style={cat.color ? { backgroundColor: cat.color + '20', color: cat.color } : {}}
          >
            {cat.customIcon ? (
              <img src={cat.customIcon} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
            ) : (
              (() => {
                const Icon = ICON_MAP[cat.icon] || CONSOLE_ICONS[cat.icon] || Folder;
                return <Icon className="w-3.5 h-3.5" />;
              })()
            )}
          </div>
          <span className="truncate w-full">{cat.id === 'uncategorized' ? t('categories.uncategorized') : cat.name}</span>
        </button>
      </div>
      {children}
    </div>
  );
}

export function Sidebar({ 
  categories, 
  repositories, 
  activeCategoryPath, 
  activeRepoId, 
  onSelect, 
  onMoveRepo,
  language = 'en',
  width = 256,
  onResizeStart,
  isFavoritesView = false,
  onToggleFavorite,
  onRefreshRepo,
  onToggleBackup,
  onDownloadSource,
  onEditRepo,
  onSettingsChange,
  allReleases = [],
  settings
}: SidebarProps) {
  const { t } = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, repo: Repository } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach(c => initial[c.id] = true);
    return initial;
  });

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRepoContextMenu = (e: React.MouseEvent, repo: Repository) => {
    e.preventDefault();
    e.stopPropagation();
    
    let x = e.clientX;
    let y = e.clientY;
    
    const menuWidth = 208;
    const menuHeight = 280;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
    
    setContextMenu({ x, y, repo });
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const repoId = active.data.current?.repoId;
      const newPath = over.data.current?.path;
      if (repoId && newPath && onMoveRepo) {
        onMoveRepo(repoId, newPath);
      }
    }
  };

  const filteredRepositories = useMemo(() => {
    if (!searchQuery) return repositories;
    const query = searchQuery.toLowerCase();
    return repositories.filter(r => 
      r.name.toLowerCase().includes(query) || 
      (r.owner && r.owner.toLowerCase().includes(query))
    );
  }, [repositories, searchQuery]);

  const sortedCategories = [...(categories || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const renderCategory = (cat: Category, path: string[], level: number = 0) => {
    if (level >= 5) return null; // Limit to 5 levels

    const currentPath = [...path, cat.id];
    const isExpanded = expanded[cat.id];
    const isActive = activeCategoryPath.length === currentPath.length && activeCategoryPath.every((id, i) => id === currentPath[i]);
    
    // Filter repos that belong exactly to this category path
    const catRepos = filteredRepositories.filter(r => 
      r.categoryPath && 
      r.categoryPath.length === currentPath.length && 
      r.categoryPath.every((id, i) => id === currentPath[i])
    );

    // If searching, only show category if it has matching repos or children with matching repos
    if (searchQuery && catRepos.length === 0) {
      const hasMatchingChildren = (c: Category): boolean => {
        const childPath = [...currentPath, c.id];
        const matchingRepos = filteredRepositories.filter(r => 
          r.categoryPath && 
          r.categoryPath.length === childPath.length && 
          r.categoryPath.every((id, i) => id === childPath[i])
        );
        if (matchingRepos.length > 0) return true;
        return (c.children || []).some(hasMatchingChildren);
      };
      if (!(cat.children || []).some(hasMatchingChildren)) return null;
    }

    return (
      <div className="contents" key={cat.id}>
        <DroppableCategory
          cat={cat}
          currentPath={currentPath}
          isExpanded={isExpanded}
          isActive={isActive}
          activeRepoId={activeRepoId}
          onSelect={onSelect}
          toggleExpand={toggleExpand}
          t={t}
          viewMode={settings.sidebarViewMode}
        >
          {isExpanded && (
            <div className={cn(
              "space-y-1",
              settings.sidebarViewMode === 'cascading' ? "ml-4 border-l border-border/50 pl-2" : "ml-0 pl-0"
            )}>
              {/* Repos in this category */}
              {catRepos.map(repo => (
                <DraggableRepo
                  key={`repo-${repo.id}`}
                  repo={repo}
                  currentPath={currentPath}
                  activeRepoId={activeRepoId}
                  onSelect={onSelect}
                  onContextMenu={handleRepoContextMenu}
                  settings={settings}
                  viewMode={settings.sidebarViewMode}
                />
              ))}

              {/* Sub-categories (Recursive) */}
              {([...(cat.children || [])]).sort((a, b) => (a.order || 0) - (b.order || 0)).map(child => 
                renderCategory(child, currentPath, level + 1)
              )}
            </div>
          )}
        </DroppableCategory>
      </div>
    );
  };

  return (
    <div 
      className="h-full border-r border-border bg-muted/30 flex flex-col relative group/sidebar"
      style={{ width: `${width}px` }}
    >
      <div className="p-4 border-b border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isFavoritesView ? t('common.favorites') : t('common.dashboard')}
          </h2>
          <div className="flex items-center gap-1 bg-muted/50 border border-border rounded p-0.5">
            <button
              onClick={() => onSettingsChange({ ...settings, sidebarViewMode: 'cascading' })}
              className={cn(
                "p-1 rounded transition-all",
                settings.sidebarViewMode === 'cascading' ? "bg-card shadow-sm text-[var(--accent)]" : "text-muted-foreground hover:text-foreground"
              )}
              title="Cascading View"
            >
              <FolderTree className="w-3 h-3" />
            </button>
            <button
              onClick={() => onSettingsChange({ ...settings, sidebarViewMode: 'list' })}
              className={cn(
                "p-1 rounded transition-all",
                settings.sidebarViewMode === 'list' ? "bg-card shadow-sm text-[var(--accent)]" : "text-muted-foreground hover:text-foreground"
              )}
              title="List View"
            >
              <Layout className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="space-y-1">
            {!isFavoritesView && (
              <button
                key="all-repos"
                onClick={() => onSelect([], null)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full",
                  activeCategoryPath.length === 0 ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Folder className="w-4 h-4" />
                <span className="truncate w-full">{t('common.all')}</span>
              </button>
            )}

            {sortedCategories.map((cat) => renderCategory(cat, []))}
          </div>
        </DndContext>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onResizeStart?.();
        }}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--accent)]/50 transition-colors group-hover/sidebar:bg-border/50"
      />

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'fixed', 
              top: contextMenu.y, 
              left: contextMenu.x,
              zIndex: 1000
            }}
            className="w-52 bg-card border border-border rounded-xl shadow-2xl p-1.5 backdrop-blur-xl"
          >
            <button
              onClick={() => {
                onToggleFavorite?.(contextMenu.repo.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              <Star className={cn("w-4 h-4", contextMenu.repo.isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
              {contextMenu.repo.isFavorite ? t('common.removeFavorite') : t('common.addFavorite')}
            </button>

            <button
              onClick={() => {
                onRefreshRepo?.(contextMenu.repo.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              {t('common.updateRepo')}
            </button>

            <button
              onClick={() => {
                onToggleBackup?.(contextMenu.repo.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              <ShieldCheck className={cn("w-4 h-4", contextMenu.repo.backupEnabled ? "text-green-500" : "text-muted-foreground")} />
              {contextMenu.repo.backupEnabled ? t('common.autoBackupOff') : t('common.autoBackupOn')}
            </button>

            <div className="h-px bg-border my-1" />

            <button
              onClick={() => {
                const latestRel = allReleases.find(r => r.repoId === contextMenu.repo.id);
                if (latestRel) onDownloadSource?.(latestRel);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
              {t('common.downloadSource')}
            </button>

            <button
              onClick={() => {
                onEditRepo?.(contextMenu.repo.id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              {t('common.editRepo')}
            </button>

            <a
              href={contextMenu.repo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setContextMenu(null)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
              {t('common.openRepo')}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
