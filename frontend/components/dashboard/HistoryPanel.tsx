'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';
import type { Task } from '@/types';

interface HistoryPanelProps {
  userId: string;
}

type RangeKey = 'kemarin' | '3hari' | '7hari' | '14hari' | '30hari' | 'bulan_lalu' | 'kustom';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'kemarin',   label: 'Kemarin'   },
  { key: '3hari',     label: '3 Hari'    },
  { key: '7hari',     label: '7 Hari'    },
  { key: '14hari',    label: '14 Hari'   },
  { key: '30hari',    label: '30 Hari'   },
  { key: 'bulan_lalu',label: 'Bulan Lalu'},
  { key: 'kustom',    label: 'Kustom'    },
];

function getRange(key: RangeKey, cs?: string, ce?: string): { start: Date; end: Date } {
  const now = new Date();
  const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const eod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (key) {
    case 'kemarin': {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return { start: sod(d), end: eod(d) };
    }
    case '3hari': {
      const d = new Date(now); d.setDate(d.getDate() - 3);
      return { start: sod(d), end: eod(now) };
    }
    case '7hari': {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      return { start: sod(d), end: eod(now) };
    }
    case '14hari': {
      const d = new Date(now); d.setDate(d.getDate() - 14);
      return { start: sod(d), end: eod(now) };
    }
    case '30hari': {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      return { start: sod(d), end: eod(now) };
    }
    case 'bulan_lalu': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start: s, end: e };
    }
    case 'kustom':
      return {
        start: cs ? sod(new Date(cs)) : sod(new Date(now.setDate(now.getDate() - 7))),
        end:   ce ? eod(new Date(ce)) : eod(new Date()),
      };
  }
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function HistoryPanel({ userId }: HistoryPanelProps) {
  const [range,       setRange]       = useState<RangeKey>('7hari');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [loading,     setLoading]     = useState(false);
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { start, end } = getRange(range, customStart, customEnd);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [range, customStart, customEnd, userId, supabase]);

  useEffect(() => {
    if (range !== 'kustom') fetchHistory();
  }, [range, fetchHistory]);

  const stats = {
    total:    tasks.length,
    selesai:  tasks.filter((t) => t.status === 'selesai').length,
    proses:   tasks.filter((t) => t.status === 'proses').length,
    tertunda: tasks.filter((t) => t.status === 'tertunda').length,
    tinggi:   tasks.filter((t) => t.priority === 'tinggi').length,
  };

  const completion = stats.total > 0
    ? Math.round((stats.selesai / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              background:   range === r.key ? 'var(--accent-subtle)'       : 'var(--bg-card)',
              borderColor:  range === r.key ? 'rgba(124,111,247,0.3)'      : 'var(--border-default)',
              color:        range === r.key ? 'var(--accent)'               : 'var(--text-secondary)',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {range === 'kustom' && (
        <div
          className="flex flex-wrap items-end gap-3 p-4 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          {[
            { label: 'Dari',    val: customStart, setter: setCustomStart },
            { label: 'Sampai',  val: customEnd,   setter: setCustomEnd   },
          ].map(({ label, val, setter }) => (
            <div key={label}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              <input
                type="date"
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          ))}
          <button
            onClick={fetchHistory}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
            style={{ background: 'var(--accent)' }}
          >
            Tampilkan
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',          val: stats.total,    color: 'var(--text-primary)'  },
          { label: 'Selesai',        val: stats.selesai,  color: '#34D399'              },
          { label: 'Proses',         val: stats.proses,   color: '#60A5FA'              },
          { label: 'Tertunda',       val: stats.tertunda, color: '#FCD34D'              },
          { label: 'Prioritas ↑',   val: stats.tinggi,   color: '#F87171'              },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center px-3 py-3.5 rounded-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      {stats.total > 0 && (
        <div className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Tingkat Penyelesaian
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {completion}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${completion}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[60px] rounded-xl skeleton" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Tidak ada tugas dalam periode ini
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const sCfg = STATUS_CONFIG[task.status];
            const pCfg = PRIORITY_CONFIG[task.priority];
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:bg-[var(--bg-hover)]"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div
                  className="w-[3px] self-stretch rounded-full shrink-0"
                  style={{ background: task.priority === 'tinggi' ? '#EF4444' : task.priority === 'sedang' ? '#F59E0B' : '#10B981' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn('text-sm font-medium truncate', task.status === 'selesai' && 'line-through opacity-60')}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {task.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {fmtDt(task.created_at)}
                  </p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-lg text-[11px] font-medium border shrink-0', sCfg.bg, sCfg.color)}>
                  {sCfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
