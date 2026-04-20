import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import { explorerManager } from "./server/plugins/explorerManager";
import { dashboardManager } from "./server/plugins/dashboardManager";
import { notifyWebhooks } from "./server/utils/notifications.js";
import { normalizeUrl } from "./server/plugins/utils";
import { encrypt, decrypt } from "./server/utils/crypto";
import crypto from "crypto";
import { Dropbox } from "dropbox";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_DATA_DIR = path.join(__dirname, "user");
const ICONS_DIR = path.join(USER_DATA_DIR, "icons");
const SERVICE_ICONS_DIR = path.join(ICONS_DIR, "services");
const FAVICON_DIR = path.join(USER_DATA_DIR, "favicon");
const SIDEBAR_ICONS_DIR = path.join(USER_DATA_DIR, "sidebar");
const BACKUP_DIR = path.join(__dirname, "Backup_RepoPulse");
const SETTINGS_FILE = path.join(USER_DATA_DIR, "settings.json");
const REPOS_FILE = path.join(USER_DATA_DIR, "repositories.json");
const CATEGORIES_FILE = path.join(USER_DATA_DIR, "categories.json");
const SAVED_CONNECTIONS_FILE = path.join(USER_DATA_DIR, "saved_connections.json");
const TRANSFER_LOGS_FILE = path.join(USER_DATA_DIR, "transfer_logs.json");
const TRASH_DIR = path.join(USER_DATA_DIR, ".trash");

// Protocol specific user data dirs
const FTP_USER_DIR = path.join(USER_DATA_DIR, "ftp");
const SMB_USER_DIR = path.join(USER_DATA_DIR, "smb");
const WEBDAV_USER_DIR = path.join(USER_DATA_DIR, "webdav");
const NFS_USER_DIR = path.join(USER_DATA_DIR, "nfs");

