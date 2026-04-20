/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient as createWebDAVClient } from "webdav";
import { ExplorerPlugin, FileItem } from "../types";

export const WebdavPlugin: ExplorerPlugin = {
  id: 'webdav',
  list: async (options) => {
    const { url, username, password } = options;
    const client = createWebDAVClient(url, {
      username: username,
      password: password,
    });
    const contents = await client.getDirectoryContents("/");
    return (contents as any[]).map((item: any) => ({
      name: item.basename,
      type: item.type,
      size: item.size,
      modified: item.lastmod
    }));
  },
  action: async (action, options) => {
    const { url, path: itemPath, newName, username, password } = options;
    const client = createWebDAVClient(url, { username, password });
    if (action === 'delete') {
      await client.deleteFile(itemPath);
    } else if (action === 'rename') {
      const parts = itemPath.split('/').filter(Boolean);
      parts.pop();
      const parent = '/' + parts.join('/');
      await client.moveFile(itemPath, (parent === '/' ? '/' : parent + '/') + newName);
    }
    return { success: true };
  },
  download: async (itemPath, options) => {
    const { url, username, password } = options;
    const client = createWebDAVClient(url, { username, password });
    return client.createReadStream(itemPath);
  },
  upload: async (itemPath, data, options) => {
    const { url, username, password } = options;
    const client = createWebDAVClient(url, { username, password });
    if (data.pipe) {
      const stream = client.createWriteStream(itemPath);
      data.pipe(stream);
      return new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
    } else {
      await client.putFileContents(itemPath, data);
    }
  }
};
