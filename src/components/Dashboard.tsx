/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDistanceToNow } from 'date-fns';
import { Download, ExternalLink, Filter, Github, Gitlab, Globe, Search, SortAsc, SortDesc, Code, ShieldCheck, History, Star, RefreshCw, Settings as SettingsIcon, Trash2, MoreVertical, Coffee, Hammer, Mountain, ChevronRight, Folder, FileText, Tag, CheckCircle2, FolderTree, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { AppSettings, OS, Release, Repository } from '../types';
import { useTranslation } from '../lib/i18n';
import { Box, Layout as LayoutIcon, Columns } from 'lucide-react';

interface DashboardProps {
  releases: Release[];
  repositories: Repository[];
  activeCategoryPath: string[];
  activeRepoId: string | null;
  loading: boolean;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onToggleFavorite: (id: string) => void;
  onRefreshRepo: (id: string, overrideUrl?: string) => void;
  onToggleBackup: (id: string) => void;
  onDownloadSource: (rel: Release) => void;
  onEditRepo: (id: string) => void;
}

export function Dashboard({ 
  releases, 
  repositories, 
  activeCategoryPath, 
  activeRepoId, 
  loading, 
  settings, 
  onSettingsChange,
  onToggleFavorite,
  onRefreshRepo,
  onToggleBackup,
  onDownloadSource,
  onEditRepo
}: DashboardProps) {
  const { t } = useTranslation(settings.language);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [osFilter, setOsFilter] = useState<OS | 'All'>('All');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rel: Release } | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRepoId) {
      const repo = repositories.find(r => r.id === activeRepoId);
      if (repo) {
        setCurrentUrl(repo.url);
        // If it's an explorer-like repo, we might want to ensure we're showing the root contents
        // especially if we were navigating subdirectories before
        const isExplorerSource = ['http', 'ftp', 'smb', 'webdav', 'nfs'].includes(repo.source);
        if (isExplorerSource) {
          onRefreshRepo(repo.id, repo.url);
          // Set explorer view as default for explorer repos if not already set
          if (settings.dashboardLayout !== 'explorer') {
            onSettingsChange({ ...settings, dashboardLayout: 'explorer' });
          }
        }
      }
    } else {
      setCurrentUrl(null);
    }
  }, [activeRepoId]); // Removed repositories from deps to avoid infinite loops if onRefreshRepo updates them

  const breadcrumbs = useMemo(() => {
    if (!activeRepoId || !currentUrl) return [];
    const repo = repositories.find(r => r.id === activeRepoId);
    if (!repo) return [];

    const base = repo.url.replace(/\/+$/, '');
    const current = currentUrl.replace(/\/+$/, '');
    
    if (current === base) return [{ name: repo.name, url: repo.url }];

    const relative = current.replace(base, '').replace(/^\/+/, '');
    const parts = relative.split('/').filter(Boolean);
    
    const crumbs = [{ name: repo.name, url: repo.url }];
    let runningUrl = base;
    
    parts.forEach(part => {
      runningUrl += `/${part}`;
      crumbs.push({ name: part, url: runningUrl + '/' });
    });
    
    return crumbs;
  }, [activeRepoId, currentUrl, repositories]);

  const handleNavigate = (url: string) => {
    if (!activeRepoId) return;
    setCurrentUrl(url);
    onRefreshRepo(activeRepoId, url);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, rel: Release) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure menu stays within viewport
    let x = e.clientX;
    let y = e.clientY;
    
    const menuWidth = 208; // w-52 = 13rem = 208px
    const menuHeight = 300; // approximate
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setContextMenu({ x, y, rel });
  };

  const filteredReleases = useMemo(() => {
    // 1. Initial filter by search and OS (common to all views)
    let baseReleases = releases.filter(rel => {
      const repo = repositories.find(r => r.id === rel.repoId);
      if (!repo) return false;

      // OS filter
      if (osFilter !== 'All' && !repo.osTags.includes(osFilter)) return false;

      // Release filters (Pre-releases / Drafts)
      // Note: We'd need this info from the API, for now we assume all are stable if not specified
      if (!repo.showPreReleases && rel.tagName.toLowerCase().includes('pre')) return false;
      if (!repo.showDrafts && rel.tagName.toLowerCase().includes('draft')) return false;

      // Search filter
      const searchLower = search.toLowerCase();
      return (
        rel.repoName.toLowerCase().includes(searchLower) ||
        rel.name.toLowerCase().includes(searchLower) ||
        rel.tagName.toLowerCase().includes(searchLower)
      );
    });

    // 2. Apply specific view logic
    if (activeRepoId) {
      // Show more latest for specific repo (up to 100)
      let repoReleases = baseReleases.filter(rel => rel.repoId === activeRepoId);
      repoReleases.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      return repoReleases.slice(0, 100);
    } else {
      // Show latest release for each repository matching category path
      const reposToInclude = repositories.filter(repo => {
        if (activeCategoryPath.length === 0) return true;
        // Check if repo's category path starts with activeCategoryPath
        return activeCategoryPath.every((id, i) => repo.categoryPath[i] === id);
      });

      const latestPerRepo = reposToInclude.map(repo => {
        const repoReleases = baseReleases.filter(rel => rel.repoId === repo.id);
        if (repoReleases.length === 0) return null;
        // Sort to find latest
        return repoReleases.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
      }).filter((rel): rel is Release => rel !== null);

      // Sort the final list of latest releases
      latestPerRepo.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      return latestPerRepo;
    }
  }, [releases, repositories, activeCategoryPath, activeRepoId, osFilter, search, sortOrder]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 gap-4 z-30 sticky top-0">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-lg p-1 mr-2">
            {(['list', 'columns', 'explorer'] as const).map(layout => {
              const activeRepo = activeRepoId ? repositories.find(r => r.id === activeRepoId) : null;
              const isExplorerSource = activeRepo && ['http', 'ftp', 'sftp', 'smb', 'webdav', 'nfs', 's3', 'rclone'].includes(activeRepo.source);
              
              if (layout === 'explorer' && !isExplorerSource) return null;

              return (
                <button
                  key={layout}
                  onClick={() => onSettingsChange({ ...settings, dashboardLayout: layout })}
                  className={cn(
                    "p-1.5 rounded transition-all",
                    settings.dashboardLayout === layout ? "bg-card shadow-sm text-[var(--accent)]" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`Switch to ${layout} view`}
                >
                  {layout === 'list' && <LayoutIcon className="w-4 h-4" />}
                  {layout === 'columns' && <Columns className="w-4 h-4" />}
                  {layout === 'explorer' && <FolderTree className="w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-lg p-1">
            <button
              onClick={() => setSortOrder('desc')}
              className={cn("p-1.5 rounded", sortOrder === 'desc' ? "bg-card shadow-sm text-[var(--accent)]" : "text-muted-foreground")}
              title="Sort Newest First"
            >
              <SortDesc className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={cn("p-1.5 rounded", sortOrder === 'asc' ? "bg-card shadow-sm text-[var(--accent)]" : "text-muted-foreground")}
              title="Sort Oldest First"
            >
              <SortAsc className="w-4 h-4" />
            </button>
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground">
              <Filter className="w-4 h-4" />
              {osFilter}
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {['All', 'Windows', 'Linux', 'macOS', 'Android', 'iOS'].map((os) => (
                <button
                  key={os}
                  onClick={() => setOsFilter(os as any)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
                >
                  {os}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeRepoId && repositories.find(r => r.id === activeRepoId) && (
          <div className="mb-6">
            <div className="flex items-center gap-4 p-4 bg-accent/5 border border-accent/20 rounded-2xl mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/20">
                {repositories.find(r => r.id === activeRepoId)?.source === 'github' ? <Github className="w-7 h-7" /> : <Globe className="w-7 h-7" />}
              </div>
              <div>
                <h2 className="text-xl font-bold">{repositories.find(r => r.id === activeRepoId)?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {['http', 'ftp', 'smb', 'webdav', 'nfs'].includes(repositories.find(r => r.id === activeRepoId)?.source || '') ? 'File Explorer Mode' : 'Showing last versions'}
                </p>
              </div>
            </div>

            {/* Breadcrumbs for Explorer */}
            {['http', 'ftp', 'smb', 'webdav', 'nfs'].includes(repositories.find(r => r.id === activeRepoId)?.source || '') && breadcrumbs.length > 1 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 bg-muted/30 p-2 rounded-lg border border-border/50">
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.url}>
                    {i > 0 && <ChevronRight className="w-4 h-4" />}
                    <button
                      onClick={() => handleNavigate(crumb.url)}
                      className={cn(
                        "hover:text-[var(--accent)] transition-colors px-1 rounded",
                        i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : ""
                      )}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Globe className="w-12 h-12 mb-4 opacity-20" />
            <p>{t('dashboard.noReleases')}</p>
          </div>
        ) : settings.dashboardLayout === 'explorer' && activeRepoId && ['http', 'ftp', 'smb', 'webdav', 'nfs'].includes(repositories.find(r => r.id === activeRepoId)?.source || '') ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Last Modified</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Size</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {breadcrumbs.length > 1 && (
                  <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <Folder className="w-5 h-5 text-amber-500" />
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleNavigate(breadcrumbs[breadcrumbs.length - 2].url)}
                        className="font-medium hover:text-[var(--accent)] hover:underline"
                      >
                        .. (Parent Directory)
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">--</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">--</td>
                    <td className="px-4 py-3 text-right"></td>
                  </tr>
                )}
                {filteredReleases.map((rel, idx) => (
                  <tr 
                    key={`${rel.repoId}-${rel.tagName}`}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      {rel.isDir ? (
                        <Folder className="w-5 h-5 text-amber-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-500" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className={cn(
                            "font-medium truncate max-w-md",
                            rel.isDir ? "cursor-pointer hover:text-[var(--accent)] hover:underline" : ""
                          )}
                          onClick={() => rel.isDir && handleNavigate(rel.htmlUrl)}
                        >
                          {rel.name}
                        </span>
                        {rel.isLatest && (
                          <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase">Latest</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(rel.publishedAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {rel.body.match(/Size:\s*([^\s]+)/)?.[1] || (rel.isDir ? '--' : 'Unknown')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!rel.isDir && (
                          <a
                            href={rel.zipUrl || rel.htmlUrl}
                            className="p-1.5 hover:bg-accent/10 hover:text-[var(--accent)] rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={(e) => handleContextMenu(e, rel)}
                          className="p-1.5 hover:bg-accent/10 hover:text-[var(--accent)] rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={cn(
            settings.dashboardLayout === 'columns' ? "columns-1 md:columns-2 lg:columns-2 gap-6 space-y-6" : "grid gap-6",
            (settings.dashboardLayout === 'list' || settings.dashboardLayout === 'explorer') && "grid-cols-1"
          )}>
            {filteredReleases.map((rel, idx) => (
              <motion.div
                key={`${rel.repoId}-${rel.tagName}-${rel.name}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onContextMenu={(e) => handleContextMenu(e, rel)}
                className={cn(
                  "fluent-card p-5 flex flex-col gap-4 overflow-hidden",
                  settings.dashboardLayout === 'columns' && "break-inside-avoid mb-6"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] relative shrink-0">
                      {(() => {
                        const customIcon = settings.serviceIcons?.[rel.source];
                        if (customIcon) return <img src={customIcon} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />;

                        if (rel.isDir) return <Folder className="w-6 h-6" />;
                        if (['http', 'ftp', 'smb', 'webdav', 'nfs'].includes(rel.source)) return <FileText className="w-6 h-6" />;
                        if (rel.source === 'github') return <Github className="w-6 h-6" />;
                        if (rel.source === 'gitlab') return <Gitlab className="w-6 h-6" />;
                        if (rel.source === 'bitbucket') return <Package className="w-6 h-6" />;
                        if (rel.source === 'gitea') return <Coffee className="w-6 h-6" />;
                        if (rel.source === 'forgejo') {
                          const repo = repositories.find(r => r.id === rel.repoId);
                          if (repo?.url.includes('codeberg.org')) {
                            const codebergIcon = settings.serviceIcons?.['codeberg'];
                            if (codebergIcon) return <img src={codebergIcon} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />;
                            return <Mountain className="w-6 h-6" />;
                          }
                          return <Hammer className="w-6 h-6" />;
                        }
                        return <Globe className="w-6 h-6" />;
                      })()}
                      {repositories.find(r => r.id === rel.repoId)?.backupEnabled && (
                        <div className="absolute -top-1 -right-1 bg-[var(--accent)] text-white p-0.5 rounded-full shadow-sm">
                          <ShieldCheck className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 
                          className={cn(
                            "font-semibold text-lg leading-tight truncate",
                            rel.isDir && "cursor-pointer hover:text-[var(--accent)]"
                          )}
                          onClick={() => rel.isDir && handleNavigate(rel.htmlUrl)}
                        >
                          {rel.name}
                        </h3>
                        {(() => {
                          const repo = repositories.find(r => r.id === rel.repoId);
                          if (repo && repo.lastSeenVersion === rel.tagName) {
                            return <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-bold rounded uppercase tracking-tighter shrink-0">{t('common.new')}</span>;
                          }
                          return null;
                        })()}
                        {rel.isLatest && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[8px] font-bold rounded uppercase tracking-tighter shrink-0 border border-green-500/20">
                            <CheckCircle2 className="w-2 h-2" />
                            Latest
                          </span>
                        )}
                        {rel.version && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-bold rounded uppercase tracking-tighter shrink-0 border border-blue-500/20">
                            <Tag className="w-2 h-2" />
                            {rel.version}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                        {rel.tagName} • {formatDistanceToNow(new Date(rel.publishedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, rel);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContextMenu(e, rel);
                      }}
                      className="p-2 hover:bg-accent/10 hover:text-[var(--accent)] rounded-lg text-muted-foreground transition-all shrink-0 border border-transparent hover:border-accent/20 bg-muted/30"
                      title={t('common.actions') || "Actions"}
                    >
                      <SettingsIcon className="w-4 h-4" />
                    </button>
                    <a
                      href={rel.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {rel.body || "No release notes provided."}
                </div>

                {rel.assets.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Downloads</p>
                      {rel.assets.length > 1 && (
                        <button
                          onClick={() => {
                            rel.assets.forEach(asset => {
                              const a = document.createElement('a');
                              a.href = asset.url;
                              a.download = asset.name;
                              a.target = '_blank';
                              a.click();
                            });
                          }}
                          className="text-[10px] text-[var(--accent)] hover:underline font-medium"
                        >
                          Download All ({rel.assets.length})
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pr-2">
                      {rel.assets.map((asset) => (
                        <a
                          key={asset.url}
                          href={asset.url}
                          className="flex items-center justify-between p-2 rounded bg-muted/50 hover:bg-muted text-sm transition-colors group"
                        >
                          <span className="truncate flex-1 font-medium group-hover:text-[var(--accent)]">{asset.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
                            {asset.size > 0 ? `${(asset.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                          </span>
                          <Download className="w-3.5 h-3.5 ml-2 text-muted-foreground group-hover:text-[var(--accent)]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                  <a
                    href={rel.zipUrl}
                    className="fluent-button-secondary flex-1 gap-2 text-xs py-2"
                  >
                    <Code className="w-4 h-4" />
                    Source Code (ZIP)
                  </a>
                  {(() => {
                    const repo = repositories.find(r => r.id === rel.repoId);
                    if (repo && repo.lastSeenVersion && repo.lastSeenVersion !== rel.tagName && repo.source === 'github') {
                      const match = repo.url.match(/github\.com\/([^/]+)\/([^/]+)/);
                      if (match) {
                        const [, owner, name] = match;
                        const diffUrl = `https://github.com/${owner}/${name}/compare/${repo.lastSeenVersion}...${rel.tagName}`;
                        return (
                          <a
                            href={diffUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="fluent-button-secondary flex-1 gap-2 text-xs py-2 border-[var(--accent)]/30 text-[var(--accent)]"
                          >
                            <History className="w-4 h-4" />
                            Compare Diff
                          </a>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'fixed', 
              left: Math.min(contextMenu.x, window.innerWidth - 220), 
              top: Math.min(contextMenu.y, window.innerHeight - 300),
              zIndex: 100 
            }}
            className="w-52 bg-card border border-border rounded-xl shadow-2xl p-1.5 backdrop-blur-xl"
          >
            {(() => {
              const repo = repositories.find(r => r.id === contextMenu.rel.repoId);
              if (!repo) return null;
              
              return (
                <>
                  <button
                    onClick={() => {
                      onToggleFavorite(repo.id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <Star className={cn("w-4 h-4", repo.isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                    {repo.isFavorite ? t('common.removeFavorite') : t('common.addFavorite')}
                  </button>

                  <button
                    onClick={() => {
                      onRefreshRepo(repo.id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                    {t('common.updateRepo')}
                  </button>

                  <button
                    onClick={() => {
                      onToggleBackup(repo.id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <ShieldCheck className={cn("w-4 h-4", repo.backupEnabled ? "text-green-500" : "text-muted-foreground")} />
                    {repo.backupEnabled ? t('common.autoBackupOff') : t('common.autoBackupOn')}
                  </button>

                  <div className="h-px bg-border my-1" />

                  <button
                    onClick={() => {
                      onDownloadSource(contextMenu.rel);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                    {t('common.downloadSource')}
                  </button>

                  <button
                    onClick={() => {
                      onEditRepo(repo.id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4 text-muted-foreground" />
                    {t('common.editRepo')}
                  </button>

                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setContextMenu(null)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    {t('common.openRepo')}
                  </a>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
