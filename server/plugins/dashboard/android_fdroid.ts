/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import { DashboardPlugin } from "../types";

export const AndroidFdroidPlugin: DashboardPlugin = {
  id: 'android_fdroid',
  fetchReleases: async (url, options) => {
    // F-Droid index URL usually ends with index-v1.json or index-v2.json
    // If user provides the app page, we might need to guess the repo URL
    let apiUrl = url;
    const isPackagePage = url.includes('/packages/') || url.includes('com.');
    
    if (isPackagePage && !url.endsWith('.json')) {
      // It's likely a package page or ID
      // Try to scrape the HTML if it's f-droid.org website
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html'
        }
      });
      
      // If website, return the HTML for the frontend to parse or we parse here
      if (typeof response.data === 'string' && response.data.includes('package-header')) {
        return { type: 'html', data: response.data, url: apiUrl };
      }
    }

    if (!url.endsWith('.json')) {
      // Try to guess if it's a repo URL
      if (!url.endsWith('/')) apiUrl += '/';
      apiUrl += 'index-v1.json';
    }

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'RepoPulse-Dashboard/1.0',
        'Accept': 'application/json'
      }
    });

    // F-Droid V1 format: { apps: [...], packages: { "pkg.name": [...] } }
    return response.data;
  }
};
