/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import { DashboardPlugin } from "../types";

export const GithubDashboardPlugin: DashboardPlugin = {
  id: 'github',
  fetchReleases: async (url, options) => {
    const { token } = options;
    const headers: any = {
      'User-Agent': 'RepoPulse-Dashboard/1.0',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await axios.get(url, { headers });
    return response.data;
  }
};
