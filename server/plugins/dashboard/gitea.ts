/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import { DashboardPlugin } from "../types";

export const GiteaDashboardPlugin: DashboardPlugin = {
  id: 'gitea',
  fetchReleases: async (url, options) => {
    const { token } = options;
    const headers: any = {
      'User-Agent': 'RepoPulse-Dashboard/1.0',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    // Gitea API is usually at /api/v1/
    // We assume the URL provided is the API URL or we try to derive it
    const response = await axios.get(url, { headers });
    return response.data;
  }
};
