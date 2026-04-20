/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import SMB2 from "smb2";
import { ExplorerPlugin, FileItem } from "../types";

export const SmbPlugin: ExplorerPlugin = {
  id: 'smb',
  list: async (options) => {
    const { url, username, password } = options;
    const parsedUrl = new URL(url);
    const smbClient = new SMB2({
      share: `\\\\${parsedUrl.hostname}${parsedUrl.pathname.replace(/\//g, '\\')}`,
      domain: 'WORKGROUP',
      username: username,
      password: password,
    });
    
    return new Promise((resolve, reject) => {
      smbClient.readdir('', (err: any, files: any) => {
        if (err) return reject(err);
        resolve(files.map((f: any) => ({
          name: f,
          type: 'file',
          size: 0,
          modified: new Date()
        })));
      });
    });
  }
};
