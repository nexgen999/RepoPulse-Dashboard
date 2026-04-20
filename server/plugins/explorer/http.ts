/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import { ExplorerPlugin, FileItem } from "../types";

export const HttpExplorerPlugin: ExplorerPlugin = {
  id: 'http',
  list: async (options) => {
    const { url } = options;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'RepoPulse-Dashboard/1.0' }
    });
    const text = response.data;
    const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis;
    const links = [...text.matchAll(linkRegex)];

    const IGNORED_DOMAINS = [
      'browserhappy.com', 
      'google.com', 
      'facebook.com', 
      'twitter.com', 
      'apple.com', 
      'microsoft.com',
      'apache.org',
      'nginx.org'
    ];

    const IGNORED_PATHS = [
      '_h5ai',
      '__h5ai',
      'cgi-bin',
      '.well-known',
      'lost+found',
      '.ds_store',
      'thumbs.db',
      'desktop.ini',
      '.htaccess',
      '.htpasswd',
      'icons',
      'error'
    ];

    return links.map(match => {
      const href = match[1];
      const name = decodeURIComponent(href.replace(/\/$/, '').split('/').pop() || href);
      
      if (href.startsWith('..') || href.startsWith('?') || href.startsWith('#')) return null;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return null;
      if (IGNORED_DOMAINS.some(domain => href.includes(domain))) return null;
      if (IGNORED_PATHS.some(p => name.toLowerCase() === p || href.toLowerCase().includes(`/${p}/`))) return null;
      if (name.startsWith('.') && name !== '.' && name !== '..') return null; // Hide hidden files/folders

      const isDir = href.endsWith('/');
      const item: FileItem = {
        name,
        type: isDir ? 'directory' : 'file',
        size: 0,
        modified: new Date().toISOString()
      };
      return item;
    })
    .filter((item): item is FileItem => item !== null)
    .sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type === b.type) {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
      return a.type === 'directory' ? -1 : 1;
    });
  }
};
