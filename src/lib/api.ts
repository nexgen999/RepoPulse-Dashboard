/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Release, Repository, RepoSource } from '../types';

interface SourcePlugin {
  id: RepoSource;
  fetchReleases: (repo: Repository, options: { githubToken?: string, overrideUrl?: string }) => Promise<Release[]>;
}

// Helper to extract version from string
const extractVersion = (str: string): string | undefined => {
  const match = str.match(/v?(\d+\.\d+(\.\d+)?(-[a-z0-9.]+)?)/i);
  return match ? match[1] : undefined;
};

const GitHubPlugin: SourcePlugin = {
  id: 'github',
  fetchReleases: async (repo, { githubToken }) => {
    try {
      const url = repo.url.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/releases$/, '');
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) return [];
      const [, owner, name] = match;
      
      const apiUrl = `https://api.github.com/repos/${owner}/${name}/releases`;
      const proxyUrl = `/api/proxy-releases?url=${encodeURIComponent(apiUrl)}${githubToken ? `&token=${githubToken}` : ''}`;
      
      const response = await fetch(proxyUrl);
      if (response.status === 404) {
        console.warn(`No releases found for ${repo.name} (404) - Check if the repository URL is correct.`);
        return [];
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} ${errorData.error || errorData.message || ''}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('GitHub API returned non-array data:', data);
        return [];
      }
      
      return data.map((rel: any) => ({
        repoId: repo.id,
        repoName: repo.name,
        tagName: rel.tag_name,
        name: rel.name || rel.tag_name,
        publishedAt: rel.published_at,
        body: rel.body,
        htmlUrl: rel.html_url,
        zipUrl: rel.zipball_url,
        binaryUrl: rel.assets?.[0]?.browser_download_url,
        assets: (rel.assets || []).map((asset: any) => ({
          name: asset.name,
          url: asset.browser_download_url,
          size: asset.size
        })),
        source: 'github',
        version: extractVersion(rel.tag_name) || extractVersion(rel.name),
        isLatest: !rel.prerelease && !rel.draft
      }));
    } catch (e: any) {
      console.error(`GitHub fetch error for ${repo.name}:`, e.message);
      throw e;
    }
  }
};

const GitLabPlugin: SourcePlugin = {
  id: 'gitlab',
  fetchReleases: async (repo) => {
    try {
      const url = repo.url.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/releases$/, '');
      const match = url.match(/gitlab\.com\/([^/]+)\/([^/]+)/);
      if (!match) return [];
      const [, owner, name] = match;
      const encodedPath = encodeURIComponent(`${owner}/${name}`);
      
      const apiUrl = `https://gitlab.com/api/v4/projects/${encodedPath}/releases`;
      const response = await fetch(`/api/proxy-releases?url=${encodeURIComponent(apiUrl)}`);
      if (response.status === 404) {
        console.warn(`No releases found for ${repo.name} (404)`);
        return [];
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitLab API error: ${response.status} ${errorData.error || errorData.message || ''}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];
      
      return data.map((rel: any) => ({
        repoId: repo.id,
        repoName: repo.name,
        tagName: rel.tag_name,
        name: rel.name || rel.tag_name,
        publishedAt: rel.released_at,
        body: rel.description,
        htmlUrl: rel._links?.self || repo.url,
        zipUrl: rel.assets?.sources?.find((s: any) => s.format === 'zip')?.url,
        binaryUrl: rel.assets?.links?.[0]?.url,
        assets: (rel.assets?.links || []).map((link: any) => ({
          name: link.name,
          url: link.url,
          size: 0
        })),
        source: 'gitlab'
      }));
    } catch (e: any) {
      console.error(`GitLab fetch error for ${repo.name}:`, e.message);
      throw e;
    }
  }
};

