/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Plus, Trash2, Edit2, ChevronUp, ChevronDown, 
  Code, Wrench, Film, Folder, Terminal, Cpu, Settings, 
  Package, Box, Layers, Monitor, Smartphone, Globe,
  LucideIcon, X, Check, GripVertical, Music, Camera, 
  Gamepad2, Book, Heart, Star, Cloud, Zap, Shield, 
  Anchor, Coffee, Gift, Home, Mail, Map, Phone, 
  Search, User, Users, Bell, Calendar, Clock, Upload,
  Gamepad, Disc, MonitorPlay, Joystick
} from 'lucide-react';
import React, { useState, useRef, ChangeEvent } from 'react';
import { cn } from '../lib/utils';
import { Category } from '../types';
import { useTranslation } from '../lib/i18n';
import { uploadIcon } from '../lib/storage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const ICON_LIST: Record<string, LucideIcon> = {
  Code, Wrench, Film, Folder, Terminal, Cpu, Settings, 
  Package, Box, Layers, Monitor, Smartphone, Globe,
  Music, Camera, Gamepad2, Book, Heart, Star, Cloud, 
  Zap, Shield, Anchor, Coffee, Gift, Home, Mail, 
  Map, Phone, Search, User, Users, Bell, Calendar, Clock,
  Gamepad, Disc, MonitorPlay, Joystick
};

// Console-like icons mapping
const CONSOLE_ICONS: Record<string, LucideIcon> = {
  'PlayStation': Disc,
  'Xbox': Gamepad,
  'Nintendo': MonitorPlay,
  'Sega': Joystick
};

const COLOR_LIST = [
  { name: 'Default', value: '' },
  { name: 'Blue', value: '#0078d4' },
  { name: 'Red', value: '#e81123' },
  { name: 'Green', value: '#107c10' },
  { name: 'Orange', value: '#d83b01' },
  { name: 'Purple', value: '#8764b8' },
  { name: 'Teal', value: '#008272' },
  { name: 'Pink', value: '#e67a91' },
];

interface CategoryManagerProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
  language?: string;
}

