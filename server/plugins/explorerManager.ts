/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExplorerPlugin } from "./types";
import { FtpPlugin } from "./explorer/ftp";
import { SftpPlugin } from "./explorer/sftp";
import { WebdavPlugin } from "./explorer/webdav";
import { SmbPlugin } from "./explorer/smb";
import { HttpExplorerPlugin } from "./explorer/http";
import { LocalPlugin } from "./explorer/local";

class ExplorerManager {
  private plugins: Map<string, ExplorerPlugin> = new Map();

  constructor() {
    this.register(LocalPlugin);
    this.register(FtpPlugin);
    this.register(SftpPlugin);
    this.register(WebdavPlugin);
    this.register(SmbPlugin);
    this.register(HttpExplorerPlugin);
  }

  register(plugin: ExplorerPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(id: string): ExplorerPlugin | undefined {
    return this.plugins.get(id);
  }

  async list(source: string, options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin) throw new Error(`Unsupported source: ${source}`);
    return plugin.list(options);
  }

  async action(source: string, action: string, options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin || !plugin.action) throw new Error(`Unsupported source or action: ${source}`);
    return plugin.action(action, options);
  }

  async download(source: string, path: string, options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin || !plugin.download) throw new Error(`Unsupported source or download not implemented: ${source}`);
    return plugin.download(path, options);
  }

  async upload(source: string, path: string, data: any, options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin || !plugin.upload) throw new Error(`Unsupported source or upload not implemented: ${source}`);
    return plugin.upload(path, data, options);
  }

  async chmod(source: string, path: string, mode: string, options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin || !plugin.chmod) throw new Error(`Unsupported source or chmod not implemented: ${source}`);
    return plugin.chmod(path, mode, options);
  }

  async getHash(source: string, path: string, type: 'md5' | 'sha256', options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin || !plugin.getHash) throw new Error(`Unsupported source or getHash not implemented: ${source}`);
    return plugin.getHash(path, type, options);
  }

  async getSize(source: string, path: string, options: any) {
    const plugin = this.getPlugin(source);
    if (!plugin || !plugin.getSize) throw new Error(`Unsupported source or getSize not implemented: ${source}`);
    return plugin.getSize(path, options);
  }
}

export const explorerManager = new ExplorerManager();