const BitbucketPlugin: SourcePlugin = {
  id: 'bitbucket',
  fetchReleases: async (repo) => {
    try {
      const url = repo.url.replace(/\/+$/, '').replace(/\.git$/, '');
      const match = url.match(/bitbucket\.org\/([^/]+)\/([^/]+)/);
      if (!match) return [];
      const [, owner, name] = match;
      
      const apiUrl = `https://api.bitbucket.org/2.0/repositories/${owner}/${name}/refs/tags`;
      const response = await fetch(`/api/proxy-releases?url=${encodeURIComponent(apiUrl)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Bitbucket API error: ${response.status} ${errorData.error || errorData.message || ''}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];
      
      return data.map((rel: any) => ({
        repoId: repo.id,
        repoName: repo.name,
        tagName: rel.tag_name || rel.name,
        name: rel.name || rel.tag_name,
        publishedAt: rel.published_at || new Date().toISOString(),
        body: rel.body || '',
        htmlUrl: rel.html_url || repo.url,
        assets: [],
        source: 'bitbucket' as const,
        version: extractVersion(rel.tag_name || rel.name),
        zipUrl: ''
      }));
    } catch (e: any) {
      console.error(`Bitbucket fetch error for ${repo.name}:`, e.message);
      throw e;
    }
  }
};

// Stubs for other plugins
const GiteaPlugin: SourcePlugin = {
  id: 'gitea',
  fetchReleases: async (repo) => {
    try {
      let cleanUrl = repo.url.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/releases$/, '');
      if (!cleanUrl.includes('://')) cleanUrl = `http://${cleanUrl}`;
      const url = new URL(cleanUrl);
      const baseUrl = `${url.protocol}//${url.host}`;
      
      // Improved path parsing for Gitea/Forgejo in subdirectories/orgs
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return [];
      
      // The last two parts are usually owner and name
      const name = pathParts[pathParts.length - 1];
      const owner = pathParts[pathParts.length - 2];
      
      const apiUrl = `${baseUrl}/api/v1/repos/${owner}/${name}/releases`;
      const response = await fetch(`/api/proxy-releases?url=${encodeURIComponent(apiUrl)}`);
      
      // If releases 404, try tags as a fallback
      if (response.status === 404) {
        const tagsUrl = `${baseUrl}/api/v1/repos/${owner}/${name}/tags`;
        const tagsResponse = await fetch(`/api/proxy-releases?url=${encodeURIComponent(tagsUrl)}`);
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          if (Array.isArray(tagsData)) {
            return tagsData.map((tag: any) => ({
              repoId: repo.id,
              repoName: repo.name,
              tagName: tag.name,
              name: tag.name,
              publishedAt: new Date().toISOString(),
              body: 'Tag release (no release notes)',
              htmlUrl: `${repo.url}/src/tag/${tag.name}`,
              zipUrl: tag.zipball_url || tag.tarball_url,
              assets: [],
              source: 'gitea'
            }));
          }
        }
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gitea API error: ${response.status} ${errorData.error || errorData.message || ''}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];
      
      return data.map((rel: any) => ({
        repoId: repo.id,
        repoName: repo.name,
        tagName: rel.tag_name,
        name: rel.name || rel.tag_name,
        publishedAt: rel.published_at,
        body: rel.body,
        htmlUrl: rel.html_url,
        zipUrl: rel.zipball_url,
        assets: (rel.assets || []).map((asset: any) => ({
          name: asset.name,
          url: asset.browser_download_url,
          size: asset.size
        })),
        source: 'gitea'
      }));
    } catch (e: any) {
      console.error(`Gitea fetch error for ${repo.name}:`, e.message);
      throw e;
    }
  }
};

const ForgejoPlugin: SourcePlugin = {
  id: 'forgejo',
  fetchReleases: async (repo) => {
    try {
      let cleanUrl = repo.url.replace(/\/+$/, '').replace(/\.git$/, '').replace(/\/releases$/, '');
      if (!cleanUrl.includes('://')) cleanUrl = `http://${cleanUrl}`;
      const url = new URL(cleanUrl);
      const baseUrl = `${url.protocol}//${url.host}`;
      
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) return [];
      
      const name = pathParts[pathParts.length - 1];
      const owner = pathParts[pathParts.length - 2];
      
      const apiUrl = `${baseUrl}/api/v1/repos/${owner}/${name}/releases`;
      const response = await fetch(`/api/proxy-releases?url=${encodeURIComponent(apiUrl)}`);
      
      // If releases 404, try tags as a fallback
      if (response.status === 404) {
        const tagsUrl = `${baseUrl}/api/v1/repos/${owner}/${name}/tags`;
        const tagsResponse = await fetch(`/api/proxy-releases?url=${encodeURIComponent(tagsUrl)}`);
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          if (Array.isArray(tagsData)) {
            return tagsData.map((tag: any) => ({
              repoId: repo.id,
              repoName: repo.name,
              tagName: tag.name,
              name: tag.name,
              publishedAt: tag.id ? new Date().toISOString() : new Date().toISOString(), 
              body: 'Tag release (no release notes)',
              htmlUrl: `${repo.url}/src/tag/${tag.name}`,
              zipUrl: tag.zipball_url || tag.tarball_url,
              assets: [],
              source: 'forgejo'
            }));
          }
        }
        return [];
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Forgejo API error: ${response.status} ${errorData.error || errorData.message || ''}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];
      
      return data.map((rel: any) => ({
        repoId: repo.id,
        repoName: repo.name,
        tagName: rel.tag_name,
        name: rel.name || rel.tag_name,
        publishedAt: rel.created_at || rel.published_at,
        body: rel.body,
        htmlUrl: rel.html_url,
        zipUrl: rel.zipball_url,
        assets: (rel.assets || []).map((asset: any) => ({
          name: asset.name,
          url: asset.browser_download_url,
          size: asset.size
        })),
        source: 'forgejo'
      }));
    } catch (e: any) {
      console.error(`Forgejo fetch error for ${repo.name}:`, e.message);
      throw e;
    }
  }
};

