/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string | Date;
  url?: string;
  path?: string;
  extension?: string;
  isDrive?: boolean;
  permissions?: string;
  hash?: {
    md5?: string;
    sha256?: string;
  };
}

export interface ExplorerPlugin {
  id: string;
  list: (options: any) => Promise<FileItem[]>;
  action?: (action: string, options: any) => Promise<any>;
  download?: (path: string, options: any) => Promise<any>; // Stream or Buffer
  upload?: (path: string, data: any, options: any) => Promise<any>;
  chmod?: (path: string, mode: string, options: any) => Promise<any>;
  getHash?: (path: string, type: 'md5' | 'sha256', options: any) => Promise<string>;
  getSize?: (path: string, options: any) => Promise<number>; // Recursive for dirs
}

export interface DashboardPlugin {
  id: string;
  fetchReleases: (url: string, options: any) => Promise<any>;
}
