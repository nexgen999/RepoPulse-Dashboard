/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardPlugin } from "./types";
import { GenericDashboardPlugin } from "./dashboard/generic";
import { GithubDashboardPlugin } from "./dashboard/github";
import { GitlabDashboardPlugin } from "./dashboard/gitlab";
import { GiteaDashboardPlugin } from "./dashboard/gitea";
import { ForgejoDashboardPlugin } from "./dashboard/forgejo";
import { BitbucketDashboardPlugin } from "./dashboard/bitbucket";
import { GitDashboardPlugin } from "./dashboard/git";
import { AndroidFdroidPlugin } from "./dashboard/android_fdroid";

class DashboardManager {
  private plugins: Map<string, DashboardPlugin> = new Map();

  constructor() {
    this.register(GenericDashboardPlugin);
    this.register(GithubDashboardPlugin);
    this.register(GitlabDashboardPlugin);
    this.register(GiteaDashboardPlugin);
    this.register(ForgejoDashboardPlugin);
    this.register(BitbucketDashboardPlugin);
    this.register(GitDashboardPlugin);
    this.register(AndroidFdroidPlugin);
  }

  register(plugin: DashboardPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  getPlugin(id: string): DashboardPlugin | undefined {
    return this.plugins.get(id);
  }

  async fetchReleases(url: string, options: any) {
    let pluginId = 'generic';
    if (url.includes('github.com')) pluginId = 'github';
    else if (url.includes('gitlab.com')) pluginId = 'gitlab';
    else if (url.includes('bitbucket.org')) pluginId = 'bitbucket';
    else if (url.includes('/api/v1/repos') || url.includes('gitea')) pluginId = 'gitea';
    else if (url.includes('forgejo')) pluginId = 'forgejo';
    else if (url.includes('f-droid.org')) pluginId = 'android_fdroid';
    else if (url.includes('uptodown.com')) pluginId = 'generic';
    else if (url.includes('apkpure.com')) pluginId = 'generic';
    else if (url.endsWith('.git')) pluginId = 'git';
    
    const plugin = this.getPlugin(pluginId);
    if (!plugin) throw new Error(`${pluginId} dashboard plugin not found`);
    return plugin.fetchReleases(url, options);
  }
}

export const dashboardManager = new DashboardManager();
