/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function normalizeUrl(u: string, s: string) {
  if (!u) return u;
  if (['google_drive', 'onedrive', 'dropbox'].includes(s)) return u;
  if (!u.includes('://')) {
    if (s === 'ftp') return `ftp://${u}`;
    if (s === 'smb') return `smb://${u}`;
    if (s === 'webdav' || s === 'http') return `http://${u}`;
    if (s === 'nfs') return `nfs://${u}`;
  }
  return u;
}
