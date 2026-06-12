'use client';

import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskFilters, FilterStatus, FilterPriority, SortOption } from '@/types';

interface FilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
}

const selectCls = cn(
  'appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs border cursor-pointer',
  'transition-all focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]'
);
const selectStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderColor: 'var(--border-default)',
  color: 'var(--text-secondary)',
};

function Sel<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value as T)}
        className={selectCls} style={selectStyle}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: 'var(--bg-elevated)' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
    </div>
  );
}

const STATUS_OPTS = [
  { value: 'semua',          label: 'Semua Status'    },
  { value: 'akan_dilakukan', label: 'Akan Dilakukan'  },
  { value: 'proses',         label: 'Proses'          },
  { value: 'jeda',           label: 'Jeda'            },
  { value: 'tertunda',       label: 'Tertunda'        },
  { value: 'selesai',        label: 'Selesai'         },
] as const;

const PRIORITY_OPTS = [
  { value: 'semua',  label: 'Semua Prioritas' },
  { value: 'tinggi', label: '🔴 Tinggi'        },
  { value: 'sedang', label: '🟡 Sedang'        },
  { value: 'rendah', label: '🟢 Rendah'        },
] as const;

const SORT_OPTS = [
  { value: 'created_at', label: 'Dibuat'      },
  { value: 'deadline',   label: 'Deadline'    },
  { value: 'updated_at', label: 'Diperbarui'  },
] as const;

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const set = <K extends keyof TaskFilters>(k: K, v: TaskFilters[K]) =>
    onFiltersChange({ ...filters, [k]: v });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />

      <Sel value={filters.status}   options={STATUS_OPTS}   onChange={(v) => set('status',   v as FilterStatus)}   />
      <Sel value={filters.priority} options={PRIORITY_OPTS} onChange={(v) => set('priority', v as FilterPriority)} />

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>Urut:</span>
        <Sel value={filters.sortBy} options={SORT_OPTS} onChange={(v) => set('sortBy', v as SortOption)} />
        <button
          onClick={() => set('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-2.5 py-1.5 rounded-lg text-xs border transition-all hover:bg-[var(--bg-hover)]"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          {filters.sortOrder === 'asc' ? '↑ Lama' : '↓ Baru'}
        </button>
      </div>
    </div>
  );
}
