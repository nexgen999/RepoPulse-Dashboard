/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { exec } from "child_process";
import { promisify } from "util";
import { ExplorerPlugin, FileItem } from "../types";

const execAsync = promisify(exec);

const TRASH_DIR = path.join(process.cwd(), 'user', '.trash');
if (!fs.existsSync(TRASH_DIR)) {
  fs.mkdirSync(TRASH_DIR, { recursive: true });
}

export const LocalPlugin: ExplorerPlugin = {
  id: 'local',
  list: async (options) => {
    const { path: relPath } = options;
    
    // On Windows, if path is empty or "DRIVES", list all logical drives
    if (process.platform === 'win32' && (!relPath || relPath === 'DRIVES' || relPath === '/')) {
      try {
        const { stdout } = await execAsync('wmic logicaldisk get name');
        const drives = stdout.split('\r\r\n')
          .filter(line => /[A-Z]:/.test(line))
          .map(line => line.trim());
        
        return drives.map(drive => ({
          name: drive,
          path: drive + '/',
          type: 'directory',
          size: 0,
          modified: new Date().toISOString(),
          isDrive: true
        }));
      } catch (err) {
        // Fallback to process.cwd() if wmic fails
      }
    }

    const targetPath = relPath ? (path.isAbsolute(relPath as string) ? relPath as string : path.join(process.cwd(), relPath as string)) : process.cwd();
    
    // Ensure path exists before listing
    if (!fs.existsSync(targetPath)) {
      // If listing root and wmic drives failed, return at least C:/ or /
      if (!relPath || relPath === '/' || relPath === 'DRIVES') {
         return [{ name: '/', path: '/', type: 'directory', size: 0, modified: new Date().toISOString() }];
      }
      throw new Error(`Path not found: ${targetPath}`);
    }

    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      throw new Error("Not a directory");
    }

    const files = fs.readdirSync(targetPath);
    return files.map(file => {
      try {
        const filePath = path.join(targetPath, file);
        const fileStats = fs.statSync(filePath);
        const item: FileItem = {
          name: file,
          path: filePath.replace(/\\/g, '/'),
          type: fileStats.isDirectory() ? 'directory' : 'file',
          size: fileStats.size,
          modified: fileStats.mtime.toISOString(),
          extension: path.extname(file).slice(1),
          permissions: (fileStats.mode & 0o777).toString(8)
        };
        return item;
      } catch (e) {
        return null;
      }
    }).filter((item): item is FileItem => item !== null);
  },
  action: async (action, options) => {
    const { path: itemPath, newName, oldPath, newPath, useTrash } = options;
    
    if (action === 'delete') {
      const fullPath = path.isAbsolute(itemPath) ? itemPath : path.join(process.cwd(), itemPath);
      if (useTrash) {
        const trashPath = path.join(TRASH_DIR, `${Date.now()}_${path.basename(fullPath)}`);
        fs.renameSync(fullPath, trashPath);
      } else {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
    } else if (action === 'rename') {
      const oldFullPath = path.isAbsolute(oldPath) ? oldPath : path.join(process.cwd(), oldPath);
      const newFullPath = path.isAbsolute(newPath) ? newPath : path.join(process.cwd(), newPath);
      fs.renameSync(oldFullPath, newFullPath);
    } else if (action === 'create-folder') {
      const fullPath = path.isAbsolute(itemPath) ? path.join(itemPath, newName) : path.join(process.cwd(), itemPath, newName);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
    return { success: true };
  },
  download: async (itemPath, options) => {
    const fullPath = path.isAbsolute(itemPath) ? itemPath : path.join(process.cwd(), itemPath);
    return fs.createReadStream(fullPath);
  },
  upload: async (itemPath, data, options) => {
    const fullPath = path.isAbsolute(itemPath) ? itemPath : path.join(process.cwd(), itemPath);
    if (data.pipe) {
      const writer = fs.createWriteStream(fullPath);
      data.pipe(writer);
      return new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });
    } else {
      fs.writeFileSync(fullPath, data);
    }
  },
  chmod: async (itemPath, mode, options) => {
    const fullPath = path.isAbsolute(itemPath) ? itemPath : path.join(process.cwd(), itemPath);
    fs.chmodSync(fullPath, parseInt(mode, 8));
    return { success: true };
  },
  getHash: async (itemPath, type, options) => {
    const fullPath = path.isAbsolute(itemPath) ? itemPath : path.join(process.cwd(), itemPath);
    const fileBuffer = fs.readFileSync(fullPath);
    const hashSum = crypto.createHash(type);
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  },
  getSize: async (itemPath, options) => {
    const fullPath = path.isAbsolute(itemPath) ? itemPath : path.join(process.cwd(), itemPath);
    const getDirSize = (dirPath: string): number => {
      let size = 0;
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          size += getDirSize(filePath);
        } else {
          size += stats.size;
        }
      }
      return size;
    };
    const stats = fs.statSync(fullPath);
    return stats.isDirectory() ? getDirSize(fullPath) : stats.size;
  }
};