// Ensure directories exist
[USER_DATA_DIR, ICONS_DIR, SERVICE_ICONS_DIR, FAVICON_DIR, SIDEBAR_ICONS_DIR, BACKUP_DIR, FTP_USER_DIR, SMB_USER_DIR, WEBDAV_USER_DIR, NFS_USER_DIR, TRASH_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function logTransfer(source: string, dest: string, fileName: string, status: 'success' | 'error', error?: string) {
  const log = {
    timestamp: new Date().toISOString(),
    source,
    dest,
    fileName,
    status,
    error
  };
  let logs = [];
  if (fs.existsSync(TRANSFER_LOGS_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(TRANSFER_LOGS_FILE, 'utf-8'));
    } catch (e) {}
  }
  logs.push(log);
  fs.writeFileSync(TRANSFER_LOGS_FILE, JSON.stringify(logs.slice(-1000), null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.get("/api/explorer/local", async (req, res) => {
    const { path: relPath } = req.query;
    try {
      const items = await explorerManager.list('local', { path: relPath as string });
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/system/drives", async (req, res) => {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get name');
        const drives = stdout.split('\r\n')
          .filter(line => /[A-Z]:/.test(line))
          .map(line => line.trim());
        res.json(drives.map(d => ({ name: d, path: d + '/', type: 'drive' })));
      } else {
        const volumes = ['/', '/Volumes', '/mnt', '/media', '/storage'].filter(p => fs.existsSync(p));
        const items = volumes.map(v => ({ name: path.basename(v) || 'Root', path: v, type: 'drive' }));
        res.json(items);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/explorer/local", (req, res) => {
    const { path: relPath } = req.query;
    const targetPath = relPath ? (path.isAbsolute(relPath as string) ? relPath as string : path.join(process.cwd(), relPath as string)) : null;
    if (!targetPath) return res.status(400).json({ error: "Path is required" });

    try {
      if (!fs.existsSync(targetPath)) return res.status(404).json({ error: "File not found" });

      const fileName = path.basename(targetPath);
      const trashPath = path.join(TRASH_DIR, `${Date.now()}_${fileName}`);
      
      fs.renameSync(targetPath, trashPath);
      res.json({ success: true, trashed: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/explorer/transfer", async (req, res) => {
    const { source, dest, action, items, verifyHash } = req.body;
    
    try {
      for (const item of items) {
        const sourcePath = item.path;
        const fileName = item.name;
        const destPath = path.join(dest.path, fileName);

        const sourceUrl = normalizeUrl(source.url, source.source);
        const destUrl = normalizeUrl(dest.url, dest.source);

        try {
          if (source.type === 'local' && dest.type === 'local') {
            if (action === 'move') {
              fs.renameSync(sourcePath, destPath);
            } else {
              if (fs.statSync(sourcePath).isDirectory()) {
                fs.cpSync(sourcePath, destPath, { recursive: true });
              } else {
                fs.copyFileSync(sourcePath, destPath);
              }
            }
          } else {
            const sourcePluginId = source.type === 'local' ? 'local' : source.source;
            const destPluginId = dest.type === 'local' ? 'local' : dest.source;
            
            const data = await explorerManager.download(sourcePluginId, sourcePath, { 
              url: sourceUrl, 
              username: source.username, 
              password: source.password, 
              port: source.port 
            });
            
            await explorerManager.upload(destPluginId, destPath, data, { 
              url: destUrl, 
              username: dest.username, 
              password: dest.password, 
              port: dest.port 
            });

            if (verifyHash) {
              const sourceHash = await explorerManager.getHash(sourcePluginId, sourcePath, 'sha256', { url: sourceUrl, username: source.username, password: source.password, port: source.port });
              const destHash = await explorerManager.getHash(destPluginId, destPath, 'sha256', { url: destUrl, username: dest.username, password: dest.password, port: dest.port });
              if (sourceHash !== destHash) {
                throw new Error(`Hash mismatch for ${fileName}`);
              }
            }

            if (action === 'move') {
              if (source.type === 'local') {
                fs.unlinkSync(sourcePath);
              } else {
                await explorerManager.action(source.source, 'delete', { 
                  url: sourceUrl, 
                  path: sourcePath, 
                  username: source.username, 
                  password: source.password, 
                  port: source.port 
                });
              }
            }
          }
          logTransfer(sourceUrl || 'local', destUrl || 'local', fileName, 'success');
        } catch (err: any) {
          logTransfer(sourceUrl || 'local', destUrl || 'local', fileName, 'error', err.message);
          throw err;
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Transfer error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/explorer/local/rename", async (req, res) => {
    const { oldPath, newPath } = req.body;
    try {
      await explorerManager.action('local', 'rename', { oldPath, newPath });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/explorer/local/create-folder", async (req, res) => {
    const { path: folderPath, name } = req.body;
    try {
      await explorerManager.action('local', 'create-folder', { path: folderPath, newName: name });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/proxy-explorer", async (req, res) => {
    const { source, url, username, password, port, repoId, overrideUrl, path: itemPath } = req.body;
    const isCloud = ['google_drive', 'onedrive', 'dropbox'].includes(source);
    let targetUrl = overrideUrl || url;
    
    if (!targetUrl && !isCloud) return res.status(400).json({ error: "URL is required" });

    // Handle relative paths for non-HTTP sources by appending to URL
    if (itemPath && source !== 'http' && targetUrl && !targetUrl.endsWith(itemPath)) {
      const separator = targetUrl.endsWith('/') ? '' : '/';
      targetUrl = targetUrl + separator + itemPath.replace(/^\//, '');
    }

    // Ensure protocol for standard sources
    if (targetUrl && !targetUrl.includes('://') && !isCloud) {
      if (source === 'ftp') targetUrl = `ftp://${targetUrl}`;
      else if (source === 'smb') targetUrl = `smb://${targetUrl}`;
      else if (source === 'webdav' || source === 'http') targetUrl = `http://${targetUrl}`;
      else if (source === 'nfs') targetUrl = `nfs://${targetUrl}`;
    }

    try {
      if (targetUrl && !isCloud) new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: `Invalid URL: ${targetUrl}` });
    }

    // Save credentials to protocol-specific dir if repoId is provided
    if (repoId) {
      const protocolDir = source === 'ftp' ? FTP_USER_DIR : 
                          source === 'smb' ? SMB_USER_DIR : 
                          source === 'webdav' ? WEBDAV_USER_DIR : 
                          source === 'nfs' ? NFS_USER_DIR : null;
      
      if (protocolDir) {
        const credFile = path.join(protocolDir, `${repoId}.json`);
        const creds = { username, password, port, url: targetUrl };
        fs.writeFileSync(credFile, encrypt(JSON.stringify(creds, null, 2)));
      }
    }

    try {
      const items = await explorerManager.list(source, { url: targetUrl, username, password, port });
      res.json(items);
    } catch (error: any) {
      console.error(`Explorer proxy error:`, error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/proxy-explorer-action", async (req, res) => {
    const { source, action, url, path: itemPath, newName, username, password, port } = req.body;
    let targetUrl = url;
    if (targetUrl && !targetUrl.includes('://')) {
      if (source === 'ftp') targetUrl = `ftp://${targetUrl}`;
      else if (source === 'webdav' || source === 'http') targetUrl = `http://${targetUrl}`;
      else if (source === 'smb') targetUrl = `smb://${targetUrl}`;
    }

    if (!targetUrl) return res.status(400).json({ error: "URL is required" });

    try {
      new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: `Invalid URL: ${targetUrl}` });
    }
    
    try {
      const result = await explorerManager.action(source, action, { url: targetUrl, path: itemPath, newName, username, password, port });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/explorer/preview", async (req, res) => {
    const { source, url, path: itemPath, username, password, port } = req.query;
    try {
      const data = await explorerManager.download(source as string, itemPath as string, { 
        url: normalizeUrl(url as string, source as string), 
        username, password, port 
      });
      
      if (data.pipe) {
        data.pipe(res);
      } else {
        res.send(data);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/explorer/save", async (req, res) => {
    const { source, url, path: itemPath, content, username, password, port } = req.body;
    try {
      await explorerManager.upload(source, itemPath, content, { 
        url: normalizeUrl(url, source), 
        username, password, port 
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/explorer/chmod", async (req, res) => {
    const { source, url, path: itemPath, mode, username, password, port } = req.body;
    try {
      await explorerManager.chmod(source, itemPath, mode, { 
        url: normalizeUrl(url, source), 
        username, password, port 
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/explorer/hash", async (req, res) => {
    const { source, url, path: itemPath, type, username, password, port } = req.query;
    try {
      const hash = await explorerManager.getHash(source as string, itemPath as string, type as 'md5' | 'sha256', { 
        url: normalizeUrl(url as string, source as string), 
        username, password, port 
      });
      res.json({ hash });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/explorer/size", async (req, res) => {
    const { source, url, path: itemPath, username, password, port } = req.query;
    try {
      const size = await explorerManager.getSize(source as string, itemPath as string, { 
        url: normalizeUrl(url as string, source as string), 
        username, password, port 
      });
      res.json({ size });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transfer-logs", (req, res) => {
    try {
      if (fs.existsSync(TRANSFER_LOGS_FILE)) {
        res.json(JSON.parse(fs.readFileSync(TRANSFER_LOGS_FILE, 'utf-8')));
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to load logs" });
    }
  });

  app.get("/api/export-bundle", async (req, res) => {
    try {
      const archiver = (await import('archiver')).default;
      const archive = archiver('zip', { zlib: { level: 9 } });
      res.attachment('repopulse_config.bundle');
      archive.pipe(res);
      archive.directory(USER_DATA_DIR, false);
      await archive.finalize();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/proxy-releases", async (req, res) => {
    try {
      const { url, token } = req.query;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }

      console.log(`[Proxy] Fetching: ${url}`);
      const data = await dashboardManager.fetchReleases(url, { token });
      res.json(data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      
      if (status !== 404) {
        console.error(`Proxy error [${status}] for ${req.query.url}:`, message);
      }
      
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/notify", express.json(), async (req, res) => {
    try {
      const { event, data } = req.body;
      if (!fs.existsSync(SETTINGS_FILE)) {
        return res.status(404).json({ error: "Settings not found" });
      }
      const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      if (settings.webhooks) {
        await notifyWebhooks(settings.webhooks, event, data);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Static route for icons
  app.use("/api/icons", express.static(ICONS_DIR));
  app.use("/api/favicon", express.static(FAVICON_DIR));
  app.use("/api/sidebar", express.static(SIDEBAR_ICONS_DIR));

  // API Routes
  app.get("/api/data", (req, res) => {
    try {
      const settings = fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) : null;
      const repositories = fs.existsSync(REPOS_FILE) ? JSON.parse(fs.readFileSync(REPOS_FILE, "utf-8")) : [];
      const categories = fs.existsSync(CATEGORIES_FILE) ? JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8")) : null;
      const savedConnections = fs.existsSync(SAVED_CONNECTIONS_FILE) ? JSON.parse(fs.readFileSync(SAVED_CONNECTIONS_FILE, "utf-8")) : [];

      res.json({ settings, repositories, categories, savedConnections });
    } catch (error) {
      res.status(500).json({ error: "Failed to load data" });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.post("/api/repositories", (req, res) => {
    try {
      fs.writeFileSync(REPOS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save repositories" });
    }
  });

  app.post("/api/categories", (req, res) => {
    try {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save categories" });
    }
  });

  app.post("/api/saved-connections", (req, res) => {
    try {
      fs.writeFileSync(SAVED_CONNECTIONS_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save connections" });
    }
  });

  app.post("/api/upload-icon", (req, res) => {
    try {
      const { name, data, type } = req.body;
      const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      
      let targetDir = ICONS_DIR;
      let urlPrefix = "/api/icons";
      
      if (type === 'service') {
        targetDir = SERVICE_ICONS_DIR;
        urlPrefix = "/api/icons/services";
      } else if (type === 'favicon') {
        targetDir = FAVICON_DIR;
        urlPrefix = "/api/favicon";
      } else if (type === 'sidebar') {
        targetDir = SIDEBAR_ICONS_DIR;
        urlPrefix = "/api/sidebar";
      }
      
      const filePath = path.join(targetDir, name);
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, url: `${urlPrefix}/${name}` });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload icon" });
    }
  });

  app.post("/api/backup-version", (req, res) => {
    try {
      const { repoName, version } = req.body;
      const repoBackupDir = path.join(BACKUP_DIR, repoName.replace(/[^a-z0-9]/gi, '_'));
      const versionDir = path.join(repoBackupDir, version.replace(/[^a-z0-9]/gi, '_'));
      
      if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
      }
      
      res.json({ success: true, path: versionDir });
    } catch (error) {
      res.status(500).json({ error: "Failed to create backup directory" });
    }
  });

  app.post("/api/download-backup", async (req, res) => {
    try {
      const { url, repoName, version, fileName } = req.body;
      const repoBackupDir = path.join(BACKUP_DIR, repoName.replace(/[^a-z0-9]/gi, '_'));
      const versionDir = path.join(repoBackupDir, version.replace(/[^a-z0-9]/gi, '_'));
      
      if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
      }

      const filePath = path.join(versionDir, fileName.replace(/[^a-z0-9.]/gi, '_'));
      
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on('finish', () => res.json({ success: true, path: filePath }));
      writer.on('error', (err) => res.status(500).json({ error: err.message }));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
