/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Settings, Database, Github, Globe, Info, Download as DownloadIcon, RefreshCw, Bell, History, Book, BarChart3, Star, FolderTree } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RepoManager } from './components/RepoManager';
import { Config } from './components/Config';
import { ProjectCenter } from './components/ProjectCenter';
import { Stats } from './components/Stats';
import { ExplorerFull } from './components/ExplorerFull';
import { DailySummary } from './components/DailySummary';
import { loadDataFromServer, saveSettings, saveRepositories, saveCategories, exportData, importJSON, downloadBackup, saveSavedConnections } from './lib/storage';
import { fetchReleases } from './lib/api';
import { AppData, AppSettings, Release, Repository, Category, RepoSource, SavedConnection } from './types';
import { cn } from './lib/utils';
import { useTranslation } from './lib/i18n';
import { motion, AnimatePresence } from 'motion/react';

type View = 'dashboard' | 'manager' | 'config' | 'project_center' | 'stats' | 'favorites' | 'explorer_full';

const INITIAL_DATA: AppData = {
  repositories: [],
  categories: [],
  savedConnections: [],
  settings: {
    accentColor: '#0078d4',
    theme: 'dark',
    fontFamily: 'Inter, sans-serif',
    fontSize: 14,
    autoRefreshInterval: 30,
    language: 'en',
    backupPath: 'Repopulse_Backups',
    dashboardLayout: 'columns',
    sidebarViewMode: 'list',
    webhooks: [],
    glassmorphism: { enabled: true, opacity: 0.1, blur: 10 },
    customThemes: [],
    customThemeConfig: {
      background: '#1a1a1a',
      foreground: '#ffffff',
      card: '#2b2b2b',
      border: '#3d3d3d',
      muted: '#333333',
      accent: '#0078d4'
    },
    sidebarIcons: {},
    serviceIcons: {}
  }
};

