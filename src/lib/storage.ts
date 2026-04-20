/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, AppSettings, Category, Repository, SavedConnection } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  accentColor: '#0078d4', // Fluent Blue
  theme: 'dark',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  autoRefreshInterval: 30,
  language: 'en',
  backupPath: 'Repopulse_Backups',
  dashboardLayout: 'list',
  sidebarViewMode: 'list',
  webhooks: [],
  glassmorphism: {
    enabled: true,
    opacity: 0.1,
    blur: 10,
  },
  customThemes: [],
  customThemeConfig: {
    background: '#1a1a1a',
    foreground: '#ffffff',
    card: '#2b2b2b',
    border: '#3d3d3d',
    muted: '#333333',
    accent: '#0078d4'
  }
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'all',
    name: 'All',
    icon: 'Layers',
    order: 0,
    children: [
      {
        id: 'consoles',
        name: 'Consoles',
        icon: 'Gamepad2',
        order: 0,
        children: [
          {
            id: 'nintendo',
            name: 'Nintendo',
            icon: 'MonitorPlay',
            order: 0,
            children: [
              { id: 'switch', name: 'Switch', icon: 'Gamepad', order: 0, children: [] },
              { id: 'switch2', name: 'Switch 2', icon: 'Gamepad', order: 1, children: [] },
            ]
          },
          {
            id: 'playstation',
            name: 'Playstation',
            icon: 'Disc',
            order: 1,
            children: [
              { id: 'ps1', name: 'PS1', icon: 'Disc', order: 0, children: [] },
              { id: 'ps2', name: 'PS2', icon: 'Disc', order: 1, children: [] },
              { id: 'ps3', name: 'PS3', icon: 'Disc', order: 2, children: [] },
              { id: 'ps4', name: 'PS4', icon: 'Disc', order: 3, children: [] },
              { id: 'ps5', name: 'PS5', icon: 'Disc', order: 4, children: [] },
              { id: 'psp', name: 'PSP', icon: 'Smartphone', order: 5, children: [] },
              { id: 'psvita', name: 'PS Vita', icon: 'Smartphone', order: 6, children: [] },
            ]
          },
          {
            id: 'xbox',
            name: 'Xbox',
            icon: 'Gamepad',
            order: 2,
            children: [
              { id: 'xboxog', name: 'Xbox OG', icon: 'Gamepad', order: 0, children: [] },
              { id: 'xbox360', name: 'Xbox 360', icon: 'Gamepad', order: 1, children: [] },
              { id: 'xboxone', name: 'Xbox One', icon: 'Gamepad', order: 2, children: [] },
              { id: 'xboxseries', name: 'Xbox Series', icon: 'Gamepad', order: 3, children: [] },
            ]
          }
        ]
      },
      {
        id: 'emulation',
        name: 'Emulation',
        icon: 'Cpu',
        order: 1,
        children: [
          { id: 'frontend', name: 'Front-End', icon: 'Monitor', order: 0, children: [] },
          { id: 'emulators', name: 'Emulators', icon: 'Cpu', order: 1, children: [] },
          { id: 'bios', name: 'Bios', icon: 'Shield', order: 2, children: [] },
          { id: 'tools', name: 'Tools', icon: 'Wrench', order: 3, children: [] },
        ]
      },
      {
        id: 'mobile',
        name: 'Mobile',
        icon: 'Smartphone',
        order: 2,
        children: [
          { id: 'android', name: 'Android', icon: 'Smartphone', order: 0, children: [] },
          { id: 'ios', name: 'IOS', icon: 'Smartphone', order: 1, children: [] },
        ]
      },
      {
        id: 'pc',
        name: 'PC',
        icon: 'Monitor',
        order: 3,
        children: [
          { id: 'windows', name: 'Windows', icon: 'Monitor', order: 0, children: [] },
          { id: 'linux', name: 'Linux', icon: 'Terminal', order: 1, children: [] },
          { id: 'macos', name: 'MacOS', icon: 'Monitor', order: 2, children: [] },
        ]
      },
      {
        id: 'uncategorized',
        name: 'Uncategorized',
        icon: 'Folder',
        order: 4,
        children: []
      },
    ]
  }
];

export const loadDataFromServer = async (): Promise<AppData> => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch data');
    const data = await response.json();

    // Ensure settings exist
    const settings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS;

    // Recursive function to migrate categories
    const migrateCategories = (cats: any[]): Category[] => {
      if (!Array.isArray(cats)) return [];
      return cats.map(cat => ({
        id: cat.id || Math.random().toString(36).substr(2, 9),
        name: cat.name || 'Unnamed',
        icon: cat.icon || 'Folder',
        color: cat.color || '',
        order: typeof cat.order === 'number' ? cat.order : 0,
        children: migrateCategories(cat.children || cat.subCategories || [])
      }));
    };

    const findCategoryById = (cats: Category[], id: string): Category | undefined => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategoryById(cat.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    let categories = data.categories ? migrateCategories(data.categories) : DEFAULT_CATEGORIES;
    
    // Ensure uncategorized exists somewhere in the hierarchy
    if (!findCategoryById(categories, 'uncategorized')) {
      categories.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        icon: 'Folder',
        order: 99,
        children: []
      });
    }

    // Migration for repositories
    const repositories = (data.repositories || []).map((r: any) => ({
      ...r,
      categoryPath: Array.isArray(r.categoryPath) ? r.categoryPath : [r.category, r.subCategory].filter(Boolean),
      backupEnabled: !!r.backupEnabled,
      osTags: Array.isArray(r.osTags) ? r.osTags : [],
      lastSeenVersion: r.lastSeenVersion || ''
    }));

    const savedConnections = data.savedConnections || [];

    return { settings, categories, repositories, savedConnections };
  } catch (e) {
    console.error('Failed to load data from server', e);
    return {
      repositories: [],
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
    };
  }
};

export const saveSettings = async (settings: AppSettings) => {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};

export const saveRepositories = async (repos: Repository[]) => {
  try {
    await fetch('/api/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repos)
    });
  } catch (e) {
    console.error('Failed to save repositories', e);
  }
};

export const saveCategories = async (categories: Category[]) => {
  try {
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categories)
    });
  } catch (e) {
    console.error('Failed to save categories', e);
  }
};

export const saveSavedConnections = async (connections: SavedConnection[]) => {
  try {
    await fetch('/api/saved-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connections)
    });
  } catch (e) {
    console.error('Failed to save connections', e);
  }
};

export const uploadIcon = async (name: string, data: string): Promise<string> => {
  try {
    const response = await fetch('/api/upload-icon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data })
    });
    if (!response.ok) throw new Error('Failed to upload icon');
    const result = await response.json();
    return result.url;
  } catch (e) {
    console.error('Failed to upload icon', e);
    throw e;
  }
};

export const createBackupDir = async (repoName: string, version: string) => {
  try {
    await fetch('/api/backup-version', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName, version })
    });
  } catch (e) {
    console.error('Failed to create backup directory', e);
  }
};

export const downloadBackup = async (url: string, repoName: string, version: string, fileName: string) => {
  try {
    await fetch('/api/download-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, repoName, version, fileName })
    });
  } catch (e) {
    console.error('Failed to download backup', e);
  }
};

export const exportData = (data: any, filename: string, backupPath?: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  const fullFilename = backupPath ? `${backupPath}_${filename}_${date}.json` : `${filename}_${date}.json`;
  a.href = url;
  a.download = fullFilename;
  a.click();
  URL.revokeObjectURL(url);
};

export const importJSON = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
