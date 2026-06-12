'use client';

import { useState } from 'react';
import {
  Circle, CheckCircle2, MoreVertical,
  Edit2, Trash2, Calendar, Clock, AlertCircle,
} from 'lucide-react';
import {
  cn, STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG,
  formatRelativeDate, isOverdue,
} from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const STATUS_CYCLE: TaskStatus[] = [
  'akan_dilakukan', 'proses', 'jeda', 'tertunda', 'selesai',
];

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusCfg   = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const categoryCfg = CATEGORY_CONFIG[task.category];
  const overdue     = isOverdue(task.deadline) && task.status !== 'selesai';
  const done        = task.status === 'selesai';

  const cycleStatus = () => {
    const idx  = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(task.id, next);
  };

  const priorityBorderColor =
    task.priority === 'tinggi' ? '#EF4444' :
    task.priority === 'sedang' ? '#F59E0B' : '#10B981';

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-4 transition-all duration-200 task-card-hover',
        done && 'opacity-60'
      )}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Priority stripe */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
        style={{ background: priorityBorderColor }}
      />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Status toggle */}
          <button
            onClick={cycleStatus}
            className="mt-0.5 shrink-0 transition-transform hover:scale-110"
            title={`Status: ${statusCfg.label} — klik untuk lanjut`}
          >
            {done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Circle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>

          {/* Title */}
          <span
            className={cn('flex-1 text-sm font-semibold leading-snug', done && 'line-through')}
            style={{ color: 'var(--text-primary)' }}
          >
            {task.title}
          </span>

          {/* Context menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'p-1 rounded-lg transition-all',
                'opacity-0 group-hover:opacity-100',
                'hover:bg-[var(--bg-hover)]'
              )}
              style={{ color: 'var(--text-muted)' }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-7 z-20 w-32 rounded-xl border py-1 shadow-2xl"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
                >
                  <button
                    onClick={() => { onEdit(task); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-all hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-400 transition-all hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {task.description}
          </p>
        )}

        {/* Footer chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border',
              statusCfg.bg, statusCfg.color
            )}
          >
            {statusCfg.label}
          </span>

          {/* Category icon */}
          <span className="text-sm leading-none">{categoryCfg.icon}</span>

          {/* Priority dot */}
          <span className={cn('flex items-center gap-1 text-[11px]', priorityCfg.color)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', priorityCfg.dotClass)} />
            {priorityCfg.label}
          </span>

          {/* Deadline */}
          {task.deadline && (
            <span
              className={cn('flex items-center gap-1 text-[11px]', overdue ? 'text-red-400' : '')}
              style={{ color: overdue ? undefined : 'var(--text-muted)' }}
            >
              {overdue
                ? <AlertCircle className="w-3 h-3" />
                : <Calendar className="w-3 h-3" />
              }
              {overdue ? 'Terlambat' : formatRelativeDate(task.deadline)}
            </span>
          )}

          {/* Alarm indicator */}
          {task.alarm_time && !task.alarm_sent && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--accent)' }}>
              <Clock className="w-3 h-3" />
              Alarm aktif
            </span>
          )}
          {task.alarm_time && task.alarm_sent && (
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              ✓ Alarm terkirim
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
