/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Trash2, X, Edit2, Check, Globe, Github, Gitlab, Box, Coffee, Hammer, Mountain, ChevronRight, ShieldCheck, ShieldAlert, Search, Star, FolderTree, Smartphone, Package, Wrench, Code, Cloud, HardDrive, GitBranch } from 'lucide-react';
import { useState, FormEvent, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Category, OS, Repository, AppSettings } from '../types';
import { ICON_LIST } from './CategoryManager';
import { useTranslation } from '../lib/i18n';

interface RepoManagerProps {
  repositories: Repository[];
  categories: Category[];
  onAdd: (repo: Omit<Repository, 'id' | 'addedAt'>) => void;
  onUpdate: (repo: Repository) => void;
  onRemove: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  language?: string;
  settings: AppSettings;
}

export function RepoManager({ repositories, categories, onAdd, onUpdate, onRemove, onToggleFavorite, language = 'en', settings }: RepoManagerProps) {
  const { t } = useTranslation(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingRepoId, setEditingRepoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    source: 'github' as Repository['source'],
    categoryPath: ['all', 'uncategorized'] as string[],
    osTags: [] as OS[],
    backupEnabled: false,
    username: '',
    password: '',
    port: undefined as number | undefined,
  });

  const resetForm = () => {
    setFormData({
      url: '',
      name: '',
      source: 'github',
      categoryPath: ['all', 'uncategorized'],
      osTags: [],
      backupEnabled: false,
      username: '',
      password: '',
      port: undefined,
    });
    setIsAdding(false);
    setEditingRepoId(null);
  };

  const handleEdit = (repo: Repository) => {
    setFormData({
      url: repo.url,
      name: repo.name,
      source: repo.source,
      categoryPath: repo.categoryPath,
      osTags: repo.osTags,
      backupEnabled: repo.backupEnabled || false,
      username: repo.username || '',
      password: repo.password || '',
      port: repo.port,
    });
    setEditingRepoId(repo.id);
    setIsAdding(true);
  };

  const handleSubmit = (e: FormEvent, id?: string) => {
    e.preventDefault();
    if (!formData.url || !formData.name) return;
    
    // Clean URL
    const cleanUrl = formData.url.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/releases$/, '');
    const updatedCategoryPath = formData.categoryPath.length === 0 ? ['all', 'uncategorized'] : formData.categoryPath;
    const updatedFormData = { ...formData, url: cleanUrl, categoryPath: updatedCategoryPath };

    const targetId = id || editingRepoId;
    if (targetId) {
      const existing = repositories.find(r => r.id === targetId);
      if (existing) {
        onUpdate({ ...existing, ...updatedFormData });
      }
    } else {
      onAdd(updatedFormData);
    }
    resetForm();
  };

  const toggleOS = (os: OS) => {
    setFormData(prev => ({
      ...prev,
      osTags: prev.osTags.includes(os)
        ? prev.osTags.filter(t => t !== os)
        : [...prev.osTags, os]
    }));
  };

  const renderCategorySelector = (cats: Category[] = [], currentPath: string[] = [], level: number = 0) => {
    if (level >= 5) return null;

    return (
      <div className="space-y-3">
        {level === 0 && (
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t('dashboard.filterByCategory')}
          </label>
        )}
        <div className="grid grid-cols-1 gap-2">
          {[...(cats || [])].sort((a, b) => (a.order || 0) - (b.order || 0)).map(c => {
            const Icon = ICON_LIST[c.icon] || Globe;
            const isSelected = formData.categoryPath[level] === c.id;
            const categoryName = c.id === 'uncategorized' ? t('categories.uncategorized') : c.name;
            
            return (
              <div key={c.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const newPath = formData.categoryPath.slice(0, level);
                    newPath[level] = c.id;
                    setFormData(prev => ({ ...prev, categoryPath: newPath }));
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-200",
                    isSelected 
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20 scale-[1.02]" 
                      : "bg-muted/30 border-border/50 hover:border-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <div 
                    className={cn(
                      "p-1.5 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-white/20" : "bg-muted"
                    )}
                    style={!isSelected && c.color ? { backgroundColor: c.color + '20', color: c.color } : {}}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-left font-medium">{categoryName}</span>
                  {(c.children || []).length > 0 && (
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isSelected ? "rotate-90" : ""
                    )} />
                  )}
                </button>
                
                {isSelected && (c.children || []).length > 0 && (
                  <div className="ml-6 pl-4 border-l-2 border-accent/20 py-1 animate-in slide-in-from-left-2 duration-200">
                    {renderCategorySelector(c.children, currentPath, level + 1)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getCategoryName = (path: string[]) => {
    let current: Category[] = categories || [];
    const names: string[] = [];
    for (const id of path) {
      const cat = (current || []).find(c => c.id === id);
      if (cat) {
        names.push(cat.id === 'uncategorized' ? t('categories.uncategorized') : cat.name);
        current = cat.children || [];
      }
    }
    return names.join(' > ');
  };

  const filteredRepositories = useMemo(() => {
    if (!searchQuery) return repositories;
    const query = searchQuery.toLowerCase();
    return repositories.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.url.toLowerCase().includes(query) ||
      (r.owner && r.owner.toLowerCase().includes(query))
    );
  }, [repositories, searchQuery]);

  const renderForm = (id?: string) => (
    <div className={cn("fluent-card p-6 relative animate-in fade-in slide-in-from-top-4 duration-300", id ? "border-[var(--accent)]/50 shadow-lg" : "mb-8")}>
      <button
        onClick={resetForm}
        className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full"
      >
        <X className="w-4 h-4" />
      </button>
      <h2 className="text-lg font-semibold mb-6">{id ? t('repos.edit') : t('repos.add')}</h2>
      <form onSubmit={(e) => handleSubmit(e, id)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('repos.name')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. VS Code"
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('repos.url')}</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://github.com/microsoft/vscode"
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('repos.source')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {(['github', 'gitlab', 'bitbucket', 'gitea', 'forgejo', 'codeberg', 'git', 'http', 'ftp', 'sftp', 'smb', 'webdav', 'nfs', 'android_fdroid'] as Repository['source'][]).map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, source: src }))}
                    className={cn(
                      "py-2 px-2 rounded-xl border text-[9px] font-bold uppercase transition-all flex flex-col items-center gap-1",
                      formData.source === src 
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20 scale-[1.05]" 
                        : "bg-muted/30 border-border/50 hover:border-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {(() => {
                        const customIcon = settings.serviceIcons?.[src];
                        if (customIcon) return <img src={customIcon} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />;
                        
                        if (src === 'github') return <Github className="w-4 h-4" />;
                        if (src === 'gitlab') return <Gitlab className="w-4 h-4" />;
                        if (src === 'bitbucket') return <Package className="w-4 h-4" />;
                        if (src === 'gitea') return <Coffee className="w-4 h-4" />;
                        if (src === 'forgejo') return <Hammer className="w-4 h-4" />;
                        if (src === 'codeberg') return <Mountain className="w-4 h-4" />;
                         if (src === 'git') return <GitBranch className="w-4 h-4" />;
                        if (['ftp', 'sftp', 'smb', 'webdav', 'nfs'].includes(src)) return <FolderTree className="w-4 h-4" />;
                        if (src.startsWith('android_')) return <Smartphone className="w-4 h-4" />;
                        return <Globe className="w-4 h-4" />;
                      })()}
                    </div>
                    <span className="truncate w-full text-center">{src.replace('android_', '').replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            {['ftp', 'sftp', 'smb', 'webdav', 'nfs', 'http'].includes(formData.source) && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Connection Credentials
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                      placeholder="User"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Port (Optional)</label>
                  <input
                    type="number"
                    value={formData.port || ''}
                    onChange={e => {
                      const val = e.target.value ? parseInt(e.target.value) : undefined;
                      setFormData(prev => ({ ...prev, port: val }));
                    }}
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm"
                    placeholder="Default"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('repos.os')}</label>
              <div className="flex flex-wrap gap-2">
                {(['Windows', 'Linux', 'macOS', 'Android', 'iOS'] as OS[]).map(os => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => toggleOS(os)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-medium border transition-all",
                      formData.osTags.includes(os)
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                        : "bg-muted text-muted-foreground border-border hover:border-muted-foreground"
                    )}
                  >
                    {os}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
                  <span className="font-semibold">{t('repos.autoBackup')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, backupEnabled: !prev.backupEnabled }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    formData.backupEnabled ? "bg-[var(--accent)]" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    formData.backupEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('repos.autoBackupDesc')}
              </p>
            </div>
          </div>

          <div className="flex flex-col h-full min-h-[400px]">
            <label className="text-sm font-medium mb-4">{t('dashboard.filterByCategory')}</label>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar bg-muted/20 rounded-xl border border-border/50 p-4">
              {renderCategorySelector(categories)}
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end gap-3 border-t border-border">
          <button
            type="button"
            onClick={resetForm}
            className="fluent-button-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="fluent-button-primary min-w-[120px]"
          >
            {id ? t('common.save') : t('repos.add')}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('repos.title')}</h1>
            <p className="text-muted-foreground">{t('repos.subtitle')}</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="fluent-button-primary gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('repos.add')}
            </button>
          )}
        </div>

        {isAdding && !editingRepoId && renderForm()}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Existing Repositories ({filteredRepositories.length})</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredRepositories.map(repo => {
              const isEditing = editingRepoId === repo.id;
              
              if (isEditing) {
                return <div key={repo.id}>{renderForm(repo.id)}</div>;
              }

              return (
                <div key={repo.id} className="fluent-card p-5 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground relative">
                      {(() => {
                        const customIcon = settings.serviceIcons?.[repo.source];
                        if (customIcon) return <img src={customIcon} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />;

                        if (repo.source === 'github') return <Github className="w-6 h-6" />;
                        if (repo.source === 'gitlab') return <Gitlab className="w-6 h-6" />;
                        if (repo.source === 'bitbucket') return <Package className="w-6 h-6" />;
                        if (repo.source === 'gitea') return <Coffee className="w-6 h-6" />;
                        if (repo.source === 'codeberg') return <Mountain className="w-6 h-6" />;
                        if (repo.source === 'git') return <GitBranch className="w-6 h-6" />;
                        if (['ftp', 'sftp', 'smb', 'webdav', 'nfs'].includes(repo.source)) return <FolderTree className="w-6 h-6" />;
                        if (repo.source.startsWith('android_')) return <Smartphone className="w-6 h-6" />;
                        if (repo.source === 's3') return <Cloud className="w-6 h-6" />;
                        if (repo.source === 'rclone') return <HardDrive className="w-6 h-6" />;
                        if (repo.source === 'forgejo') {
                          if (repo.url.includes('codeberg.org')) {
                            const codebergIcon = settings.serviceIcons?.['codeberg'];
                            if (codebergIcon) return <img src={codebergIcon} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />;
                            return <Mountain className="w-6 h-6" />;
                          }
                          return <Hammer className="w-6 h-6" />;
                        }
                        return <Globe className="w-6 h-6" />;
                      })()}
                      {repo.backupEnabled && (
                        <div className="absolute -top-1 -right-1 bg-[var(--accent)] text-white p-0.5 rounded-full shadow-lg">
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{repo.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{repo.url}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-accent/5 text-[var(--accent)] border border-[var(--accent)]/20 rounded text-[10px] font-bold uppercase tracking-wider">
                          {getCategoryName(repo.categoryPath)}
                        </span>
                        <div className="flex gap-1.5 ml-3">
                          {repo.osTags.map(os => (
                            <div key={os} className="w-2 h-2 rounded-full bg-[var(--accent)]" title={os} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleFavorite?.(repo.id)}
                      className={cn(
                        "p-2 rounded-full transition-colors",
                        repo.isFavorite 
                          ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" 
                          : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                      )}
                      title="Toggle Favorite"
                    >
                      <Star className={cn("w-4 h-4", repo.isFavorite && "fill-current")} />
                    </button>
                    <button
                      onClick={() => handleEdit(repo)}
                      className="p-2 text-muted-foreground hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-full transition-colors"
                      title="Edit Repository"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemove(repo.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete Repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredRepositories.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl text-muted-foreground bg-muted/5">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm">No repositories added yet.</p>
                <button onClick={() => setIsAdding(true)} className="text-[var(--accent)] text-sm font-medium mt-2 hover:underline">
                  Add your first repository
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