const HttpPlugin: SourcePlugin = {
  id: 'http',
  fetchReleases: async (repo, { overrideUrl }) => {
    try {
      const targetUrl = overrideUrl || repo.url;
      const baseUrl = targetUrl.replace(/\/+$/, '');
      
      // If it's a direct link to a file (zip, exe, etc)
      const isDirectFile = /\.(zip|exe|msi|7z|rar|tar\.gz|dmg|apk)$/i.test(targetUrl);
      
      if (isDirectFile) {
        const fileName = targetUrl.split('/').pop() || 'Download';
        return [{
          repoId: repo.id,
          repoName: repo.name,
          tagName: 'latest',
          name: fileName,
          publishedAt: new Date().toISOString(),
          body: `Direct download link: ${targetUrl}`,
          htmlUrl: targetUrl,
          zipUrl: targetUrl,
          assets: [{
            name: fileName,
            url: targetUrl,
            size: 0
          }],
          source: 'http',
          version: extractVersion(fileName),
          isLatest: true
        }];
      }

      // Try to fetch a releases.json in the directory
      const releasesJsonUrl = `${baseUrl}/releases.json`;
      const jsonResponse = await fetch(`/api/proxy-releases?url=${encodeURIComponent(releasesJsonUrl)}`);
      
      if (jsonResponse.ok) {
        const data = await jsonResponse.json();
        if (Array.isArray(data)) {
          return data.map((rel: any) => ({
            ...rel,
            repoId: repo.id,
            repoName: repo.name,
            source: 'http',
            version: rel.version || extractVersion(rel.tagName) || extractVersion(rel.name),
            isLatest: rel.isLatest || rel.name.toLowerCase().includes('latest')
          }));
        }
      }

      // If no releases.json, try to fetch the directory and parse HTML
      const dirResponse = await fetch(`/api/proxy-releases?url=${encodeURIComponent(targetUrl)}`);
      if (dirResponse.ok) {
        const data = await dirResponse.json();
        // If the proxy returns { html: ... } (which it shouldn't for generic, but just in case)
        const text = typeof data === 'string' ? data : (data.html || JSON.stringify(data));
        
        const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gis;
        const links = [...text.matchAll(linkRegex)];
        const releases: Release[] = [];
        
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

        for (let i = 0; i < links.length; i++) {
          const match = links[i];
          const href = match[1];
          const linkText = match[2];
          const fileName = decodeURIComponent(href.replace(/\/$/, '').split('/').pop() || href);
          
          if (href.startsWith('..') || href.startsWith('?') || href.startsWith('#')) continue;
          if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
          if (IGNORED_DOMAINS.some(domain => href.includes(domain))) continue;
          if (IGNORED_PATHS.some(p => fileName.toLowerCase() === p || href.toLowerCase().includes(`/${p}/`))) continue;
          if (fileName.startsWith('.') && fileName !== '.' && fileName !== '..') continue;
          
          const startPos = match.index! + match[0].length;
          const endPos = i < links.length - 1 ? links[i+1].index : text.length;
          const afterText = text.slice(startPos, endPos);
          
          const isDir = href.endsWith('/');
          
          let fileUrl;
          try {
            fileUrl = new URL(href, targetUrl).href;
          } catch (e) {
            continue;
          }
          
          const datePattern = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})|(\d{2}-[a-z]{3}-\d{4}\s+\d{2}:\d{2})|([a-z]{3}\s+\d{1,2}\s+\d{4})|(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/i;
          const dateMatch = afterText.match(datePattern) || linkText.match(datePattern);
          const publishedAt = dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString();
          
          const sizeMatch = afterText.match(/(\d+(\.\d+)?\s*[KMG]?B?)/i);
          const sizeStr = sizeMatch ? sizeMatch[1] : (isDir ? 'DIR' : 'Unknown');

          const nameLower = fileName.toLowerCase();
          const isLatest = nameLower.includes('latest');

          releases.push({
            repoId: repo.id,
            repoName: repo.name,
            tagName: isDir ? `dir-${fileName}` : fileName,
            name: fileName + (isDir ? '/' : ''),
            publishedAt,
            body: isDir ? `Directory. Click to explore.` : `File discovered in directory listing. Size: ${sizeStr}`,
            htmlUrl: fileUrl,
            zipUrl: isDir ? '' : fileUrl,
            assets: isDir ? [] : [{
              name: fileName,
              url: fileUrl,
              size: 0
            }],
            source: 'http',
            isDir,
            version: extractVersion(fileName),
            isLatest
          });
        }

        if (releases.length > 0) {
          return releases.sort((a, b) => {
            // Prioritize "latest"
            if (a.isLatest && !b.isLatest) return -1;
            if (!a.isLatest && b.isLatest) return 1;
            
            // Directories first
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;

            // Then by name (case-insensitive, numeric)
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          });
        }
      }

      return [{
        repoId: repo.id,
        repoName: repo.name,
        tagName: 'latest',
        name: 'Direct Link',
        publishedAt: new Date().toISOString(),
        body: `Direct link to repository/directory: ${targetUrl}`,
        htmlUrl: targetUrl,
        zipUrl: targetUrl,
        assets: [],
        source: 'http',
        isLatest: true
      }];
    } catch (e: any) {
      console.error(`HTTP fetch error for ${repo.name}:`, e.message);
      return [];
    }
  }
};

