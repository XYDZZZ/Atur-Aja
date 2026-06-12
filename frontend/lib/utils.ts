import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TaskStatus, TaskPriority, TaskCategory } from '@/types';

// ─────────────────────────────────────────────────
//  Tailwind class helper
// ─────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────────
//  Date formatters (Indonesian locale)
// ─────────────────────────────────────────────────
export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return '';
  const d   = new Date(date);
  const now = new Date();

  const startOfDay = (dt: Date) =>
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

  const diffDays = Math.round(
    (startOfDay(d).getTime() - startOfDay(now).getTime()) / 86_400_000
  );

  if (diffDays === 0)  return 'Hari ini';
  if (diffDays === 1)  return 'Besok';
  if (diffDays === -1) return 'Kemarin';
  if (diffDays > 1 && diffDays <= 7)  return `${diffDays} hari lagi`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} hari lalu`;
  return formatDate(d);
}

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function formatDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

// ─────────────────────────────────────────────────
//  Config maps
// ─────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  akan_dilakukan: {
    label: 'Akan Dilakukan',
    color: 'text-purple-400',
    bg:    'bg-purple-500/15 border-purple-500/25',
  },
  proses: {
    label: 'Proses',
    color: 'text-blue-400',
    bg:    'bg-blue-500/15 border-blue-500/25',
  },
  jeda: {
    label: 'Jeda',
    color: 'text-slate-400',
    bg:    'bg-slate-500/15 border-slate-500/25',
  },
  tertunda: {
    label: 'Tertunda',
    color: 'text-amber-400',
    bg:    'bg-amber-500/15 border-amber-500/25',
  },
  selesai: {
    label: 'Selesai',
    color: 'text-emerald-400',
    bg:    'bg-emerald-500/15 border-emerald-500/25',
  },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; dotClass: string }
> = {
  tinggi: { label: 'Tinggi', color: 'text-red-400',     dotClass: 'bg-red-500'     },
  sedang: { label: 'Sedang', color: 'text-amber-400',   dotClass: 'bg-amber-500'   },
  rendah: { label: 'Rendah', color: 'text-emerald-400', dotClass: 'bg-emerald-500' },
};

export const CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: string; color: string }
> = {
  keseharian: { label: 'Keseharian', icon: '🏠', color: 'text-sky-400'    },
  tugas:      { label: 'Tugas',      icon: '📚', color: 'text-violet-400' },
  wishlist:   { label: 'Wishlist',   icon: '⭐', color: 'text-amber-400'  },
};
