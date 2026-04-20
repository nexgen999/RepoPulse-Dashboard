/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SftpClient from "ssh2-sftp-client";
import { ExplorerPlugin, FileItem } from "../types";

export const SftpPlugin: ExplorerPlugin = {
  id: 'sftp',
  list: async (options) => {
    const { url, username, password, port } = options;
    const sftp = new SftpClient();
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || parseInt(parsedUrl.port) || 22,
        username: username,
        password: password
      });
      const list = await sftp.list(parsedUrl.pathname || "/");
      return list.map(item => ({
        name: item.name,
        type: item.type === 'd' ? 'directory' : 'file',
        size: item.size,
        modified: new Date(item.modifyTime).toISOString()
      }));
    } finally {
      await sftp.end();
    }
  },
  action: async (action, options) => {
    const { url, path: itemPath, newName, username, password, port } = options;
    const sftp = new SftpClient();
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || 22,
        username: username,
        password: password
      });
      
      if (action === 'delete') {
        const stats = await sftp.stat(itemPath);
        if (stats.isDirectory) {
          await sftp.rmdir(itemPath, true);
        } else {
          await sftp.delete(itemPath);
        }
      } else if (action === 'rename') {
        const parent = itemPath.split('/').slice(0, -1).join('/');
        await sftp.rename(itemPath, (parent ? parent + '/' : '') + newName);
      }
      return { success: true };
    } finally {
      await sftp.end();
    }
  },
  download: async (itemPath, options) => {
    const { url, username, password, port } = options;
    const sftp = new SftpClient();
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || 22,
        username: username,
        password: password
      });
      const stream = new (require('stream').PassThrough)();
      await sftp.get(itemPath, stream);
      // Note: sftp.end() should be called after stream is consumed, 
      // but for simplicity in this proxy we might need a better stream management.
      // For now, we'll assume the manager handles it or we use a buffer.
      return stream;
    } catch (e) {
      await sftp.end();
      throw e;
    }
  },
  upload: async (itemPath, data, options) => {
    const { url, username, password, port } = options;
    const sftp = new SftpClient();
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || 22,
        username: username,
        password: password
      });
      await sftp.put(data, itemPath);
    } finally {
      await sftp.end();
    }
  },
  chmod: async (itemPath, mode, options) => {
    const { url, username, password, port } = options;
    const sftp = new SftpClient();
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || 22,
        username: username,
        password: password
      });
      await sftp.chmod(itemPath, parseInt(mode, 8));
      return { success: true };
    } finally {
      await sftp.end();
    }
  },
  getHash: async (itemPath, type, options) => {
    const { url, username, password, port } = options;
    const sftp = new SftpClient();
    const crypto = await import('crypto');
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || 22,
        username: username,
        password: password
      });
      const buffer = await sftp.get(itemPath);
      const hashSum = crypto.createHash(type);
      hashSum.update(buffer as Buffer);
      return hashSum.digest('hex');
    } finally {
      await sftp.end();
    }
  },
  getSize: async (itemPath, options) => {
    const { url, username, password, port } = options;
    const sftp = new SftpClient();
    try {
      const parsedUrl = new URL(url);
      await sftp.connect({
        host: parsedUrl.hostname,
        port: port || 22,
        username: username,
        password: password
      });
      
      const calculateSize = async (path: string): Promise<number> => {
        let size = 0;
        const list = await sftp.list(path);
        for (const item of list) {
          if (item.type === 'd') {
            size += await calculateSize(path + (path.endsWith('/') ? '' : '/') + item.name);
          } else {
            size += item.size;
          }
        }
        return size;
      };
      
      const stats = await sftp.stat(itemPath);
      return stats.isDirectory ? await calculateSize(itemPath) : stats.size;
    } finally {
      await sftp.end();
    }
  }
};
