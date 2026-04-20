/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { simpleGit } from "simple-git";
import { DashboardPlugin } from "../types";

export const GitDashboardPlugin: DashboardPlugin = {
  id: 'git',
  fetchReleases: async (url, options) => {
    const git = simpleGit();
    try {
      // List remote tags
      const tags = await git.listRemote(['--tags', url]);
      const tagLines = tags.split('\n').filter(line => line.trim() !== '');
      
      return tagLines.map(line => {
        const parts = line.split('\t');
        const ref = parts[1];
        const tagName = ref.replace('refs/tags/', '').replace('^{}', '');
        return {
          tag_name: tagName,
          name: tagName,
          published_at: new Date().toISOString(), // Raw git doesn't easily give date without cloning
          html_url: url,
          body: `Git tag: ${tagName}`
        };
      }).reverse(); // Usually want newest first
    } catch (error: any) {
      throw new Error(`Git error: ${error.message}`);
    }
  }
};
