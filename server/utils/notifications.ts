/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';
import { WebhookConfig } from '../../src/types';

export async function notifyWebhooks(webhooks: WebhookConfig[], event: string, data: any) {
  const activeWebhooks = webhooks.filter(w => w.enabled && w.events.includes(event as any));
  
  for (const webhook of activeWebhooks) {
    try {
      let payload: any = {};
      
      if (webhook.type === 'discord') {
        payload = {
          embeds: [{
            title: data.title || 'RepoPulse Notification',
            description: data.message,
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
            fields: data.fields || []
          }]
        };
      } else if (webhook.type === 'slack') {
        payload = {
          text: `*${data.title || 'RepoPulse Notification'}*\n${data.message}`
        };
      } else {
        payload = {
          event,
          ...data
        };
      }

      await axios.post(webhook.url, payload);
    } catch (err) {
      console.error(`Failed to send webhook notification to ${webhook.name}:`, err);
    }
  }
}
