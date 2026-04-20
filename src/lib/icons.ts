/**
 * File icon mapping utility inspired by material-icons-browser-extension
 */

export const FOLDER_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffca28'%3E%3Cpath d='M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'/%3E%3C/svg%3E";
export const FILE_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2390a4ae'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/%3E%3C/svg%3E";

export const getFileIconInfo = (fileName: string, isDirectory: boolean) => {
  // Trim trailing slash for directories if any
  const cleanName = fileName.replace(/\/$/, "");
  const name = cleanName.toLowerCase();
  const ext = name.split('.').pop() || '';

  const getIconUrl = (iconName: string) => `https://cdn.jsdelivr.net/gh/PKief/vscode-material-icon-theme@master/icons/${iconName}.svg`;

  if (isDirectory) {
    if (name === 'src' || name === 'source' || name === 'app') return getIconUrl('folder-src');
    if (name === 'dist' || name === 'build' || name === 'out' || name === 'target') return getIconUrl('folder-dist');
    if (name === 'node_modules') return getIconUrl('folder-node');
    if (name === 'public' || name === 'static' || name === 'www' || name === 'assets') return getIconUrl('folder-public');
    if (name === '.github') return getIconUrl('folder-github');
    if (name === 'test' || name === 'tests' || name === '__tests__' || name === 'spec' || name === 'specs') return getIconUrl('folder-test');
    if (name === 'api' || name === 'server' || name === 'backend') return getIconUrl('folder-api');
    if (name === 'config' || name === 'settings' || name === 'conf' || name === '.vscode' || name === '.idea') return getIconUrl('folder-config');
    if (name === 'docs' || name === 'documentation' || name === 'doc') return getIconUrl('folder-docs');
    if (name === 'images' || name === 'img' || name === 'icons' || name === 'pictures' || name === 'photos') return getIconUrl('folder-images');
    if (name === 'lib' || name === 'library' || name === 'libraries' || name === 'vendor') return getIconUrl('folder-lib');
    if (name === 'css' || name === 'style' || name === 'styles' || name === 'scss' || name === 'less') return getIconUrl('folder-css');
    if (name === 'js' || name === 'javascript' || name === 'scripts') return getIconUrl('folder-javascript');
    if (name === 'ts' || name === 'typescript') return getIconUrl('folder-typescript');
    if (name === 'components') return getIconUrl('folder-components');
    if (name === 'views' || name === 'pages' || name === 'screens') return getIconUrl('folder-views');
    if (name === 'utils' || name === 'helpers' || name === 'tools') return getIconUrl('folder-utils');
    if (name === 'routes' || name === 'routing') return getIconUrl('folder-route');
    if (name === 'redux' || name === 'state' || name === 'store' || name === 'context') return getIconUrl('folder-redux');
    if (name === 'db' || name === 'database' || name === 'sql' || name === 'data') return getIconUrl('folder-database');
    if (name === 'auth' || name === 'security') return getIconUrl('folder-auth');
    if (name === 'layouts') return getIconUrl('folder-layout');
    if (name === 'hooks') return getIconUrl('folder-hook');
    if (name === 'locales' || name === 'i18n' || name === 'lang' || name === 'languages') return getIconUrl('folder-i18n');
    if (name === 'android' || name === 'apk') return getIconUrl('folder-android');
    if (name === '.git' || name === 'git') return getIconUrl('folder-git');
    if (name === 'temp' || name === 'tmp' || name === 'cache') return getIconUrl('folder-temp');
    if (name.includes('nightly') || name.includes('beta') || name.includes('alpha')) return getIconUrl('folder-debug');
    if (['documents', 'docs', 'documentation'].includes(name.toLowerCase())) return getIconUrl('folder-docs');
    if (['downloads', 'downloads', 'dl'].includes(name.toLowerCase())) return getIconUrl('folder-download');
    if (['images', 'pictures', 'photos', 'img'].includes(name.toLowerCase())) return getIconUrl('folder-images');
    if (['videos', 'movies', 'video'].includes(name.toLowerCase())) return getIconUrl('folder-video');
    if (['music', 'audio', 'songs'].includes(name.toLowerCase())) return getIconUrl('folder-music');
    if (['scripts', 'tools', 'bin'].includes(name.toLowerCase())) return getIconUrl('folder-scripts');
    if (['src', 'source', 'code'].includes(name.toLowerCase())) return getIconUrl('folder-src');
    
    // Explicit return for any other directory
    return FOLDER_ICON;
  }

  // Comprehensive File extensions mapping
  const extensionMap: Record<string, string> = {
    // Languages
    'js': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript',
    'ts': 'typescript', 'mts': 'typescript', 'cts': 'typescript',
    'jsx': 'react', 'tsx': 'react_ts',
    'py': 'python', 'pyc': 'python', 'pyd': 'python', 'pyo': 'python',
    'c': 'c', 'h': 'c',
    'cpp': 'cpp', 'hpp': 'cpp', 'cc': 'cpp', 'hh': 'cpp',
    'cs': 'csharp', 'csproj': 'csharp',
    'java': 'java', 'class': 'java', 'jar': 'java',
    'go': 'go',
    'rs': 'rust', 'rlib': 'rust',
    'rb': 'ruby', 'erb': 'ruby',
    'php': 'php', 'php3': 'php4', 'php5': 'php',
    'html': 'html', 'htm': 'html', 'xhtml': 'html',
    'css': 'css', 'scss': 'sass', 'sass': 'sass', 'less': 'less', 'styl': 'stylus',
    'json': 'json', 'json5': 'json', 'jsonc': 'json',
    'yaml': 'yaml', 'yml': 'yaml',
    'xml': 'xml', 'xsd': 'xml', 'dtd': 'xml', 'xsl': 'xml',
    'sql': 'database', 'db': 'database', 'sqlite': 'database', 'sqlite3': 'database',
    'md': 'markdown', 'markdown': 'markdown', 'rst': 'markdown',
    'txt': 'document', 'ini': 'document', 'conf': 'document', 'cfg': 'document',
    'log': 'log',
    'sh': 'console', 'bash': 'console', 'zsh': 'console', 'fish': 'console', 'bat': 'console', 'cmd': 'console', 'ps1': 'console',
    'zip': 'zip', 'rar': 'zip', '7z': 'zip', 'tar': 'zip', 'gz': 'zip', 'xz': 'zip', 'bz2': 'zip',
    'pdf': 'pdf',
    'doc': 'word', 'docx': 'word', 'odt': 'word',
    'xls': 'excel', 'xlsx': 'excel', 'csv': 'excel', 'ods': 'excel',
    'ppt': 'powerpoint', 'pptx': 'powerpoint', 'odp': 'powerpoint',
    // Images
    'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'gif': 'image', 'bmp': 'image', 'ico': 'image', 
    'webp': 'image', 'tiff': 'image', 'tif': 'image', 'psd': 'photoshop', 'ai': 'illustrator', 'eps': 'illustrator',
    'svg': 'svg',
    // Audio/Video
    'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'm4a': 'audio', 'ogg': 'audio',
    'mp4': 'video', 'mov': 'video', 'wmv': 'video', 'flv': 'video', 'avi': 'video', 'mkv': 'video', 'webm': 'video',
    // Others
    'woff': 'font', 'woff2': 'font', 'ttf': 'font', 'otf': 'font', 'eot': 'font',
    'apk': 'android', 'aab': 'android', 'dex': 'android',
    'exe': 'exe', 'msi': 'exe',
    'dll': 'settings', 'so': 'settings', 'dylib': 'settings',
  };

  // Specific filenames
  if (name === 'package.json') return getIconUrl('nodejs');
  if (name === 'package-lock.json') return getIconUrl('nodejs');
  if (name === 'tsconfig.json') return getIconUrl('typescript');
  if (name === 'vite.config.ts' || name === 'vite.config.js') return getIconUrl('vite');
  if (name === '.gitignore') return getIconUrl('git');
  if (name === '.gitattributes') return getIconUrl('git');
  if (name === '.github') return getIconUrl('github');
  if (name === 'dockerfile' || name.startsWith('docker-compose')) return getIconUrl('docker');
  if (name === 'readme.md') return getIconUrl('info');
  if (name === 'license' || name === 'license.md' || name === 'license.txt') return getIconUrl('certificate');
  if (name === 'tailwind.config.ts' || name === 'tailwind.config.js') return getIconUrl('tailwind');
  if (name === 'components.json') return getIconUrl('json');
  if (name === '.eslintrc.json' || name === '.eslintrc.js' || name === '.eslintrc') return getIconUrl('eslint');
  if (name === '.prettierrc' || name === '.prettierrc.json') return getIconUrl('prettier');

  const iconName = extensionMap[ext];
  if (!iconName) return FILE_ICON;
  return getIconUrl(iconName);
};
