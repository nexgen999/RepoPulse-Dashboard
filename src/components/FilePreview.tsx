/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, FileText, Image as ImageIcon, Film, File as FileIcon, 
  Download, Edit3, AlertCircle, Maximize2, Minimize2, 
  Play, Pause, Volume2, VolumeX, FastForward
} from 'lucide-react';
import { FileItem } from '../types';
import { AdvancedEditor } from './AdvancedEditor';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FilePreviewProps {
  item: FileItem;
  source: string;
  url: string;
  username?: string;
  password?: string;
  port?: number;
  onClose: () => void;
  onEdit?: () => void;
}

export function FilePreview({ item, source, url, username, password, port, onClose, onEdit }: FilePreviewProps) {
  const [content, setContent] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Media states
  const [imageZoom, setImageZoom] = useState(1);
  const [videoSpeed, setVideoSpeed] = useState(1);

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(item.name);
  const isVideo = /\.(mp4|webm|ogg)$/i.test(item.name);
  const isText = /\.(txt|md|json|js|ts|tsx|css|html|env|ini|conf|nfo|xml|yml|yaml|cfg)$/i.test(item.name);
  const isPdf = /\.pdf$/i.test(item.name);

  const getQuery = useCallback(() => {
    const query = new URLSearchParams({
      source,
      url: url || '',
      path: item.path || item.name
    });
    if (username) query.set('username', username);
    if (password) query.set('password', password);
    if (port) query.set('port', port.toString());
    return query;
  }, [source, url, item, username, password, port]);

  useEffect(() => {
    if (isText) {
      fetchPreview();
    } else {
      setLoading(false);
    }
  }, [item]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/explorer/preview?${getQuery().toString()}`);
      if (!res.ok) throw new Error("Failed to load preview");
      const buffer = await res.arrayBuffer();
      setContent(buffer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newContent: string, encoding: string) => {
    try {
      const res = await fetch('/api/explorer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          url,
          path: item.path || item.name,
          content: newContent,
          encoding,
          username,
          password,
          port
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }
      
      // Update local content buffer after save
      const encoder = new TextEncoder();
      setContent(encoder.encode(newContent).buffer);
    } catch (err: any) {
      console.error("Save error:", err);
      throw err;
    }
  };

  const previewUrl = `/api/explorer/preview?${getQuery().toString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              isImage ? "bg-blue-500/10 text-blue-500" :
              isVideo ? "bg-purple-500/10 text-purple-500" :
              isText ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
            )}>
              {isImage ? <ImageIcon className="w-5 h-5" /> : 
               isVideo ? <Film className="w-5 h-5" /> :
               <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold truncate max-w-xl text-slate-900 dark:text-white leading-tight">{item.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {(item.size / 1024).toFixed(2)} KB
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {item.modified ? new Date(item.modified).toLocaleString() : 'Date Unknown'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isText && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-xs font-medium">Edit Mode</span>
              </button>
            )}
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
            
            <a 
              href={previewUrl} 
              download={item.name}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950/50 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500"></div>
              <p className="text-sm font-medium text-slate-500 animate-pulse">Initializing Powerful Editor...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center flex-1 text-red-500 gap-4 bg-red-50 dark:bg-red-900/5">
              <AlertCircle className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="font-bold">Error loading resource</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
              <button onClick={fetchPreview} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold">Retry</button>
            </div>
          ) : isImage ? (
            <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center">
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                <button onClick={() => setImageZoom(z => Math.max(0.1, z - 0.2))} className="p-1.5 hover:bg-white/20 rounded-lg text-white"><Minimize2 className="w-4 h-4" /></button>
                <span className="text-[10px] font-mono text-white w-12 text-center">{Math.round(imageZoom * 100)}%</span>
                <button onClick={() => setImageZoom(z => Math.min(5, z + 0.2))} className="p-1.5 hover:bg-white/20 rounded-lg text-white"><Maximize2 className="w-4 h-4" /></button>
              </div>
              <motion.img 
                animate={{ scale: imageZoom }}
                src={previewUrl} 
                alt={item.name} 
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : isVideo ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-black p-4">
              <video 
                src={previewUrl} 
                controls 
                playbackRate={videoSpeed}
                className="max-w-full max-h-[75vh] rounded-lg shadow-2xl border border-white/5"
              />
              <div className="mt-4 flex items-center gap-2 bg-white/10 p-1.5 rounded-xl">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button 
                    key={speed}
                    onClick={() => setVideoSpeed(speed)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                      videoSpeed === speed ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
                <div className="w-px h-3 bg-white/10 mx-1" />
                <FastForward className="w-3 h-3 text-white/40" />
              </div>
            </div>
          ) : isPdf ? (
            <iframe 
              src={previewUrl} 
              className="flex-1 w-full border-0 shadow-inner"
              title={item.name}
            />
          ) : isText && content ? (
            <AdvancedEditor 
              fileName={item.name}
              initialContent={content}
              encoding="utf-8"
              onSave={handleSave}
              onClose={onClose}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 gap-6">
              <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full">
                <FileIcon className="w-20 h-20 opacity-40 text-slate-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-lg">No preview available</p>
                <p className="text-sm text-muted-foreground">The "Powerful Editor" plugin doesn't support this binary format yet.</p>
              </div>
              <a 
                href={previewUrl} 
                download={item.name}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download to Local Device
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
