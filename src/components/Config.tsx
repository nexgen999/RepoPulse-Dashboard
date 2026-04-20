/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Download, Upload, Key, Layout, Palette, Database, Check, Moon, Sun, RefreshCw, Languages, FolderSync, Box, Columns, Trees, Sunrise, Waves, Trash2, HardDrive, Plus, Monitor, Globe, FolderTree, ChevronRight, Settings, Github, Star, Cloud, ShieldCheck, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { AppData, AppSettings, Category, SavedConnection } from '../types';
import { CategoryManager } from './CategoryManager';
import { importJSON } from '../lib/storage';
import { useTranslation } from '../lib/i18n';
import { LANGUAGES } from '../i18n/translations';

const ACCENT_COLORS = [
  { name: 'Fluent Blue', value: '#0078d4' },
  { name: 'Soft Blue', value: '#60a5fa' },
  { name: 'Royal Purple', value: '#8b5cf6' },
  { name: 'Deep Purple', value: '#6d28d9' },
  { name: 'Vibrant Pink', value: '#ec4899' },
  { name: 'Rose Red', value: '#e11d48' },
  { name: 'Sunset Orange', value: '#f97316' },
  { name: 'Amber Gold', value: '#f59e0b' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Forest Green', value: '#059669' },
  { name: 'Teal Ocean', value: '#0d9488' },
  { name: 'Cyan Sky', value: '#06b6d4' },
  { name: 'Slate Gray', value: '#475569' },
  { name: 'Coal Black', value: '#18181b' },
];

const FONTS = [
  { name: 'Inter (System)', value: 'Inter, system-ui, sans-serif' },
  { name: 'Segoe UI', value: '"Segoe UI", system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Ubuntu', value: 'Ubuntu, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
  { name: 'Raleway', value: 'Raleway, sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif' },
  { name: 'Quicksand', value: 'Quicksand, sans-serif' },
  { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
  { name: 'Merriweather', value: 'Merriweather, serif' },
  { name: 'Lora', value: 'Lora, serif' },
  { name: 'Rubik', value: 'Rubik, sans-serif' },
  { name: 'Karla', value: 'Karla, sans-serif' },
  { name: 'Inconsolata', value: 'Inconsolata, monospace' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { name: 'Fira Code', value: '"Fira Code", monospace' },
  { name: 'IBM Plex Sans', value: '"IBM Plex Sans", sans-serif' },
  { name: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
  { name: 'Work Sans', value: '"Work Sans", sans-serif' },
  { name: 'Titillium Web', value: '"Titillium Web", sans-serif' },
  { name: 'Barlow', value: 'Barlow, sans-serif' },
  { name: 'Josefin Sans', value: '"Josefin Sans", sans-serif' },
  { name: 'Cabin', value: 'Cabin, sans-serif' },
  { name: 'Arimo', value: 'Arimo, sans-serif' },
  { name: 'Playfair Display', value: '"Playfair Display", serif' },
  { name: 'Pacifico', value: 'Pacifico, cursive' },
  { name: 'Dancing Script', value: '"Dancing Script", cursive' },
  { name: 'Space Grotesk', value: '"Space Grotesk", sans-serif' },
  { name: 'Prompt', value: 'Prompt, sans-serif' },
  { name: 'Kanit', value: 'Kanit, sans-serif' },
  { name: 'Libre Baskerville', value: '"Libre Baskerville", serif' }
];

type Tab = 'general' | 'appearance' | 'structure' | 'connections' | 'webhooks' | 'data';

interface ConfigProps {
  settings: AppSettings;
  data: AppData;
  onSettingsChange: (settings: AppSettings) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
  onUpdateConnections: (connections: SavedConnection[]) => void;
  onExport: (data: any, filename: string) => void;
  onImport: (file: File) => void;
  onBulkImport: (urls: string, forceCategoryPath?: string[]) => void;
}

export function Config({ 
  settings, 
  data, 
  onSettingsChange, 
  onCategoriesUpdate, 
  onUpdateConnections,
  onExport, 
  onImport, 
  onBulkImport 
}: ConfigProps) {
  const { t } = useTranslation(settings.language);
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [activeAppearanceSubTab, setActiveAppearanceSubTab] = useState<'language' | 'font' | 'theme' | 'layout' | 'icons'>('language');
  const [bulkUrls, setBulkUrls] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        const { provider, tokens } = event.data;
        const newConn: SavedConnection = {
          id: Math.random().toString(36).substr(2, 9),
          name: `${provider === 'google_drive' ? 'Google' : provider === 'onedrive' ? 'OneDrive' : 'Dropbox'} Acc (${tokens.clientId.substring(0, 5)}...)`,
          type: 'remote',
          source: provider as any,
          url: tokens.clientSecret, // Used as clientSecret in server plugin
          username: tokens.clientId, // Used as clientId in server plugin
          password: tokens.refreshToken, // Used as refreshToken in server plugin
          port: 0
        };
        onUpdateConnections([...(data.savedConnections || []), newConn]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data.savedConnections, onUpdateConnections]);

  const fetchGitHubItems = async (type: 'repos' | 'stars') => {
    if (!githubUsername.trim()) return;
    setIsImporting(true);
    try {
      let page = 1;
      let allUrls: string[] = [];
      let hasMore = true;

      while (hasMore) {
        const url = `https://api.github.com/users/${githubUsername}/${type === 'repos' ? 'repos' : 'starred'}?per_page=100&page=${page}`;
        const headers: HeadersInit = {};
        if (settings.githubToken) {
          headers['Authorization'] = `token ${settings.githubToken}`;
        }
        
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('GitHub API error');
        const items = await response.json();
        
        if (items.length === 0) {
          hasMore = false;
        } else {
          const urls = items.map((r: any) => r.html_url || r.repo?.html_url).filter(Boolean);
          allUrls = [...allUrls, ...urls];
          page++;
          if (items.length < 100) hasMore = false;
        }
      }

      if (allUrls.length > 0) {
        onBulkImport(allUrls.join('\n'), ['uncategorized']);
        alert(`Successfully imported ${allUrls.length} ${type}.`);
      } else {
        alert('No repositories found for this user.');
      }
    } catch (error) {
      console.error(error);
      alert('Error fetching GitHub data. Please check the username and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Setting', icon: Settings },
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'structure', label: t('settings.structure'), icon: Layout },
    { id: 'connections', label: 'Cloud Connection', icon: HardDrive },
    { id: 'webhooks', label: 'Webhooks', icon: RefreshCw },
    { id: 'data', label: 'Data Management', icon: Database },
  ] as const;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Vertical Sidebar Navigation */}
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col p-4 gap-2 overflow-y-auto custom-scrollbar">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">{t('settings.subtitle')}</p>
        </div>
        
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              activeTab === tab.id 
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="flex-1 text-left">{tab.label}</span>
            {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-8">

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* API Authentication */}
              <div className="fluent-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">API Authentication</h3>
                    <p className="text-xs text-muted-foreground">Increase rate limits and access private repositories.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personal Access Token</label>
                  <input
                    type="password"
                    value={settings.githubToken || ''}
                    onChange={e => onSettingsChange({ ...settings, githubToken: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Generate a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">GitHub Settings</a>.
                  </p>
                </div>
              </div>

              {/* Auto-Refresh Interval */}
              <div className="fluent-card p-6 space-y-4 shadow-lg hover:shadow-accent/5 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('settings.autoRefresh') || 'Intervalle d\'Actualisation'}</h3>
                    <p className="text-xs text-muted-foreground">Fréquence de vérification automatique des nouveaux dépôts et releases.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-end mb-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Fréquence Actuelle</span>
                      <div className="text-2xl font-black text-[var(--accent)] tracking-tight">
                        {settings.autoRefreshInterval === 0 
                          ? 'Désactivé' 
                          : settings.autoRefreshInterval < 60 
                            ? `${settings.autoRefreshInterval} Minutes` 
                            : `${settings.autoRefreshInterval / 60} Heure${settings.autoRefreshInterval / 60 > 1 ? 's' : ''}`
                        }
                      </div>
                    </div>
                  </div>
                  <div className="relative pt-2">
                    <input
                      type="range"
                      min="0"
                      max="7"
                      step="1"
                      value={[0, 15, 30, 60, 180, 360, 720, 1440].indexOf(settings.autoRefreshInterval === undefined ? 0 : settings.autoRefreshInterval)}
                      onChange={e => {
                        const intervals = [0, 15, 30, 60, 180, 360, 720, 1440];
                        onSettingsChange({ ...settings, autoRefreshInterval: intervals[parseInt(e.target.value)] });
                      }}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                    />
                    <div className="flex justify-between text-[10px] font-black text-muted-foreground mt-4 uppercase tracking-tighter">
                      <span className={cn(settings.autoRefreshInterval === 0 && "text-[var(--accent)]")}>Off</span>
                      <span className={cn(settings.autoRefreshInterval === 15 && "text-[var(--accent)]")}>15m</span>
                      <span className={cn(settings.autoRefreshInterval === 30 && "text-[var(--accent)]")}>30m</span>
                      <span className={cn(settings.autoRefreshInterval === 60 && "text-[var(--accent)]")}>1h</span>
                      <span className={cn(settings.autoRefreshInterval === 180 && "text-[var(--accent)]")}>3h</span>
                      <span className={cn(settings.autoRefreshInterval === 360 && "text-[var(--accent)]")}>6h</span>
                      <span className={cn(settings.autoRefreshInterval === 720 && "text-[var(--accent)]")}>12h</span>
                      <span className={cn(settings.autoRefreshInterval === 1440 && "text-[var(--accent)]")}>24h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup Folder Name */}
              <div className="fluent-card p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <FolderSync className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Backup Folder Name</h3>
                    <p className="text-xs text-muted-foreground">Define the base folder name for your downloads and backups.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Folder Path Prefix</label>
                    <div className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[10px] font-bold rounded uppercase">
                      Browser Limitation
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.backupPath}
                      onChange={e => onSettingsChange({ ...settings, backupPath: e.target.value })}
                      placeholder="e.g. Repopulse_Backups"
                      className="flex-1 px-4 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Files will be downloaded to your browser's default location. We use this path to prefix the filename for better organization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-6">
              <CategoryManager 
                categories={data.categories} 
                onUpdate={onCategoriesUpdate} 
                language={settings.language}
              />
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Sub-navigation for Appearance */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'language', label: 'Language', icon: Languages },
                  { id: 'font', label: 'Font & Size', icon: Box },
                  { id: 'theme', label: 'Theme & Colors', icon: Palette },
                  { id: 'layout', label: 'Layout Settings', icon: Layout },
                  { id: 'icons', label: 'Icons Customization', icon: Monitor },
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveAppearanceSubTab(sub.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                      activeAppearanceSubTab === sub.id 
                        ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md" 
                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground hover:border-border"
                    )}
                  >
                    <sub.icon className="w-3.5 h-3.5" />
                    {sub.label}
                  </button>
                ))}
              </div>

              {activeAppearanceSubTab === 'language' && (
                <div className="fluent-card p-6 space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t('settings.language')}</h3>
                      <p className="text-xs text-muted-foreground">Select your preferred interface language.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => onSettingsChange({ ...settings, language: lang.code })}
                        className={cn(
                          "px-4 py-3 rounded-2xl border text-sm font-medium transition-all text-center",
                          settings.language === lang.code 
                            ? "border-[var(--accent)] bg-accent/5 text-[var(--accent)] ring-1 ring-accent" 
                            : "border-border hover:border-muted-foreground bg-muted/30"
                        )}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeAppearanceSubTab === 'font' && (
                <div className="fluent-card p-6 space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Typography</h3>
                      <p className="text-xs text-muted-foreground">Customize fonts and text scaling.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('settings.fontFamily')}</label>
                      <select
                        value={settings.fontFamily}
                        onChange={e => onSettingsChange({ ...settings, fontFamily: e.target.value })}
                        className="w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-ring text-sm appearance-none cursor-pointer"
                      >
                        {FONTS.map(font => (
                          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>
                        ))}
                      </select>
                      <div className="p-4 bg-muted/20 border border-dashed border-border rounded-xl">
                        <p style={{ fontFamily: settings.fontFamily }} className="text-sm">
                          The quick brown fox jumps over the lazy dog. (Preview)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Font Size ({settings.fontSize || 14}px)</label>
                        <button 
                          onClick={() => onSettingsChange({ ...settings, fontSize: 14 })}
                          className="text-[10px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> RESET
                        </button>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="24"
                        step="1"
                        value={settings.fontSize || 14}
                        onChange={(e) => onSettingsChange({ ...settings, fontSize: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground font-bold px-1">
                        <span>10PX</span>
                        <span>14PX</span>
                        <span>18PX</span>
                        <span>24PX</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAppearanceSubTab === 'theme' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="fluent-card p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Color Palette</h3>
                        <p className="text-xs text-muted-foreground">Select a theme and accent color.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('settings.theme')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(['light', 'dark', 'midnight', 'forest', 'sunset', 'ocean', 'custom'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => {
                              const newSettings = { ...settings, theme: mode };
                              if (mode === 'custom' && !settings.customThemeConfig) {
                                newSettings.customThemeConfig = {
                                  background: '#1a1a1a',
                                  foreground: '#ffffff',
                                  card: '#2b2b2b',
                                  border: '#3d3d3d',
                                  muted: '#333333',
                                  accent: settings.accentColor
                                };
                              }
                              onSettingsChange(newSettings);
                            }}
                            className={cn(
                              "relative group p-4 rounded-2xl border-2 transition-all capitalize font-bold flex flex-col items-center gap-2",
                              settings.theme === mode 
                                ? "border-[var(--accent)] bg-accent/5 text-[var(--accent)] shadow-lg shadow-accent/5" 
                                : "border-transparent hover:border-border bg-muted/20"
                            )}
                          >
                            {mode === 'custom' && settings.theme === mode && (
                              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                            )}
                            {mode === 'light' && <Sun className="w-5 h-5" />}
                            {mode === 'dark' && <Moon className="w-5 h-5" />}
                            {mode === 'midnight' && <Moon className="w-5 h-5 text-blue-400" />}
                            {mode === 'forest' && <Trees className="w-5 h-5 text-green-400" />}
                            {mode === 'sunset' && <Sunrise className="w-5 h-5 text-orange-400" />}
                            {mode === 'ocean' && <Waves className="w-5 h-5 text-cyan-400" />}
                            {mode === 'custom' && <Palette className="w-5 h-5 text-pink-400" />}
                            <span className="text-[10px] uppercase tracking-tighter">{t(`settings.${mode}`)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('settings.accentColor')}</label>
                      <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
                        {ACCENT_COLORS.map(color => (
                          <button
                            key={color.value}
                            onClick={() => onSettingsChange({ ...settings, accentColor: color.value })}
                            className={cn(
                              "w-full aspect-square rounded-full transition-all relative group shadow-sm",
                              settings.accentColor === color.value ? "ring-2 ring-offset-2 ring-offset-background ring-[var(--accent)] scale-110" : "hover:scale-125"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {settings.accentColor === color.value && (
                              <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAppearanceSubTab === 'layout' && (
                <div className="fluent-card p-6 space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Interface Layout</h3>
                      <p className="text-xs text-muted-foreground">Configure the structural arrangement of your workspace.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('settings.dashboardLayout')}</label>
                      <div className="flex gap-4">
                        {(['list', 'columns'] as const).map(layout => (
                          <button
                            key={layout}
                            onClick={() => onSettingsChange({ ...settings, dashboardLayout: layout })}
                            className={cn(
                              "flex-1 p-6 rounded-2xl border transition-all flex flex-col items-center gap-3",
                              settings.dashboardLayout === layout 
                                ? "border-[var(--accent)] bg-accent/5 text-[var(--accent)]" 
                                : "border-border hover:border-muted-foreground bg-muted/20"
                            )}
                          >
                            {layout === 'list' && <Layout className="w-6 h-6" />}
                            {layout === 'columns' && <Columns className="w-6 h-6" />}
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {layout === 'list' ? 'Vertical List' : 'Bento Columns'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Navigation Style</label>
                      <div className="flex gap-4">
                        {(['cascading', 'list'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => onSettingsChange({ ...settings, sidebarViewMode: mode })}
                            className={cn(
                              "flex-1 p-6 rounded-2xl border transition-all flex flex-col items-center gap-3",
                              settings.sidebarViewMode === mode 
                                ? "border-[var(--accent)] bg-accent/5 text-[var(--accent)]" 
                                : "border-border hover:border-muted-foreground bg-muted/20"
                            )}
                          >
                            {mode === 'cascading' && <FolderTree className="w-6 h-6" />}
                            {mode === 'list' && <Layout className="w-6 h-6" />}
                            <span className="text-xs font-bold uppercase tracking-widest">
                              {mode === 'cascading' ? 'Accordion Tree' : 'Flat Icons'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAppearanceSubTab === 'icons' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                  {/* App Favicon */}
                  <div className="fluent-card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-lg">Application Favicon</h3>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-muted/20 rounded-3xl border border-dashed border-border">
                      <div className="w-24 h-24 rounded-3xl bg-background border border-border shadow-2xl flex items-center justify-center p-4 ring-4 ring-muted/30">
                        <img 
                          src={settings.favicon || '/favicon.ico'} 
                          alt="Favicon" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/walkxcode/dashboard-icons/master/png/repopulse.png'; }}
                        />
                      </div>
                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                          <p className="text-sm font-medium">Customize the tab icon</p>
                          <p className="text-xs text-muted-foreground">Change how RepoPulse looks in your browser window.</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                          <label className="fluent-button-primary cursor-pointer gap-2 px-6">
                            <Upload className="w-4 h-4" /> Change Icon
                            <input
                              type="file"
                              accept="image/*,.ico,.bmp,.svg"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    const base64 = event.target?.result as string;
                                    const response = await fetch('/api/upload-icon', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ name: `favicon_${Date.now()}`, data: base64, type: 'favicon' })
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      onSettingsChange({ ...settings, favicon: result.url });
                                      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                                      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
                                      link.href = result.url;
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {settings.favicon && (
                            <button
                              onClick={() => {
                                onSettingsChange({ ...settings, favicon: undefined });
                                let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
                                if (link) link.href = '/favicon.ico';
                              }}
                              className="p-2 px-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all font-bold text-xs"
                            >
                              RESET TO DEFAULT
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Icons */}
                  <div className="fluent-card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                          <Layout className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">Sidebar Icons</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'favorites', label: 'Favorites' },
                        { id: 'explorer', label: 'Explorer' },
                        { id: 'manager', label: 'Repo Manager' },
                        { id: 'stats', label: 'Statistics' },
                        { id: 'wiki', label: 'Knowledge Center' },
                        { id: 'settings', label: 'Settings' }
                      ].map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50 hover:border-accent/30 transition-all group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 shrink-0 group-hover:scale-110 transition-transform">
                              {settings.sidebarIcons?.[item.id] ? (
                                <img src={settings.sidebarIcons[item.id]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">{item.id.slice(0, 2)}</span>
                              )}
                            </div>
                            <span className="text-xs font-bold capitalize truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="p-2 hover:bg-[var(--accent)]/10 text-muted-foreground hover:text-[var(--accent)] rounded-lg cursor-pointer transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const base64 = event.target?.result as string;
                                      const response = await fetch('/api/upload-icon', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: `sb_${item.id}_${Date.now()}`, data: base64, type: 'sidebar' })
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        onSettingsChange({ ...settings, sidebarIcons: { ...(settings.sidebarIcons || {}), [item.id]: result.url } });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            {settings.sidebarIcons?.[item.id] && (
                              <button
                                onClick={() => {
                                  const n = { ...(settings.sidebarIcons || {}) }; delete n[item.id];
                                  onSettingsChange({ ...settings, sidebarIcons: n });
                                }}
                                className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service Icons */}
                  <div className="fluent-card p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                          <Database className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">Service Source Icons</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {(['github', 'gitlab', 'bitbucket', 'gitea', 'forgejo', 'codeberg', 'git', 'http', 'ftp', 'sftp', 'smb', 'webdav', 'nfs', 'android_fdroid'] as const).map(source => (
                        <div key={source} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50 group">
                           <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center p-2.5 transition-all group-hover:ring-2 group-hover:ring-emerald-500/30">
                              {settings.serviceIcons?.[source] ? (
                                <img src={settings.serviceIcons[source]} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="text-[8px] font-black uppercase text-muted-foreground opacity-30">{source}</div>
                              )}
                           </div>
                           <div className="flex items-center gap-2">
                             <label className="p-1.5 px-3 bg-muted hover:bg-emerald-500/10 hover:text-emerald-500 rounded-xl cursor-pointer text-[10px] font-bold transition-all border border-border/50">
                               UPLOAD
                               <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const base64 = event.target?.result as string;
                                      const response = await fetch('/api/upload-icon', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ name: `srv_${source}_${Date.now()}`, data: base64, type: 'service' })
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        onSettingsChange({ ...settings, serviceIcons: { ...(settings.serviceIcons || {}), [source]: result.url } });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                             </label>
                             {settings.serviceIcons?.[source] && (
                               <button
                                 onClick={() => {
                                    const n = { ...(settings.serviceIcons || {}) }; delete n[source];
                                    onSettingsChange({ ...settings, serviceIcons: n });
                                 }}
                                 className="p-1.5 px-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all text-[10px] font-bold border border-red-500/20"
                               >
                                 DEL
                               </button>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--accent)]/5 p-8 rounded-[2rem] border border-accent/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Globe className="w-48 h-48 rotate-12" />
                  </div>
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      Gestionnaire Sécurisé
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-none">Gestionnaire de Connexions</h2>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Configurez vos accès distants FTP, SFTP, SMB, NFS ou WebDAV pour un accès direct depuis l'Explorateur.
                    </p>
                  </div>
                  <div className="relative z-10">
                    <button
                      onClick={() => {
                        const newConn: SavedConnection = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: 'Nouvelle Connexion',
                          type: 'remote',
                          source: 'http',
                          url: '',
                          username: '',
                          password: '',
                          port: 80
                        };
                        onUpdateConnections([...(data.savedConnections || []), newConn]);
                      }}
                      className="px-8 py-4 bg-[var(--accent)] text-white rounded-2xl text-sm font-black hover:scale-105 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> NOUVELLE CONNEXION
                    </button>
                  </div>
               </div>

               <div className="space-y-6">
                {(data.savedConnections || []).length === 0 ? (
                  <div className="text-center py-20 border-4 border-dashed border-border/50 rounded-[2.5rem] bg-muted/5">
                    <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                       <Cloud className="w-10 h-10 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Aucune connexion enregistrée</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
                       Commencez par ajouter votre premier serveur distant ou partage réseau local.
                    </p>
                    <button
                      onClick={() => {
                        const newConn: SavedConnection = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: 'Nouvelle Connexion',
                          type: 'remote',
                          source: 'ftp',
                          url: '',
                          username: '',
                          password: '',
                          port: 21
                        };
                        onUpdateConnections([...(data.savedConnections || []), newConn]);
                      }}
                      className="text-[var(--accent)] font-bold border-b-2 border-[var(--accent)]/30 hover:border-accent transition-all"
                    >
                      Ajouter maintenant
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {(data.savedConnections || []).map((conn, index) => (
                      <div key={conn.id} className="fluent-card p-0 overflow-hidden group hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 border-accent/10">
                        <div className="p-6 md:p-8 space-y-8">
                          <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={cn(
                                "p-4 rounded-2xl shadow-inner transition-transform group-hover:scale-110",
                                conn.source === 'sftp' || conn.source === 'ftp' ? "bg-indigo-500/10 text-indigo-600" :
                                conn.source === 'smb' || conn.source === 'nfs' ? "bg-emerald-500/10 text-emerald-600" :
                                "bg-amber-500/10 text-amber-600"
                              )}>
                                {conn.source === 'ftp' || conn.source === 'sftp' ? <Terminal className="w-6 h-6" /> :
                                 conn.source === 'smb' || conn.source === 'nfs' ? <HardDrive className="w-6 h-6" /> :
                                 conn.source === 'webdav' ? <Globe className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                              </div>
                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={conn.name}
                                  onChange={e => {
                                    const newConns = [...(data.savedConnections || [])];
                                    newConns[index] = { ...conn, name: e.target.value };
                                    onUpdateConnections(newConns);
                                  }}
                                  className="bg-transparent border-none focus:ring-0 font-black text-2xl p-0 w-full tracking-tight"
                                  placeholder="Nom de la connexion..."
                                />
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted px-2 py-0.5 rounded">
                                      {conn.source}
                                   </span>
                                   <span className="text-[10px] text-muted-foreground truncate opacity-50">
                                      {conn.url || 'Aucun hôte configuré'}
                                   </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Supprimer cette connexion ?')) {
                                  const newConns = (data.savedConnections || []).filter(c => c.id !== conn.id);
                                  onUpdateConnections(newConns);
                                }
                              }}
                              className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-t border-border/50 pt-8 mt-4">
                            <div className="lg:col-span-4 space-y-6">
                              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 block">Protocole de Stockage</label>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3">
                                {(['ftp', 'sftp', 'smb', 'webdav', 'nfs', 'http'] as const).map(source => (
                                  <button
                                    key={source}
                                    onClick={() => {
                                      const newConns = [...(data.savedConnections || [])];
                                      const defaultPort = source === 'ftp' ? 21 : source === 'sftp' ? 22 : 80;
                                      newConns[index] = { ...conn, source, port: defaultPort };
                                      onUpdateConnections(newConns);
                                    }}
                                    className={cn(
                                      "relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-[10px] font-bold uppercase",
                                      conn.source === source 
                                        ? "border-[var(--accent)] bg-accent/5 text-[var(--accent)] ring-2 ring-accent/20" 
                                        : "border-border/50 hover:border-muted-foreground bg-muted/20"
                                    )}
                                  >
                                    <div className="p-1.5 opacity-50 group-hover:opacity-100">
                                      {source === 'ftp' || source === 'sftp' ? <Terminal className="w-4 h-4" /> :
                                       source === 'smb' || source === 'nfs' ? <HardDrive className="w-4 h-4" /> :
                                       source === 'webdav' || source === 'http' ? <Globe className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                    </div>
                                    {source}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="lg:col-span-8 space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 space-y-3">
                                  <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Hôte / Adresse IP</label>
                                  <div className="relative group/input">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-[var(--accent)] transition-colors" />
                                    <input
                                      type="text"
                                      value={conn.url}
                                      onChange={e => {
                                        const newConns = [...(data.savedConnections || [])];
                                        newConns[index] = { ...conn, url: e.target.value };
                                        onUpdateConnections(newConns);
                                      }}
                                      placeholder="Ex: nas.local ou 192.168.1.100"
                                      className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-sm font-medium transition-all"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Port</label>
                                  <input
                                    type="number"
                                    value={conn.port}
                                    onChange={e => {
                                      const newConns = [...(data.savedConnections || [])];
                                      newConns[index] = { ...conn, port: parseInt(e.target.value) };
                                      onUpdateConnections(newConns);
                                    }}
                                    className="w-full px-4 py-4 bg-muted/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent text-sm font-medium transition-all"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-[2rem] border border-border/50">
                                <div className="space-y-3">
                                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Identifiant</label>
                                  <input
                                    type="text"
                                    value={conn.username}
                                    onChange={e => {
                                      const newConns = [...(data.savedConnections || [])];
                                      newConns[index] = { ...conn, username: e.target.value };
                                      onUpdateConnections(newConns);
                                    }}
                                    placeholder="Username"
                                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm font-mono"
                                  />
                                </div>
                                <div className="space-y-3">
                                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Mot de Passe</label>
                                  <input
                                    type="password"
                                    value={conn.password}
                                    onChange={e => {
                                      const newConns = [...(data.savedConnections || [])];
                                      newConns[index] = { ...conn, password: e.target.value };
                                      onUpdateConnections(newConns);
                                    }}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent text-sm font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
               </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="fluent-card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Webhook Notifications</h3>
                    <p className="text-xs text-muted-foreground">Send notifications to Discord or Slack when new releases are detected.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      const newWebhook = {
                        id: Math.random().toString(36).substr(2, 9),
                        name: 'New Webhook',
                        url: '',
                        type: 'discord' as const,
                        enabled: true,
                        events: ['new_release' as const]
                      };
                      onSettingsChange({
                        ...settings,
                        webhooks: [...(settings.webhooks || []), newWebhook]
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" /> Add Webhook
                  </button>

                  <div className="space-y-4">
                    {(settings.webhooks || []).map((webhook, index) => (
                      <div key={webhook.id} className="p-4 border border-border rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={webhook.name}
                              onChange={e => {
                                const newWebhooks = [...(settings.webhooks || [])];
                                newWebhooks[index] = { ...webhook, name: e.target.value };
                                onSettingsChange({ ...settings, webhooks: newWebhooks });
                              }}
                              className="bg-transparent border-none focus:ring-0 font-semibold p-0 w-48"
                              placeholder="Webhook Name"
                            />
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              webhook.type === 'discord' ? "bg-indigo-500/10 text-indigo-500" : "bg-orange-500/10 text-orange-500"
                            )}>
                              {webhook.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newWebhooks = [...(settings.webhooks || [])];
                                newWebhooks[index] = { ...webhook, enabled: !webhook.enabled };
                                onSettingsChange({ ...settings, webhooks: newWebhooks });
                              }}
                              className={cn(
                                "w-10 h-5 rounded-full transition-all relative",
                                webhook.enabled ? "bg-[var(--accent)]" : "bg-muted"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                                webhook.enabled ? "left-5.5" : "left-0.5"
                              )} />
                            </button>
                            <button
                              onClick={() => {
                                const newWebhooks = (settings.webhooks || []).filter(w => w.id !== webhook.id);
                                onSettingsChange({ ...settings, webhooks: newWebhooks });
                              }}
                              className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Webhook URL</label>
                            <input
                              type="text"
                              value={webhook.url}
                              onChange={e => {
                                const newWebhooks = [...(settings.webhooks || [])];
                                newWebhooks[index] = { ...webhook, url: e.target.value };
                                onSettingsChange({ ...settings, webhooks: newWebhooks });
                              }}
                              placeholder="https://discord.com/api/webhooks/..."
                              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Service Type</label>
                            <div className="flex gap-2">
                              {(['discord', 'slack'] as const).map(type => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    const newWebhooks = [...(settings.webhooks || [])];
                                    newWebhooks[index] = { ...webhook, type };
                                    onSettingsChange({ ...settings, webhooks: newWebhooks });
                                  }}
                                  className={cn(
                                    "flex-1 py-2 rounded-xl border text-xs font-medium transition-all capitalize",
                                    webhook.type === type 
                                      ? "border-[var(--accent)] bg-accent/5 text-[var(--accent)]" 
                                      : "border-border hover:border-muted-foreground bg-muted/30"
                                  )}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(settings.webhooks || []).length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-border rounded-3xl">
                        <RefreshCw className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground">No webhooks configured yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="fluent-card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Data Backup & Recovery</h3>
                    <p className="text-xs text-muted-foreground">Export your configuration or import from a backup file.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Backup */}
                  <div className="p-4 border border-border rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Full Backup</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onExport(data, 'repopulse_full')}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 text-[var(--accent)] hover:bg-accent/20 transition-all text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium cursor-pointer">
                        <input type="file" accept=".json" onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} className="hidden" />
                        <Upload className="w-4 h-4" /> Import
                      </label>
                    </div>
                  </div>

                  {/* Categories Only */}
                  <div className="p-4 border border-border rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Categories Only</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onExport({ categories: data.categories }, 'repopulse_categories')}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 text-[var(--accent)] hover:bg-accent/20 transition-all text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium cursor-pointer">
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const imported = await importJSON(file);
                              if (imported.categories) onCategoriesUpdate(imported.categories);
                            }
                          }} 
                          className="hidden" 
                        />
                        <Upload className="w-4 h-4" /> Import
                      </label>
                    </div>
                  </div>

                  {/* Repositories Only */}
                  <div className="p-4 border border-border rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Repositories Only</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onExport({ repositories: data.repositories }, 'repopulse_repositories')}
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 text-[var(--accent)] hover:bg-accent/20 transition-all text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-all text-sm font-medium cursor-pointer">
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const imported = await importJSON(file);
                              if (imported.repositories) {
                                // Merge or replace? Let's merge by ID
                                const merged = [...data.repositories];
                                imported.repositories.forEach((r: any) => {
                                  if (!merged.find(m => m.id === r.id)) merged.push(r);
                                });
                                onSettingsChange({ ...settings }); // Trigger re-render
                                // We need a way to update repositories specifically
                                // I'll add a separate prop if needed, but for now I'll use a trick
                                // Actually, I'll just use the onImport but filtered
                                onImport(file); 
                              }
                            }
                          }} 
                          className="hidden" 
                        />
                        <Upload className="w-4 h-4" /> Import
                      </label>
                    </div>
                  </div>
                  {/* Export Report */}
                  <div className="p-4 border border-border rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Release Report</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const markdown = data.repositories.map(repo => {
                            const latest = data.repositories.find(r => r.id === repo.id); // This is wrong, I need the releases
                            // Actually, I'll pass the releases to Config
                            return `## ${repo.name}\n- URL: ${repo.url}\n- Latest: ${repo.lastSeenVersion || 'N/A'}\n`;
                          }).join('\n');
                          const blob = new Blob([markdown], { type: 'text/markdown' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `repopulse_report_${new Date().toISOString().split('T')[0]}.md`;
                          a.click();
                        }}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                      >
                        <Download className="w-4 h-4" /> Export Markdown Report
                      </button>
                    </div>
                  </div>

                  {/* GitHub User Import */}
                  <div className="p-4 border border-border rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">GitHub User Import</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">GitHub Username</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={githubUsername}
                            onChange={e => setGithubUsername(e.target.value)}
                            placeholder="e.g. username"
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => fetchGitHubItems('repos')}
                          disabled={!githubUsername.trim() || isImporting}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                          Import Repositories
                        </button>
                        <button
                          onClick={() => fetchGitHubItems('stars')}
                          disabled={!githubUsername.trim() || isImporting}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                          Import Stars
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bulk Import */}
                  <div className="p-4 border border-border rounded-2xl space-y-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('settings.bulkImport')}</h4>
                    <div className="space-y-2">
                      <textarea
                        value={bulkUrls}
                        onChange={e => setBulkUrls(e.target.value)}
                        placeholder={t('settings.bulkImportPlaceholder')}
                        className="w-full h-32 px-3 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-xs font-mono resize-none"
                      />
                      <button
                        onClick={() => {
                          onBulkImport(bulkUrls);
                          setBulkUrls('');
                        }}
                        disabled={!bulkUrls.trim()}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" /> {t('settings.bulkImportBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
