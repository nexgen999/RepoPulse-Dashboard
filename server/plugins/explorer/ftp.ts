/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as ftp from "basic-ftp";
import { ExplorerPlugin, FileItem } from "../types";

export const FtpPlugin: ExplorerPlugin = {
  id: 'ftp',
  list: async (options) => {
    const { url, username, password, port } = options;
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
      const parsedUrl = new URL(url);
      await client.access({
        host: parsedUrl.hostname,
        user: username || "anonymous",
        password: password || "anonymous",
        port: port || parseInt(parsedUrl.port) || 21,
        secure: parsedUrl.protocol === "ftps:"
      });
      const list = await client.list(parsedUrl.pathname || "/");
      return list.map(item => ({
        name: item.name,
        type: item.isDirectory ? 'directory' : 'file',
        size: item.size,
        modified: item.modifiedAt
      }));
    } finally {
      client.close();
    }
  },
  action: async (action, options) => {
    const { url, path: itemPath, newName, username, password, port } = options;
    const client = new ftp.Client();
    try {
      const parsedUrl = new URL(url);
      await client.access({
        host: parsedUrl.hostname,
        user: username || "anonymous",
        password: password || "anonymous",
        port: port || parseInt(parsedUrl.port) || 21
      });
      
      if (action === 'delete') {
        await client.remove(itemPath);
      } else if (action === 'rename') {
        const parent = itemPath.split('/').slice(0, -1).join('/');
        await client.rename(itemPath, (parent ? parent + '/' : '') + newName);
      }
      return { success: true };
    } finally {
      client.close();
    }
  },
  download: async (itemPath, options) => {
    const { url, username, password, port } = options;
    const client = new ftp.Client();
    try {
      const parsedUrl = new URL(url);
      await client.access({
        host: parsedUrl.hostname,
        user: username || "anonymous",
        password: password || "anonymous",
        port: port || parseInt(parsedUrl.port) || 21
      });
      const stream = new (require('stream').PassThrough)();
      await client.downloadTo(stream, itemPath);
      return stream;
    } catch (e) {
      client.close();
      throw e;
    }
    // Note: client.close() should be handled by the caller or via stream events
  },
  upload: async (itemPath, data, options) => {
    const { url, username, password, port } = options;
    const client = new ftp.Client();
    try {
      const parsedUrl = new URL(url);
      await client.access({
        host: parsedUrl.hostname,
        user: username || "anonymous",
        password: password || "anonymous",
        port: port || parseInt(parsedUrl.port) || 21
      });
      await client.uploadFrom(data, itemPath);
    } finally {
      client.close();
    }
  },
  chmod: async (itemPath, mode, options) => {
    const { url, username, password, port } = options;
    const client = new ftp.Client();
    try {
      const parsedUrl = new URL(url);
      await client.access({
        host: parsedUrl.hostname,
        user: username || "anonymous",
        password: password || "anonymous",
        port: port || parseInt(parsedUrl.port) || 21
      });
      await client.send(`SITE CHMOD ${mode} ${itemPath}`);
      return { success: true };
    } finally {
      client.close();
    }
  },
  getSize: async (itemPath, options) => {
    const { url, username, password, port } = options;
    const client = new ftp.Client();
    try {
      const parsedUrl = new URL(url);
      await client.access({
        host: parsedUrl.hostname,
        user: username || "anonymous",
        password: password || "anonymous",
        port: port || parseInt(parsedUrl.port) || 21
      });
      
      const calculateSize = async (path: string): Promise<number> => {
        let size = 0;
        const list = await client.list(path);
        for (const item of list) {
          if (item.isDirectory) {
            size += await calculateSize(path + (path.endsWith('/') ? '' : '/') + item.name);
          } else {
            size += item.size;
          }
        }
        return size;
      };
      
      return await calculateSize(itemPath);
    } finally {
      client.close();
    }
  }
};