interface SortableCategoryProps {
  key?: React.Key;
  cat: Category;
  parentId?: string;
  level: number;
  t: any;
  editingId: string | null;
  editName: string;
  setEditName: (v: string) => void;
  editIcon: string;
  setEditIcon: (v: string) => void;
  editColor: string;
  setEditColor: (v: string) => void;
  editCustomIcon?: string;
  setEditCustomIcon: (v?: string) => void;
  startEdit: (item: Category) => void;
  saveEdit: (id: string) => void;
  setEditingId: (id: string | null) => void;
  handleRemoveCategory: (id: string) => void;
  handleAddCategory: (parentId?: string) => void;
  handleMove: (id: string, direction: 'up' | 'down', parentId?: string) => void;
  onUpdate: (categories: Category[]) => void;
  categories: Category[];
  updateCategoryRecursive: (cats: Category[], id: string, updater: (cat: Category) => Category) => Category[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleCustomIconUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

function SortableCategory({ 
  cat, parentId, level, t, editingId, editName, setEditName, editIcon, setEditIcon, 
  editColor, setEditColor, editCustomIcon, setEditCustomIcon, startEdit, saveEdit, 
  setEditingId, handleRemoveCategory, handleAddCategory, handleMove, onUpdate, categories, updateCategoryRecursive,
  fileInputRef, handleCustomIconUpload
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditing = editingId === cat.id;
  const isUncategorized = cat.id === 'uncategorized';
  const displayName = isUncategorized ? t('categories.uncategorized') : cat.name;

  return (
    <div ref={setNodeRef} style={style} className={cn("fluent-card overflow-hidden group", level > 0 && "ml-6 mt-2")}>
      <div className={cn("p-3 flex items-center justify-between border-b border-border", level === 0 ? "bg-muted/20" : "bg-muted/5")}>
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
          </div>
          
          {isEditing ? (
            <div className="flex flex-col gap-4 flex-1 p-2 bg-background rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  placeholder={t('categories.name')}
                  className="bg-muted/50 border border-border rounded px-3 py-1.5 text-sm flex-1 focus:ring-2 focus:ring-ring outline-none"
                />
                <button onClick={() => saveEdit(cat.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="grid grid-cols-8 gap-1 p-2 bg-muted/20 border border-border rounded-lg max-h-32 overflow-y-auto">
                {Object.entries(ICON_LIST).map(([name, Ico]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setEditIcon(name);
                      setEditCustomIcon(undefined);
                    }}
                    className={cn(
                      "p-2 rounded hover:bg-muted transition-colors flex items-center justify-center",
                      editIcon === name && !editCustomIcon ? "bg-accent/20 text-accent ring-1 ring-accent" : "text-muted-foreground"
                    )}
                    title={name}
                  >
                    <Ico className="w-4 h-4" />
                  </button>
                ))}
                {Object.entries(CONSOLE_ICONS).map(([name, Ico]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setEditIcon(name);
                      setEditCustomIcon(undefined);
                    }}
                    className={cn(
                      "p-2 rounded hover:bg-muted transition-colors flex items-center justify-center",
                      editIcon === name ? "bg-accent/20 text-accent ring-1 ring-accent" : "text-muted-foreground"
                    )}
                    title={name}
                  >
                    <Ico className="w-4 h-4" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-2 rounded hover:bg-muted transition-colors flex items-center justify-center",
                    editCustomIcon ? "bg-accent/20 text-accent ring-1 ring-accent" : "text-muted-foreground"
                  )}
                  title={t('categories.customIcon')}
                >
                  <Upload className="w-4 h-4" />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".ico,.png" 
                    onChange={handleCustomIconUpload} 
                  />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {COLOR_LIST.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setEditColor(color.value)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      editColor === color.value ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value || '#ccc' }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div 
                className="p-1.5 rounded text-white shadow-sm flex items-center justify-center w-8 h-8"
                style={{ backgroundColor: cat.color || 'var(--accent)' }}
              >
                {cat.customIcon ? (
                  <img src={cat.customIcon} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  (() => {
                    const Icon = ICON_LIST[cat.icon] || CONSOLE_ICONS[cat.icon] || Folder;
                    return <Icon className="w-4 h-4" />;
                  })()
                )}
              </div>
              <span className="font-medium text-sm">{displayName}</span>
              {!isUncategorized && (
                <button onClick={() => startEdit(cat)} className="p-1.5 text-muted-foreground hover:text-[var(--accent)] hover:bg-accent/10 rounded-md transition-all ml-1">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button onClick={() => handleMove(cat.id, 'up', parentId)} className="p-1 hover:bg-muted rounded"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={() => handleMove(cat.id, 'down', parentId)} className="p-1 hover:bg-muted rounded"><ChevronDown className="w-4 h-4" /></button>
          {!isUncategorized && (
            <button onClick={() => handleRemoveCategory(cat.id)} className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded ml-2"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      <div className="p-2 space-y-1">
        <SortableContext items={(cat.children || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
          {(cat.children || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(child => (
            <SortableCategory 
              key={child.id} 
              cat={child} 
              parentId={cat.id} 
              level={level + 1} 
              t={t}
              editingId={editingId}
              editName={editName}
              setEditName={setEditName}
              editIcon={editIcon}
              setEditIcon={setEditIcon}
              editColor={editColor}
              setEditColor={setEditColor}
              editCustomIcon={editCustomIcon}
              setEditCustomIcon={setEditCustomIcon}
              startEdit={startEdit}
              saveEdit={saveEdit}
              setEditingId={setEditingId}
              handleRemoveCategory={handleRemoveCategory}
              handleAddCategory={handleAddCategory}
              handleMove={handleMove}
              onUpdate={onUpdate}
              categories={categories}
              updateCategoryRecursive={updateCategoryRecursive}
              fileInputRef={fileInputRef}
              handleCustomIconUpload={handleCustomIconUpload}
            />
          ))}
        </SortableContext>
        
        {level < 4 && (
          <button 
            onClick={() => handleAddCategory(cat.id)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-accent px-4 py-2 transition-colors"
          >
            <Plus className="w-3 h-3" /> {t('categories.addSub')}
          </button>
        )}
      </div>
    </div>
  );
}

export function CategoryManager({ categories, onUpdate, language = 'en' }: CategoryManagerProps) {
  const { t } = useTranslation(language);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCustomIcon, setEditCustomIcon] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const findParentAndList = (cats: Category[], id: string): { parentId?: string, list: Category[] } | null => {
        const idx = cats.findIndex(c => c.id === id);
        if (idx !== -1) return { list: cats };
        for (const cat of cats) {
          if (cat.children) {
            const found = findParentAndList(cat.children, id);
            if (found) return { parentId: cat.id, ...found };
          }
        }
        return null;
      };

      const activeInfo = findParentAndList(categories, active.id as string);
      const overInfo = findParentAndList(categories, over.id as string);

      if (activeInfo && overInfo && activeInfo.parentId === overInfo.parentId) {
        const oldIndex = activeInfo.list.findIndex(c => c.id === active.id);
        const newIndex = overInfo.list.findIndex(c => c.id === over.id);
        const newList = arrayMove(activeInfo.list, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));

        if (activeInfo.parentId) {
          onUpdate(updateCategoryRecursive(categories, activeInfo.parentId, (cat) => ({
            ...cat,
            children: newList
          })));
        } else {
          onUpdate(newList);
        }
      }
    }
  };

  const updateCategoryRecursive = (cats: Category[] = [], id: string, updater: (cat: Category) => Category): Category[] => {
    return (cats || []).map(cat => {
      if (cat.id === id) return updater(cat);
      if ((cat.children || []).length > 0) {
        return { ...cat, children: updateCategoryRecursive(cat.children, id, updater) };
      }
      return cat;
    });
  };

  const removeCategoryRecursive = (cats: Category[] = [], id: string): Category[] => {
    return (cats || [])
      .filter(cat => cat.id !== id)
      .map(cat => ({
        ...cat,
        children: removeCategoryRecursive(cat.children, id)
      }));
  };

  const handleAddCategory = (parentId?: string) => {
    const newCat: Category = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Category',
      icon: 'Folder',
      color: '',
      order: 99, // Will be sorted
      children: []
    };

    if (parentId) {
      onUpdate(updateCategoryRecursive(categories, parentId, (cat) => ({
        ...cat,
        children: [...cat.children, { ...newCat, order: cat.children.length }]
      })));
    } else {
      onUpdate([...categories, { ...newCat, order: categories.length }]);
    }
  };

  const handleRemoveCategory = (id: string) => {
    onUpdate(removeCategoryRecursive(categories, id));
  };

  const startEdit = (item: Category) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditIcon(item.icon);
    setEditColor(item.color || '');
    setEditCustomIcon(item.customIcon);
  };

  const saveEdit = async (id: string) => {
    let finalCustomIcon = editCustomIcon;
    if (editCustomIcon && editCustomIcon.startsWith('data:')) {
      try {
        const fileName = `icon_${id}_${Date.now()}.png`;
        finalCustomIcon = await uploadIcon(fileName, editCustomIcon);
      } catch (e) {
        console.error('Failed to upload custom icon', e);
      }
    }

    onUpdate(updateCategoryRecursive(categories, id, (cat) => ({
      ...cat,
      name: editName,
      icon: editIcon,
      color: editColor,
      customIcon: finalCustomIcon
    })));
    setEditingId(null);
  };

  const handleCustomIconUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditCustomIcon(reader.result as string);
        setEditIcon('Custom'); // Mark as custom
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMove = (id: string, direction: 'up' | 'down', parentId?: string) => {
    const moveInList = (list: Category[] = []) => {
      const sorted = [...(list || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
      const idx = sorted.findIndex(c => c.id === id);
      if (direction === 'up' && idx > 0) {
        [sorted[idx], sorted[idx - 1]] = [sorted[idx - 1], sorted[idx]];
      } else if (direction === 'down' && idx < sorted.length - 1) {
        [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
      }
      return sorted.map((c, i) => ({ ...c, order: i }));
    };

    if (parentId) {
      onUpdate(updateCategoryRecursive(categories, parentId, (cat) => ({
        ...cat,
        children: moveInList(cat.children)
      })));
    } else {
      onUpdate(moveInList(categories));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('categories.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('categories.subtitle')}</p>
        </div>
        <button onClick={() => handleAddCategory()} className="fluent-button-primary gap-2 text-xs py-1.5">
          <Plus className="w-3.5 h-3.5" /> {t('categories.addRoot')}
        </button>
      </div>

      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {([...(categories || [])]).sort((a, b) => (a.order || 0) - (b.order || 0)).map((cat) => (
              <SortableCategory 
                key={cat.id} 
                cat={cat} 
                level={0} 
                t={t}
                editingId={editingId}
                editName={editName}
                setEditName={setEditName}
                editIcon={editIcon}
                setEditIcon={setEditIcon}
                editColor={editColor}
                setEditColor={setEditColor}
                editCustomIcon={editCustomIcon}
                setEditCustomIcon={setEditCustomIcon}
                startEdit={startEdit}
                saveEdit={saveEdit}
                setEditingId={setEditingId}
                handleRemoveCategory={handleRemoveCategory}
                handleAddCategory={handleAddCategory}
                handleMove={handleMove}
                onUpdate={onUpdate}
                categories={categories}
                updateCategoryRecursive={updateCategoryRecursive}
                fileInputRef={fileInputRef}
                handleCustomIconUpload={handleCustomIconUpload}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