export default function App() {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const { t } = useTranslation(data.settings.language);
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem('repopulse_view');
    return (saved as View) || 'dashboard';
  });
  const [activeCategoryPath, setActiveCategoryPath] = useState<string[]>(() => {
    const saved = localStorage.getItem('repopulse_cat_path');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeRepoId, setActiveRepoId] = useState<string | null>(() => {
    return localStorage.getItem('repopulse_repo_id');
  });
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px
  const [isResizing, setIsResizing] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const refreshTimer = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      const serverData = await loadDataFromServer();
      setData(serverData);
      setIsInitialLoading(false);
    };
    init();
  }, []);

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX - 80; // Subtracting the 80px width of the main nav
      if (newWidth > 160 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize]);

  // Apply theme and fonts (visual only)
  useEffect(() => {
    if (isInitialLoading) return;
    const themes = ['light', 'dark', 'midnight', 'dim', 'forest', 'sunset', 'ocean', 'custom'];
    themes.forEach(t => document.documentElement.classList.remove(t));
    document.documentElement.classList.add(data.settings.theme);

    if (data.settings.theme === 'custom' && data.settings.customThemeConfig) {
      const config = data.settings.customThemeConfig;
      document.documentElement.style.setProperty('--background', config.background);
      document.documentElement.style.setProperty('--foreground', config.foreground);
      document.documentElement.style.setProperty('--card', config.card);
      document.documentElement.style.setProperty('--border', config.border);
      document.documentElement.style.setProperty('--muted', config.muted);
      document.documentElement.style.setProperty('--accent', config.accent);
      document.documentElement.style.setProperty('--ring', config.accent);
      
      // Calculate RGB for glassmorphism
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
      };
      document.documentElement.style.setProperty('--bg-rgb', hexToRgb(config.background));
      document.documentElement.style.setProperty('--card-rgb', hexToRgb(config.card));
    } else {
      // Reset custom properties if not in custom theme
      document.documentElement.style.removeProperty('--background');
      document.documentElement.style.removeProperty('--foreground');
      document.documentElement.style.removeProperty('--card');
      document.documentElement.style.removeProperty('--border');
      document.documentElement.style.removeProperty('--muted');
      document.documentElement.style.removeProperty('--bg-rgb');
      document.documentElement.style.removeProperty('--card-rgb');
      
      // Apply accent color
      document.documentElement.style.setProperty('--accent', data.settings.accentColor);
      document.documentElement.style.setProperty('--ring', data.settings.accentColor);
    }
    // Apply font
    document.documentElement.style.setProperty('--font-sans', data.settings.fontFamily);
    document.documentElement.style.fontSize = `${data.settings.fontSize || 14}px`;
    // Apply glassmorphism
    if (data.settings.glassmorphism.enabled) {
      document.documentElement.style.setProperty('--glass-opacity', data.settings.glassmorphism.opacity.toString());
      document.documentElement.style.setProperty('--glass-blur', `${data.settings.glassmorphism.blur}px`);
    } else {
      document.documentElement.style.setProperty('--glass-opacity', '0');
      document.documentElement.style.setProperty('--glass-blur', '0px');
    }

      // Apply Favicon
    if (data.settings.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = data.settings.favicon;
    }
  }, [data]);

  // Persist view state
  useEffect(() => {
    localStorage.setItem('repopulse_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('repopulse_cat_path', JSON.stringify(activeCategoryPath));
  }, [activeCategoryPath]);

  useEffect(() => {
    if (activeRepoId) localStorage.setItem('repopulse_repo_id', activeRepoId);
    else localStorage.removeItem('repopulse_repo_id');
  }, [activeRepoId]);

  const renderSidebarIcon = (item: string, DefaultIcon: any) => {
    const customIcon = data.settings.sidebarIcons?.[item];
    if (customIcon) return <img src={customIcon} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />;
    return <DefaultIcon className="w-6 h-6" />;
  };

  const triggerDownload = useCallback((url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const refreshReleases = useCallback(async (isAuto = false) => {
    if (data.repositories.length === 0) {
      setReleases([]);
      return;
    }
    if (!isAuto) setLoading(true);
    try {
      const allReleases = await Promise.all(
        data.repositories.map(repo => fetchReleases(repo, data.settings.githubToken))
      );
      const flatReleases = allReleases.flat();
      setReleases(flatReleases);

      // Check for updates for backup-enabled repos
      const newUpdates: string[] = [];
      const updatedRepos = data.repositories.map(repo => {
        const latest = flatReleases.find(r => r.repoId === repo.id);
        if (latest && repo.backupEnabled && repo.lastSeenVersion !== latest.tagName) {
          newUpdates.push(`New version ${latest.tagName} for ${repo.name}`);
          
          // Trigger server-side backup
          if (latest.assets.length > 0) {
            latest.assets.forEach(asset => {
              downloadBackup(asset.url, repo.name, latest.tagName, asset.name);
            });
          } else if (latest.zipUrl) {
            downloadBackup(latest.zipUrl, repo.name, latest.tagName, `${repo.name}_${latest.tagName}.zip`);
          }
          
          return { ...repo, lastSeenVersion: latest.tagName };
        }
        return repo;
      });

      if (newUpdates.length > 0) {
        setNotifications(prev => [...prev, ...newUpdates]);
        setData(prev => ({ ...prev, repositories: updatedRepos }));
      }
    } finally {
      if (!isAuto) setLoading(false);
    }
  }, [data.repositories, data.settings.githubToken, triggerDownload]);

  useEffect(() => {
    refreshReleases().then(() => {
      // Check if we should show daily summary
      const lastSummary = localStorage.getItem('repopulse_last_summary');
      const today = new Date().toDateString();
      if (lastSummary !== today) {
        setShowSummary(true);
        localStorage.setItem('repopulse_last_summary', today);
      }
    });
  }, []); // Initial load only

  // Auto-refresh timer
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (data.settings.autoRefreshInterval > 0) {
      refreshTimer.current = setInterval(() => {
        refreshReleases(true);
      }, data.settings.autoRefreshInterval * 60 * 1000);
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [data.settings.autoRefreshInterval, refreshReleases]);

  const handleAddRepo = (repo: Omit<Repository, 'id' | 'addedAt'>) => {
    const newRepo: Repository = {
      ...repo,
      id: Math.random().toString(36).substr(2, 9),
      addedAt: Date.now(),
    };
    const updatedRepos = [...data.repositories, newRepo];
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  const handleRemoveRepo = (id: string) => {
    const updatedRepos = data.repositories.filter(r => r.id !== id);
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  const handleUpdateRepo = (repo: Repository) => {
    const updatedRepos = data.repositories.map(r => r.id === repo.id ? repo : r);
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  const handleMoveRepo = (repoId: string, newCategoryPath: string[]) => {
    const updatedRepos = data.repositories.map(r => 
      r.id === repoId ? { ...r, categoryPath: newCategoryPath } : r
    );
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  const toggleFavorite = (id: string) => {
    const updatedRepos = data.repositories.map(r => 
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  const handleSettingsChange = (settings: AppSettings) => {
    setData(prev => ({ ...prev, settings }));
    saveSettings(settings);
  };

  const handleRefreshRepo = async (id: string, overrideUrl?: string) => {
    const repo = data.repositories.find(r => r.id === id);
    if (!repo) return;
    setLoading(true);
    try {
      const newReleases = await fetchReleases(repo, data.settings.githubToken, overrideUrl);
      
      // Check for new release to notify
      if (newReleases.length > 0) {
        const latest = newReleases[0];
        if (repo.lastSeenVersion && repo.lastSeenVersion !== latest.tagName) {
          // Notify server
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_release',
              data: {
                title: `New Release: ${repo.name}`,
                message: `Version ${latest.tagName} has been detected for ${repo.name}.`,
                fields: [
                  { name: 'Repository', value: repo.name, inline: true },
                  { name: 'Version', value: latest.tagName, inline: true },
                  { name: 'Source', value: repo.source, inline: true }
                ]
              }
            })
          }).catch(err => console.error('Failed to send notification:', err));
        }

        // Update last seen version
        const updatedRepos = data.repositories.map(r => 
          r.id === id ? { ...r, lastSeenVersion: latest.tagName } : r
        );
        setData(prev => ({ ...prev, repositories: updatedRepos }));
        saveRepositories(updatedRepos);
      }

      setReleases(prev => {
        const other = prev.filter(r => r.repoId !== id);
        return [...other, ...newReleases];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBackup = (id: string) => {
    const updatedRepos = data.repositories.map(r => 
      r.id === id ? { ...r, backupEnabled: !r.backupEnabled } : r
    );
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  const handleDownloadSource = (rel: Release) => {
    const repo = data.repositories.find(r => r.id === rel.repoId);
    if (!repo) return;
    if (rel.assets.length > 0) {
      rel.assets.forEach(asset => {
        downloadBackup(asset.url, repo.name, rel.tagName, asset.name);
      });
    } else if (rel.zipUrl) {
      downloadBackup(rel.zipUrl, repo.name, rel.tagName, `${repo.name}_${rel.tagName}.zip`);
    }
  };

  const handleEditRepo = (id: string) => {
    setActiveRepoId(id);
    setView('manager');
  };

  const handleCategoriesUpdate = (categories: Category[]) => {
    setData(prev => ({ ...prev, categories }));
    saveCategories(categories);
  };

  const handleUpdateConnections = (connections: SavedConnection[]) => {
    setData(prev => ({ ...prev, savedConnections: connections }));
    saveSavedConnections(connections);
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await importJSON(file);
      setData(imported);
      if (imported.settings) saveSettings(imported.settings);
      if (imported.repositories) saveRepositories(imported.repositories);
      if (imported.categories) saveCategories(imported.categories);
      if (imported.savedConnections) saveSavedConnections(imported.savedConnections);
    } catch (err) {
      alert('Failed to import data. Please check the file format.');
    }
  };

  const handleBulkImport = (urls: string, forceCategoryPath?: string[]) => {
    const lines = urls.split('\n').map(l => l.trim()).filter(Boolean);
    const newRepos: Repository[] = lines.map(urlRaw => {
      let url = urlRaw.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/releases$/, '');
      
      let source: RepoSource = 'github';
      if (url.includes('gitlab.com')) source = 'gitlab';
      else if (url.includes('gitea')) source = 'gitea';
      else if (url.includes('codeberg.org')) source = 'codeberg';
      else if (url.includes('forgejo')) source = 'forgejo';
      else if (url.includes('git.')) source = 'git';
      
      const name = url.split('/').pop() || 'Unknown';
      const owner = url.split('/').slice(-2, -1)[0] || 'Unknown';

      return {
        id: Math.random().toString(36).substr(2, 9),
        url,
        name,
        owner,
        source,
        categoryPath: forceCategoryPath || ['all', 'uncategorized'],
        osTags: [],
        addedAt: Date.now(),
        backupEnabled: false
      };
    });

    const updatedRepos = [...data.repositories, ...newRepos];
    setData(prev => ({ ...prev, repositories: updatedRepos }));
    saveRepositories(updatedRepos);
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg animate-pulse">
            <Database className="w-8 h-8" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading Repopulse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AnimatePresence>
        {showSummary && (
          <DailySummary 
            releases={releases} 
            settings={data.settings} 
            onClose={() => setShowSummary(false)} 
          />
        )}
      </AnimatePresence>

      {/* Navigation Rail */}
      <div className="w-16 border-r border-border bg-card flex flex-col items-center py-4 gap-3 z-20">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/20 mb-2">
          <Database className="w-6 h-6" />
        </div>
        
        <button
          onClick={() => setView('dashboard')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            view === 'dashboard' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t('common.dashboard')}
        >
          {renderSidebarIcon('dashboard', LayoutDashboard)}
        </button>

        <button
          onClick={() => setView('favorites')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            view === 'favorites' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t('common.favorites')}
        >
          {renderSidebarIcon('favorites', Star)}
        </button>

        <button
          onClick={() => setView('explorer_full')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            view === 'explorer_full' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Explorer"
        >
          {renderSidebarIcon('explorer', FolderTree)}
        </button>
        
        <button
          onClick={() => setView('manager')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            view === 'manager' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t('common.repoManagement')}
        >
          {renderSidebarIcon('manager', Database)}
        </button>

        <button
          onClick={() => refreshReleases()}
          disabled={loading}
          className={cn(
            "p-2.5 rounded-xl transition-all text-muted-foreground hover:bg-muted hover:text-foreground",
            loading && "animate-spin"
          )}
          title={t('common.refresh')}
        >
          <RefreshCw className="w-6 h-6" />
        </button>

        <button
          onClick={() => setView('stats')}
          className={cn(
            "p-2.5 rounded-xl transition-all",
            view === 'stats' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={t('common.releaseAnalytics')}
        >
          {renderSidebarIcon('stats', BarChart3)}
        </button>

        <div className="mt-auto flex flex-col gap-2">
          {notifications.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  alert(notifications.join('\n'));
                  setNotifications([]);
                }}
                className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all"
                title={t('common.notifications')}
              >
                <Bell className="w-6 h-6" />
              </button>
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-card rounded-full" />
            </div>
          )}

          <button
            onClick={() => setView('project_center')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              view === 'project_center' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Knowledge Center"
          >
            {renderSidebarIcon('wiki', Book)}
          </button>

          <button
            onClick={() => setView('config')}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              view === 'config' ? "bg-accent/10 text-[var(--accent)]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={t('common.settings')}
          >
            {renderSidebarIcon('settings', Settings)}
          </button>
        </div>
      </div>

      {/* Sidebar (only for dashboard and favorites) */}
      {(view === 'dashboard' || view === 'favorites') && (
        <Sidebar
          width={sidebarWidth}
          onResizeStart={startResizing}
          categories={data.categories}
          repositories={view === 'favorites' ? data.repositories.filter(r => r.isFavorite) : data.repositories}
          activeCategoryPath={activeCategoryPath}
          activeRepoId={activeRepoId}
          onSelect={(path, repoId) => {
            setActiveCategoryPath(path);
            setActiveRepoId(repoId || null);
          }}
          onMoveRepo={handleMoveRepo}
          language={data.settings.language}
          isFavoritesView={view === 'favorites'}
          onToggleFavorite={toggleFavorite}
          onRefreshRepo={handleRefreshRepo}
          onToggleBackup={handleToggleBackup}
          onDownloadSource={handleDownloadSource}
          onEditRepo={handleEditRepo}
          onSettingsChange={handleSettingsChange}
          allReleases={releases}
          settings={data.settings}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-muted/10 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[var(--accent)]/5 blur-[100px] rounded-full pointer-events-none" />

        {view === 'dashboard' && (
          <Dashboard
            releases={releases}
            repositories={data.repositories}
            activeCategoryPath={activeCategoryPath}
            activeRepoId={activeRepoId}
            loading={loading}
            settings={data.settings}
            onSettingsChange={handleSettingsChange}
            onToggleFavorite={toggleFavorite}
            onRefreshRepo={handleRefreshRepo}
            onToggleBackup={handleToggleBackup}
            onDownloadSource={handleDownloadSource}
            onEditRepo={handleEditRepo}
          />
        )}
        {view === 'favorites' && (
          <Dashboard
            releases={releases.filter(r => data.repositories.find(repo => repo.id === r.repoId)?.isFavorite)}
            repositories={data.repositories}
            activeCategoryPath={[]}
            activeRepoId={null}
            loading={loading}
            settings={data.settings}
            onSettingsChange={handleSettingsChange}
            onToggleFavorite={toggleFavorite}
            onRefreshRepo={handleRefreshRepo}
            onToggleBackup={handleToggleBackup}
            onDownloadSource={handleDownloadSource}
            onEditRepo={handleEditRepo}
          />
        )}

        {view === 'explorer_full' && (
          <ExplorerFull 
            settings={data.settings}
            repositories={data.repositories}
            savedConnections={data.savedConnections || []}
            onUpdateConnections={(connections) => {
              setData(prev => ({ ...prev, savedConnections: connections }));
              saveSavedConnections(connections);
            }}
          />
        )}
        {view === 'stats' && (
          <Stats
            releases={releases}
            repositories={data.repositories}
            settings={data.settings}
          />
        )}
        {view === 'manager' && (
          <RepoManager
            repositories={data.repositories}
            categories={data.categories}
            onAdd={handleAddRepo}
            onUpdate={handleUpdateRepo}
            onRemove={handleRemoveRepo}
            onToggleFavorite={toggleFavorite}
            language={data.settings.language}
            settings={data.settings}
          />
        )}
        {view === 'config' && (
          <Config
            settings={data.settings}
            data={data}
            onSettingsChange={handleSettingsChange}
            onCategoriesUpdate={handleCategoriesUpdate}
            onUpdateConnections={handleUpdateConnections}
            onExport={(d, f) => exportData(d, f, data.settings.backupPath)}
            onImport={handleImport}
            onBulkImport={handleBulkImport}
          />
        )}
        {view === 'project_center' && (
          <ProjectCenter language={data.settings.language} />
        )}
      </main>
    </div>
  );
}
