/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Info, Book, History, User, Github, Twitter, Linkedin, 
  ExternalLink, ChevronRight, Layout, Database, Layers, 
  FolderSync, Settings, ShieldCheck, Globe, Star, Mail,
  Cpu, Zap, Code, Terminal, MessageSquare, Twitch, Youtube
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

type Section = 'about' | 'wiki' | 'changelog' | 'author';

export function ProjectCenter({ language = 'en' }: { language: string }) {
  const { t } = useTranslation(language);
  const [activeSection, setActiveSection] = useState<Section>('wiki');

  const menuItems = [
    { id: 'wiki', label: 'Wiki & documentation', icon: Book },
    { id: 'changelog', label: 'Changelog', icon: History },
    { id: 'about', label: 'About Project', icon: Info },
    { id: 'author', label: 'About Me', icon: User },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Lateral Menu */}
      <div className="w-64 border-r border-border bg-muted/20 flex flex-col p-4 gap-2 overflow-y-auto custom-scrollbar">
        <div className="mb-6 px-2">
          <h1 className="text-xl font-bold">Knowledge Center</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">RepoPulse Guide</p>
        </div>
        
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as Section)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              activeSection === item.id 
                ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-4 h-4", activeSection === item.id ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="flex-1 text-left">{item.label}</span>
            {activeSection === item.id && <ChevronRight className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8 max-w-4xl mx-auto"
          >
            {activeSection === 'wiki' && <WikiContent t={t} />}
            {activeSection === 'changelog' && <ChangelogContent t={t} />}
            {activeSection === 'about' && <AboutContent t={t} />}
            {activeSection === 'author' && <AuthorContent t={t} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WikiContent({ t }: { t: any }) {
  const wikiSections = [
    {
      id: 'architecture',
      title: 'Core Architecture',
      icon: Cpu,
      content: 'RepoPulse is built on a high-performance stack using React, TypeScript, and a unified Node.js backend. It leverages the Antigravity framework for sandboxed execution and Microsoft Fluent Design principles for the UI/UX. The backend uses a plugin-based system to handle diverse repository and protocol sources.',
      subSections: ['Client-Side Data Flow', 'Plugin System', 'Caching Strategy', 'Secure Proxy']
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: ShieldCheck,
      content: 'Security is at the heart of RepoPulse. No repository data or Personal Access Tokens are ever transmitted to third-party servers. All interactions are direct from your environment to GitHub/GitLab endpoints. Sensitive data like FTP passwords are encrypted at rest using AES-256.',
      subSections: ['Token Encryption', 'Local-Only Storage', 'Verified API Requests', 'Encrypted Transfers']
    },
    {
      id: 'explorer',
      title: 'Advanced File Explorer',
      icon: Layers,
      content: 'Manage files across Local, FTP, SFTP, SMB, WebDAV, and NFS protocols. Features include a powerful dual-pane interface, real-time transfer tracking, secure hash verification, and a professional-grade editor powered by Monaco (VS Code core) with ANSI/UTF-8 support, syntax highlighting, and media preview controls.',
      subSections: ['Dual-Pane Mode', 'Monaco Editor', 'Media Zoom/Speed', 'Hash Verification']
    },
    {
      id: 'plugins',
      title: 'Plugin Ecosystem & Specs',
      icon: Terminal,
      content: 'RepoPulse architecture involves two main types of plugins: "Source Plugins" (Repo Manager) and "Explorer Plugins" (File Protocol). All remote interactions are routed through a secure Node.js Proxy to ensure CORS compatibility and token safety.',
      subSections: ['API Proxy v2.1', 'Node.js Drivers', 'Scraping Engines', 'REST Integrations']
    },
    {
      id: 'features',
      title: 'Ecosystem Management',
      icon: Zap,
      content: 'Detailed explanation of built-in tools like Daily Summary (AI-powered insight), Batch Versioning, and Release Tracking for multi-platform repositories including GitHub, GitLab, Forgejo, and Codeberg.',
      subSections: ['Batch Operations', 'Release Tracking', 'Storage Management', 'Custom Categorization']
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Book className="w-8 h-8 text-[var(--accent)]" />
          Wiki & Documentation
        </h2>
        <p className="text-muted-foreground text-lg">Your comprehensive guide to mastering RepoPulse.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {wikiSections.map(section => (
          <div key={section.id} className="fluent-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent)]/10 rounded-lg text-[var(--accent)]">
                <section.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">{section.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.content}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {section.subSections.map(sub => (
                <span key={sub} className="px-2 py-1 bg-muted rounded text-[10px] font-bold text-muted-foreground border border-border">
                  {sub.toUpperCase()}
                </span>
              ))}
            </div>
            
            {section.id === 'plugins' && (
              <div className="mt-6 space-y-4 border-t border-border/50 pt-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">Detailed Plugin Matrix</h4>
                <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/50">
                        <th className="px-4 py-3 font-bold">Plugin</th>
                        <th className="px-4 py-3 font-bold">Type</th>
                        <th className="px-4 py-3 font-bold">Proxy</th>
                        <th className="px-4 py-3 font-bold">Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {[
                        { name: 'GitHub v1.0', type: 'REST API', proxy: 'releases-proxy', usage: 'Repo Manager' },
                        { name: 'GitLab v1.0', type: 'REST API', proxy: 'releases-proxy', usage: 'Repo Manager' },
                        { name: 'Forgejo/Gitea', type: 'REST API', proxy: 'releases-proxy', usage: 'Repo Manager' },
                        { name: 'Codeberg', type: 'Wrapper', proxy: 'releases-proxy', usage: 'Repo Manager' },
                        { name: 'HTTP Scraper', type: 'HTML/JSON', proxy: 'releases-proxy', usage: 'Repo Manager' },
                        { name: 'FTP/SFTP v2.0', type: 'TCP/SSH', proxy: 'explorer-proxy', usage: 'Explorer + Manager' },
                        { name: 'SMB/NFS v1.5', type: 'Native', proxy: 'explorer-proxy', usage: 'Explorer' },
                        { name: 'WebDAV v1.2', type: 'HTTP-Ext', proxy: 'explorer-proxy', usage: 'Explorer' },
                        { name: 'Android F-Droid', type: 'JSON/HTML', proxy: 'releases-proxy', usage: 'Repo Manager' },
                        { name: 'Powerful Editor', type: 'Monaco/React', proxy: 'explorer-proxy', usage: 'Editor (ANSI/UTF8)' },
                        { name: 'Media Preview', type: 'HTML5/React', proxy: 'explorer-proxy', usage: 'Photos/Videos' },
                        { name: 'Local FS', type: 'Node:fs', proxy: 'None (Direct)', usage: 'Explorer' }
                      ].map(p => (
                        <tr key={p.name} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-bold">{p.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-background border border-border rounded text-[10px] font-mono">{p.proxy}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{p.usage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangelogContent({ t }: { t: any }) {
  const changes = [
    {
      version: "1.9.1",
      date: "2026-04-18",
      type: "Super Extension",
      items: [
        "Integrated 'Powerful Editor' (Monaco-Engine) with VS Code core",
        "Support for ANSI and UTF-8 encoding management in files",
        "Deep Media Preview: Zoom controls for images (10% to 500%)",
        "Video Playback Speed controls (0.5x to 2x)",
        "Extended file support: .cfg, .nfo, .ini, .xml, .css, .html in editor",
        "Updated Wiki with technical Plugin Matrix and Spec details"
      ]
    },
    {
      version: "1.9.0",
      date: "2026-04-18",
      type: "Feature Update",
      items: [
        "New Codeberg & Generic Git plugins support",
        "Local File Trash implementation (replaces permanent delete)",
        "Fixed FTP/SFTP directory navigation issues",
        "State Persistence (returns to previous view on reload)",
        "Added 'Knowledge Center' to customizable sidebar icons",
        "Added Codeberg & Git to custom service icons",
        "Improved Explorer context menu positioning"
      ]
    },
    {
      version: "1.8.0",
      date: "2026-04-17",
      type: "Major Update",
      items: [
        "Consolidated Knowledge Center (merged Wiki, About, Changelog)",
        "Improved Explorer Visibility (Auto-adjusting context menus)",
        "UI Reorganization (New settings sub-menus)",
        "Linux/Windows Path Normalization for Local Storage"
      ]
    },
    {
      version: "1.7.5",
      date: "2026-04-10",
      type: "Improvement",
      items: [
        "Added 30+ Professional Fonts Support",
        "Global Font Size customization",
        "Theme stability fixes (removed problematic themes)",
        "Standardized Explorer Header heights"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-[var(--accent)]" />
          Version History
        </h2>
        <p className="text-muted-foreground">Tracking the evolution of RepoPulse.</p>
      </div>

      <div className="space-y-6">
        {changes.map(change => (
          <div key={change.version} className="relative pl-8 border-l-2 border-border pb-8 last:pb-0">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-[var(--accent)] shadow-sm shadow-[var(--accent)]/50" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-lg font-black">{change.version}</span>
                <span className="px-2 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-bold rounded uppercase tracking-wider">{change.type}</span>
                <span className="text-xs text-muted-foreground ml-auto">{change.date}</span>
              </div>
              <ul className="space-y-2">
                {change.items.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 mt-1 shrink-0 text-[var(--accent)]" />
                   {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutContent({ t }: { t: any }) {
  return (
    <div className="space-y-12">
      <div className="space-y-6 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold uppercase tracking-widest border border-accent/20">
          <Zap className="w-3 h-3" />
          Projet Open Source Professionnel
        </div>
        <h2 className="text-4xl font-black tracking-tight leading-none">RepoPulse : L'Écosystème Ultime de Gestion de Dépôts</h2>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
          RepoPulse n'est pas qu'un simple gestionnaire ; c'est un centre de contrôle unifié conçu pour simplifier la complexité de la gestion multi-plateformes et multi-protocoles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="fluent-card p-6 space-y-4 border-l-4 border-blue-500">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
            <Globe className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold">Centralisation Totale</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Gérez vos dépôts GitHub, GitLab, Codeberg, et F-Droid au même endroit. Ne perdez plus jamais de temps à naviguer entre différents onglets.
          </p>
        </div>

        <div className="fluent-card p-6 space-y-4 border-l-4 border-emerald-500">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
            <Layout className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold">Explorateur Multi-Protocoles</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Accédez à vos serveurs FTP, SFTP, SMB, WebDAV et NFS via une interface intuitive double-panneau ultra-fluide avec éditeur Monaco intégré.
          </p>
        </div>

        <div className="fluent-card p-6 space-y-4 border-l-4 border-amber-500">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold">Confidentialité Absolue</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Toutes vos données et tokens d'accès restent stockés localement dans votre environnement. Aucune information sensible n'est transmise à l'extérieur.
          </p>
        </div>
      </div>

      <div className="fluent-card p-8 bg-muted/20 border-dashed relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Code className="w-64 h-64 -rotate-12" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-black flex items-center gap-3">
               <Database className="w-6 h-6 text-[var(--accent)]" />
               Architecture & Performance
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              RepoPulse repose sur une architecture moderne utilisant un backend Node.js robuste et un frontend React optimisé. Chaque action est traitée en asynchrone pour garantir une fluidité maximale, même lors du scan de serveurs distants massifs.
            </p>
            <div className="flex flex-wrap gap-2">
               {['TypeScript 5', 'Node 20', 'Monaco Core', 'Fluent UI'].map(tech => (
                 <span key={tech} className="px-3 py-1 bg-background border border-border rounded-lg text-[10px] font-bold text-muted-foreground">
                   {tech}
                 </span>
               ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black flex items-center gap-3">
               <Settings className="w-6 h-6 text-[var(--accent)]" />
               Customisation Sans Limites
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Thèmes dynamiques, polices professionnelles, icônes de services personnalisables et gestion des catégories... RepoPulse s'adapte à votre flux de travail, et non l'inverse.
            </p>
            <div className="flex items-center gap-4 pt-2">
               <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden shrink-0">
                       <img src={`https://picsum.photos/seed/tool${i}/100/100`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
               </div>
               <span className="text-xs font-bold text-muted-foreground">+ Utilise par des milliers de dev</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthorContent({ t }: { t: any }) {
  const socialLinks = [
    { name: 'GitHub', icon: Github, url: 'https://github.com/nexgen999', color: 'hover:bg-zinc-800' },
    { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com/@BelabedMedhy', color: 'hover:bg-red-600' },
    { name: 'Twitch', icon: Twitch, url: 'https://twitch.tv/nexgen999', color: 'hover:bg-purple-600' },
    { name: 'Twitter', icon: Twitter, url: 'https://x.com/nexgen999', color: 'hover:bg-sky-500' },
    { name: 'Email', icon: Mail, url: 'mailto:nexgen999@gmail.com', color: 'hover:bg-amber-600' },
    { name: 'Website', icon: Globe, url: 'http://scnrls.dyndns.pro', color: 'hover:bg-indigo-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-8 py-4">
        <div className="w-40 h-40 rounded-3xl overflow-hidden bg-muted border-4 border-background shadow-2xl ring-4 ring-[var(--accent)]/20 rotate-3 hover:rotate-0 transition-transform duration-500">
          <img 
            src="https://pbs.twimg.com/profile_images/2037201736910213120/p9wyelOV_400x400.jpg" 
            alt="Author" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-center md:text-left space-y-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-[var(--accent)] to-indigo-500 bg-clip-text text-transparent">Nexgen Infinity</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Full Stack Developer & Architect</p>
          </div>
          <p className="text-muted-foreground max-w-lg leading-relaxed">
            Passionné par l'architecture logicielle et l'optimisation des flux de travail. Je crée des outils robustes pour aider les développeurs à gérer leurs écosystèmes open-source avec style et efficacité.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-xl transition-all border border-border/50 font-bold text-xs",
                  link.color,
                  "hover:text-white hover:border-transparent hover:shadow-lg"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="fluent-card p-6 space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
          <h3 className="font-bold flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-[var(--accent)]" />
            Collaboration
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Je suis toujours ouvert à de nouveaux projets, audits UI/UX, ou contributions à des solutions open-source innovantes. N'hésitez pas à me contacter via mes réseaux sociaux pour toute proposition sérieuse.
          </p>
        </div>
        
        <div className="fluent-card p-6 space-y-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
          <h3 className="font-bold flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-emerald-500" />
            Visions
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ReposPulse est ma vision d'un gestionnaire de dépôts moderne : rapide, sécurisé et hautement personnalisable. Mon but est de centraliser la connaissance technique de manière élégante.
          </p>
        </div>
      </div>
    </div>
  );
}
