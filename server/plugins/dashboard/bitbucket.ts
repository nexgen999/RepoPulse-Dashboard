/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import { DashboardPlugin } from "../types";

export const BitbucketDashboardPlugin: DashboardPlugin = {
  id: 'bitbucket',
  fetchReleases: async (url, options) => {
    const { token } = options;
    const headers: any = {
      'User-Agent': 'RepoPulse-Dashboard/1.0',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.get(url, { headers });
    // Bitbucket API for tags returns a different structure, 
    // we might need to map it to match the dashboard's expected format (GitHub-like)
    const data = response.data;
    
    if (data.values && Array.isArray(data.values)) {
      return data.values.map((tag: any) => ({
        tag_name: tag.name,
        name: tag.name,
        published_at: tag.target?.date || new Date().toISOString(),
        html_url: tag.links?.html?.href || url,
        body: tag.message || ''
      }));
    }
    
    return data;
  }
};
