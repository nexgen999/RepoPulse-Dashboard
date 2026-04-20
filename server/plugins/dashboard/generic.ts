/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from "axios";
import { DashboardPlugin } from "../types";

export const GenericDashboardPlugin: DashboardPlugin = {
  id: 'generic',
  fetchReleases: async (url, options) => {
    const { token } = options;
    const headers: any = {
      'User-Agent': 'RepoPulse-Dashboard/1.0',
      'Accept': 'application/json'
    };

    if (token) {
      if (url.includes('github.com')) {
        headers['Authorization'] = `token ${token}`;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await axios.get(url, { headers });
    return response.data;
  }
};