const ExplorerPlugin: SourcePlugin = {
  id: 'ftp', // Generic for all explorer-like sources
  fetchReleases: async (repo, { overrideUrl }) => {
    try {
      const response = await fetch('/api/proxy-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: repo.source,
          url: overrideUrl || repo.url,
          username: repo.username,
          password: repo.password,
          port: repo.port,
          repoId: repo.id
        })
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Explorer proxy error');
      }
      const data = await response.json();
      
      return data.map((item: any) => ({
        repoId: repo.id,
        repoName: repo.name,
        tagName: item.type === 'directory' ? `dir-${item.name}` : item.name,
        name: item.name + (item.type === 'directory' ? '/' : ''),
        publishedAt: item.modified || new Date().toISOString(),
        body: item.type === 'directory' ? 'Directory' : `File. Size: ${item.size}`,
        htmlUrl: item.url || (overrideUrl || repo.url).replace(/\/$/, '') + '/' + item.name,
        zipUrl: item.type === 'directory' ? '' : (item.url || (overrideUrl || repo.url).replace(/\/$/, '') + '/' + item.name),
        assets: [],
        source: repo.source,
        isDir: item.type === 'directory',
        type: item.type,
        version: extractVersion(item.name),
        isLatest: item.name.toLowerCase().includes('latest')
      }));
    } catch (e: any) {
      console.error(`${repo.source} fetch error for ${repo.name}:`, e.message);
      return [];
    }
  }
};

