/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { 
  Save, RotateCcw, RotateCw, Search, Type, Globe, 
  Info, Check, ChevronDown, Monitor, Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AdvancedEditorProps {
  fileName: string;
  initialContent: ArrayBuffer;
  encoding: string;
  language?: string;
  onSave: (content: string, encoding: string) => Promise<void>;
  onClose: () => void;
}

const ENCODINGS = [
  { label: 'UTF-8', value: 'utf-8' },
  { label: 'ANSI (Windows-1252)', value: 'windows-1252' },
  { label: 'Latin-1 (ISO-8859-1)', value: 'iso-8859-1' },
  { label: 'UTF-16LE', value: 'utf-16le' },
  { label: 'ASCII', value: 'ascii' }
];

export function AdvancedEditor({ 
  fileName, 
  initialContent, 
  encoding: initialEncoding, 
  language, 
  onSave, 
  onClose 
}: AdvancedEditorProps) {
  const [content, setContent] = useState('');
  const [encoding, setEncoding] = useState(initialEncoding || 'utf-8');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [showEncodings, setShowEncodings] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    try {
      const decoder = new TextDecoder(encoding);
      const decoded = decoder.decode(initialContent);
      setContent(decoded);
    } catch (err) {
      console.error("Failed to decode with", encoding, err);
      // Fallback to utf-8 if decoding fails
      const decoder = new TextDecoder('utf-8');
      setContent(decoder.decode(initialContent));
    }
  }, [initialContent, encoding]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    editor.onDidChangeModelContent(() => {
      setHasChanges(true);
    });

    // Custom formatting or other Notepad++ like additions can go here
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleSave = async () => {
    if (editorRef.current) {
      setIsSaving(true);
      try {
        const value = editorRef.current.getValue();
        await onSave(value, encoding);
        setHasChanges(false);
      } catch (err) {
        alert("Failed to save: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getModelLanguage = () => {
    if (language) return language;
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'xml': return 'xml';
      case 'md': return 'markdown';
      case 'yml': case 'yaml': return 'yaml';
      case 'sql': return 'sql';
      case 'py': return 'python';
      case 'ini': case 'cfg': case 'conf': case 'nfo': return 'ini';
      default: return 'plaintext';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden rounded-b-xl">
      {/* Mini Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-1">
          <button 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(
              "p-1.5 rounded transition-colors flex items-center gap-2 text-sm px-3 font-medium",
              hasChanges 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-slate-400 cursor-not-allowed"
            )}
          >
            <Save className={cn("w-4 h-4", isSaving && "animate-pulse")} />
            {isSaving ? "Saving..." : "Save"}
          </button>
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
          
          <button 
            onClick={() => editorRef.current?.trigger('source', 'undo')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editorRef.current?.trigger('source', 'redo')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
          
          <button 
            onClick={() => editorRef.current?.trigger('source', 'actions.find')}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Encoding Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowEncodings(!showEncodings)}
              className="flex items-center gap-2 text-xs font-mono px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Globe className="w-3 h-3" />
              {encoding.toUpperCase()}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showEncodings && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showEncodings && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 min-w-[180px]"
                >
                  <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-border/50 mb-1">
                    Select Encoding
                  </div>
                  {ENCODINGS.map(enc => (
                    <button
                      key={enc.value}
                      onClick={() => {
                        setEncoding(enc.value);
                        setShowEncodings(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                        encoding === enc.value ? "text-blue-500 font-bold" : "text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {enc.label}
                      {encoding === enc.value && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <Type className="w-3 h-3" />
            {getModelLanguage().toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[400px]">
        <Editor
          height="100%"
          language={getModelLanguage()}
          value={content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            lineNumbers: 'on',
            wordWrap: 'on',
            readOnly: isSaving,
            renderWhitespace: 'selection',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            }
          }}
        />
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            Line {cursorPos.line}, Col {cursorPos.column}
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            {(content.length / 1024).toFixed(2)} KB
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && <span className="text-yellow-500 font-bold">* MODIFIED</span>}
          <div className="flex items-center gap-1 text-blue-500">
            <Info className="w-3 h-3" />
            Connected to Proxy
          </div>
        </div>
      </div>
    </div>
  );
}
