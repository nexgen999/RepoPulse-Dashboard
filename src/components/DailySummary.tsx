/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Package, ArrowRight } from 'lucide-react';
import { Release, AppSettings } from '../types';
import { useTranslation } from '../lib/i18n';

interface DailySummaryProps {
  releases: Release[];
  settings: AppSettings;
  onClose: () => void;
}

export function DailySummary({ releases, settings, onClose }: DailySummaryProps) {
  const { t } = useTranslation(settings.language);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysReleases = releases.filter(rel => {
    const relDate = new Date(rel.publishedAt);
    relDate.setHours(0, 0, 0, 0);
    return relDate.getTime() === today.getTime();
  });

  if (todaysReleases.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fluent-card w-full max-w-lg p-8 space-y-6 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Daily Summary</h2>
            <p className="text-muted-foreground">Here's what changed today.</p>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {todaysReleases.map(rel => (
            <div key={`${rel.repoId}-${rel.tagName}`} className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between group hover:border-[var(--accent)] transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg text-[var(--accent)]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{rel.repoName}</h4>
                  <p className="text-xs text-muted-foreground">{rel.tagName}</p>
                </div>
              </div>
              <a 
                href={rel.htmlUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 opacity-0 group-hover:opacity-100 transition-all text-[var(--accent)]"
              >
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[var(--accent)] text-white rounded-xl font-bold shadow-lg shadow-[var(--accent)]/20 hover:opacity-90 transition-all"
        >
          Got it!
        </button>
      </motion.div>
    </div>
  );
}