const AndroidFdroidPlugin: SourcePlugin = {
  id: 'android_fdroid',
  fetchReleases: async (repo) => {
    try {
      const response = await fetch(`/api/proxy-releases?url=${encodeURIComponent(repo.url)}`);
      if (!response.ok) throw new Error('F-Droid fetch failed');
      const data = await response.json();
      
      const releases: Release[] = [];
      
      // Handle HTML scraping for app pages
      if (data.type === 'html' || (typeof data === 'string' && data.includes('package-header'))) {
        const html = data.type === 'html' ? data.data : data;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const packageName = data.url?.match(/packages\/([^/]+)/)?.[1] || doc.querySelector('.package-header')?.textContent?.trim() || repo.name;
        const versionBlocks = doc.querySelectorAll('.package-version');
        
        versionBlocks.forEach(block => {
          const versionTitle = block.querySelector('.package-version-header b')?.textContent?.trim() || "";
          const versionName = versionTitle.replace(/^Version\s+/i, '');
          const downloadLink = block.querySelector('.package-version-download a')?.getAttribute('href');
          const date = block.querySelector('.package-version-header')?.textContent?.match(/\(\d{4}-\d{2}-\d{2}\)/)?.[0]?.replace(/[()]/g, '') || new Date().toISOString();
          
          if (!versionName || !downloadLink) return;

          releases.push({
            repoId: repo.id,
            repoName: repo.name,
            tagName: versionName,
            name: `${packageName} ${versionName}`,
            publishedAt: new Date(date).toISOString(),
            body: block.querySelector('.package-version-source')?.textContent?.trim() || 'F-Droid Release',
            htmlUrl: data.url || repo.url,
            zipUrl: downloadLink,
            assets: [{
              name: downloadLink.split('/').pop() || 'apk',
              url: downloadLink,
              size: 0
            }],
            source: 'android_fdroid',
            version: versionName,
            isLatest: false
          });
        });
        
        return releases;
      }
      
      const apiUrl = repo.url.endsWith('.json') ? repo.url : repo.url.replace(/\/$/, '') + '/index-v1.json';
      const baseUrl = apiUrl.replace(/index-v\d\.json$/, '');
      
      if (data.apps && data.packages) {
        data.apps.slice(0, 50).forEach((app: any) => {
          const pkgs = data.packages[app.packageName] || [];
          pkgs.forEach((pkg: any) => {
            releases.push({
              repoId: repo.id,
              repoName: repo.name,
              tagName: pkg.versionName,
              name: `${app.name || app.packageName} ${pkg.versionName}`,
              publishedAt: new Date(pkg.addedDate || Date.now()).toISOString(),
              body: app.summary || app.description || '',
              htmlUrl: `https://f-droid.org/en/packages/${app.packageName}/`,
              zipUrl: `${baseUrl}${pkg.apkName}`,
              assets: [{
                name: pkg.apkName,
                url: `${baseUrl}${pkg.apkName}`,
                size: pkg.size
              }],
              source: 'android_fdroid',
              version: pkg.versionName,
              isLatest: pkg.versionCode === app.suggestedVersionCode
            });
          });
        });
        return releases;
      }
      return [];
    } catch (e: any) {
      console.error(`F-Droid fetch error for ${repo.name}:`, e.message);
      return [];
    }
  }
};

const CodebergPlugin: SourcePlugin = {
  id: 'codeberg',
  fetchReleases: (repo, options) => ForgejoPlugin.fetchReleases({ ...repo, source: 'forgejo' }, options)
};

const GitPlugin: SourcePlugin = {
  id: 'git',
  fetchReleases: async (repo) => {
    // Basic Git releases fetching could be complex without a specific host API.
    // We'll treat it as a generic source for now, possibly falling back to HTTP scrape if url looks like one.
    if (repo.url.startsWith('http')) {
      return HttpPlugin.fetchReleases({ ...repo, source: 'http' }, {});
    }
    return [];
  }
};

const plugins: Record<RepoSource, SourcePlugin> = {
  github: GitHubPlugin,
  gitlab: GitLabPlugin,
  bitbucket: BitbucketPlugin,
  gitea: GiteaPlugin,
  forgejo: ForgejoPlugin,
  codeberg: CodebergPlugin,
  git: GitPlugin,
  http: HttpPlugin,
  ftp: ExplorerPlugin,
  sftp: ExplorerPlugin,
  smb: ExplorerPlugin,
  webdav: ExplorerPlugin,
  nfs: ExplorerPlugin,
  android_fdroid: AndroidFdroidPlugin,
};

export const fetchReleases = async (repo: Repository, githubToken?: string, overrideUrl?: string): Promise<Release[]> => {
  try {
    const plugin = plugins[repo.source];
    if (!plugin) return [];
    
    let releases = await plugin.fetchReleases(repo, { githubToken, overrideUrl });

    return releases;
  } catch (error) {
    console.error(`Error fetching releases for ${repo.name}:`, error);
    return [];
  }
};
