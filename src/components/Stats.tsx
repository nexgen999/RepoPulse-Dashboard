/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';
import { useTranslation } from '../lib/i18n';
import { AppSettings, Release, Repository } from '../types';
import { TrendingUp, Package, Calendar, PieChart as PieIcon } from 'lucide-react';

interface StatsProps {
  releases: Release[];
  repositories: Repository[];
  settings: AppSettings;
}

export function Stats({ releases, repositories, settings }: StatsProps) {
  const { t } = useTranslation(settings.language);

  // Data for releases per month
  const releasesByMonth = releases.reduce((acc: any, rel) => {
    const date = new Date(rel.publishedAt);
    const month = date.toLocaleString(settings.language, { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthData = Object.keys(releasesByMonth).map(month => ({
    name: month,
    count: releasesByMonth[month]
  }));

  // Data for releases per repository
  const releasesByRepo = repositories.map(repo => ({
    name: repo.name,
    count: releases.filter(rel => rel.repoId === repo.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 10);

  // Data for source distribution
  const sourceDist = repositories.reduce((acc: any, repo) => {
    acc[repo.source] = (acc[repo.source] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.keys(sourceDist).map(source => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: sourceDist[source]
  }));

  const COLORS = ['#0078d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Release Analytics</h1>
          <p className="text-muted-foreground">Insights into your repository updates and activity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="fluent-card p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Repos</p>
              <p className="text-2xl font-bold">{repositories.length}</p>
            </div>
          </div>
          <div className="fluent-card p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Releases</p>
              <p className="text-2xl font-bold">{releases.length}</p>
            </div>
          </div>
          <div className="fluent-card p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Latest Update</p>
              <p className="text-lg font-bold truncate">
                {releases.length > 0 ? new Date(releases[0].publishedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Over Time */}
          <div className="fluent-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Release Activity (Monthly)</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--accent)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Repositories */}
          <div className="fluent-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Top 10 Most Active Repos</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={releasesByRepo} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source Distribution */}
          <div className="fluent-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold">Source Distribution</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
