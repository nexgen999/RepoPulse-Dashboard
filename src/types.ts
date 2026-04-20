/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OS = 'Windows' | 'Linux' | 'macOS' | 'Android' | 'iOS';

export type RepoSource = 'github' | 'gitlab' | 'bitbucket' | 'gitea' | 'forgejo' | 'codeberg' | 'git' | 'http' | 'ftp' | 'sftp' | 'smb' | 'webdav' | 'nfs' | 'android_fdroid';

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: 'discord' | 'slack' | 'generic';
  enabled: boolean;
  events: ('new_release' | 'backup_completed' | 'error')[];
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  extension?: string;
}

export interface TransferTask {
  id: string;
  fileName: string;
  sourcePath: string;
  destPath: string;
  type: 'upload' | 'download';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  speed: number; // bytes per second
  totalSize: number;
  transferredSize: number;
  startTime: number;
  error?: string;
}

export interface Repository {
  id: string;
  url: string;
  name: string;
  owner: string;
  source: RepoSource;
  categoryPath: string[]; // Path of category IDs for up to 5 levels
  osTags: OS[];
  addedAt: number;
  backupEnabled: boolean;
  isFavorite?: boolean;
  lastSeenVersion?: string;
  showPreReleases?: boolean;
  showDrafts?: boolean;
  username?: string;
  password?: string;
  port?: number;
}

export interface ReleaseAsset {
  name: string;
  url: string;
  size: number;
}

export interface Release {
  repoId: string;
  repoName: string;
  tagName: string;
  name: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
  zipUrl: string;
  binaryUrl?: string;
  assets: ReleaseAsset[];
  source: RepoSource;
  isDir?: boolean;
  type?: 'file' | 'directory';
  version?: string;
  isLatest?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  customIcon?: string; // Base64 string for PNG/ICO
  color?: string;
  order: number;
  children: Category[]; // Recursive structure
}

export interface AppSettings {
  accentColor: string;
  theme: 'light' | 'dark' | 'midnight' | 'forest' | 'sunset' | 'ocean' | 'custom';
  fontFamily: string;
  fontSize: number;
  githubToken?: string;
  autoRefreshInterval: number; // in minutes, 0 to disable
  language: string;
  backupPath: string;
  dashboardLayout: 'list' | 'columns' | 'explorer';
  sidebarViewMode: 'cascading' | 'list';
  webhooks: WebhookConfig[];
  favicon?: string;
  sidebarIcons?: Record<string, string>;
  serviceIcons?: Record<string, string>;
  glassmorphism: {
    enabled: boolean;
    opacity: number;
    blur: number;
  };
  customThemeConfig?: {
    background: string;
    foreground: string;
    card: string;
    border: string;
    muted: string;
    accent: string;
  };
  customThemes: {
    id: string;
    name: string;
    accent: string;
    bg: string;
    card: string;
  }[];
}

export interface SavedConnection {
  id: string;
  name: string;
  type: 'local' | 'remote';
  source?: RepoSource;
  url?: string;
  path?: string;
  username?: string;
  password?: string;
  port?: number;
  provider?: string;
}

export interface AppData {
  repositories: Repository[];
  categories: Category[];
  settings: AppSettings;
  savedConnections?: SavedConnection[];
}
