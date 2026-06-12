'use client';

import { Home, BookOpen, Star, Clock, CheckSquare, LogOut, Sun, Moon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskCategory } from '@/types';

interface SidebarProps {
  activeCategory: TaskCategory | 'semua';
  onCategoryChange: (cat: TaskCategory | 'semua') => void;
  showHistory: boolean;
  onToggleHistory: () => void;
  userName: string;
  waNumber: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSignOut: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'semua',      label: 'Semua Tugas',  Icon: CheckSquare },
  { id: 'keseharian', label: 'Keseharian',   Icon: Home        },
  { id: 'tugas',      label: 'Tugas',        Icon: BookOpen    },
  { id: 'wishlist',   label: 'Wishlist',     Icon: Star        },
] as const;

export function Sidebar({
  activeCategory, onCategoryChange,
  showHistory, onToggleHistory,
  userName, waNumber,
  theme, onToggleTheme,
  onSignOut, isOpen, onClose,
}: SidebarProps) {
  const navBtnCls = (active: boolean) =>
    cn(
      'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
      active
        ? 'border'
        : 'hover:bg-[var(--bg-hover)] border border-transparent'
    );

  const navBtnStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'var(--accent-subtle)', borderColor: 'rgba(124,111,247,0.25)', color: 'var(--accent)' }
      : { color: 'var(--text-secondary)' };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 flex flex-col w-[220px]',
          'border-r transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--accent) 0%, rgba(34,211,238,0.8) 100%)' }}>
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
              AturAja
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            Kategori
          </p>
          {CATEGORIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { onCategoryChange(id as TaskCategory | 'semua'); onClose(); }}
              className={navBtnCls(activeCategory === id && !showHistory)}
              style={navBtnStyle(activeCategory === id && !showHistory)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}

          <div className="pt-3">
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Laporan
            </p>
            <button
              onClick={() => { onToggleHistory(); onClose(); }}
              className={navBtnCls(showHistory)}
              style={navBtnStyle(showHistory)}
            >
              <Clock className="w-4 h-4 shrink-0" />
              Histori
            </button>
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t px-3 py-3 space-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          </button>

          {/* User info */}
          <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {userName || '—'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              +{waNumber || '—'}
            </p>
          </div>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 transition-all hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
