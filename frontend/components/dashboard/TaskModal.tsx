'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { parseSmartInput } from '@/lib/nlp';
import { cn, STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_CONFIG, formatDatetimeLocal } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority, TaskCategory } from '@/types';

interface TaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  defaultCategory: TaskCategory;
}

const STATUSES:    TaskStatus[]   = ['akan_dilakukan','proses','jeda','tertunda','selesai'];
const PRIORITIES:  TaskPriority[] = ['tinggi','sedang','rendah'];
const CATEGORIES:  TaskCategory[] = ['keseharian','tugas','wishlist'];

export function TaskModal({ isOpen, task, onClose, onSave, defaultCategory }: TaskModalProps) {
  const [tab,         setTab]         = useState<'manual' | 'smart'>('manual');
  const [smartText,   setSmartText]   = useState('');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState<TaskCategory>(defaultCategory);
  const [status,      setStatus]      = useState<TaskStatus>('akan_dilakukan');
  const [priority,    setPriority]    = useState<TaskPriority>('sedang');
  const [deadline,    setDeadline]    = useState('');
  const [alarmTime,   setAlarmTime]   = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setCategory(task.category);
      setStatus(task.status);
      setPriority(task.priority);
      setDeadline(formatDatetimeLocal(task.deadline));
      setAlarmTime(formatDatetimeLocal(task.alarm_time));
    } else {
      setTitle(''); setDescription('');
      setCategory(defaultCategory); setStatus('akan_dilakukan');
      setPriority('sedang'); setDeadline(''); setAlarmTime('');
      setSmartText(''); setTab('manual');
    }
  }, [task, defaultCategory, isOpen]);

  const handleSmartParse = () => {
    if (!smartText.trim()) return;
    const res = parseSmartInput(smartText);
    if (res.title)      setTitle(res.title);
    if (res.category)   setCategory(res.category);
    if (res.priority)   setPriority(res.priority);
    if (res.deadline)   setDeadline(formatDatetimeLocal(res.deadline.toISOString()));
    if (res.alarm_time) setAlarmTime(formatDatetimeLocal(res.alarm_time.toISOString()));
    setTab('manual');
    setSmartText('');
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const alarmChanged = task?.alarm_time !== (alarmTime ? new Date(alarmTime).toISOString() : null);
    await onSave({
      title:       title.trim(),
      description: description.trim() || null,
      category, status, priority,
      deadline:   deadline   ? new Date(deadline).toISOString()   : null,
      alarm_time: alarmTime  ? new Date(alarmTime).toISOString()  : null,
      alarm_sent: alarmChanged ? false : (task?.alarm_sent ?? false),
    });
    setSaving(false);
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  };
  const inputCls = cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all',
    'placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)]'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {task ? 'Edit Tugas' : 'Tambah Tugas'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-all" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs (new task only) */}
        {!task && (
          <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            {(['manual', 'smart'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('flex-1 py-2.5 text-sm font-medium transition-colors border-b-2')}
                style={{
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  borderColor: tab === t ? 'var(--accent)' : 'transparent',
                }}
              >
                {t === 'manual' ? 'Manual' : (
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Smart Input
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-4 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Smart Input tab */}
          {tab === 'smart' && !task && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Ketik deskripsi tugas secara natural, AI akan mengisi form otomatis.
              </p>
              <textarea
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                placeholder="contoh: tugas rpl, dl 9 juni pagi, alarm malam jam 7, penting"
                rows={3}
                className={cn(inputCls, 'resize-none')}
                style={inputStyle}
              />
              <button
                onClick={handleSmartParse}
                disabled={!smartText.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                Parse & Isi Form
              </button>
            </div>
          )}

          {/* Manual form */}
          {(tab === 'manual' || task) && (
            <>
              {/* Title */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Judul <span className="text-red-400">*</span>
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nama tugas..." className={inputCls} style={inputStyle} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Deskripsi <span style={{ color: 'var(--text-muted)' }}>(opsional)</span>
                </label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan tambahan..." rows={2}
                  className={cn(inputCls, 'resize-none')} style={inputStyle} />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Kategori</label>
                  <div className="space-y-1.5">
                    {CATEGORIES.map((cat) => (
                      <button key={cat} type="button" onClick={() => setCategory(cat)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all')}
                        style={{
                          background: category === cat ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                          borderColor: category === cat ? 'rgba(124,111,247,0.3)' : 'var(--border-default)',
                          color: category === cat ? 'var(--accent)' : 'var(--text-secondary)',
                        }}>
                        {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Prioritas</label>
                  <div className="space-y-1.5">
                    {PRIORITIES.map((p) => {
                      const active = priority === p;
                      const clrs = p === 'tinggi'
                        ? { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#F87171' }
                        : p === 'sedang'
                        ? { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#FCD34D' }
                        : { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  text: '#34D399' };
                      return (
                        <button key={p} type="button" onClick={() => setPriority(p)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all"
                          style={{
                            background: active ? clrs.bg : 'var(--bg-elevated)',
                            borderColor: active ? clrs.border : 'var(--border-default)',
                            color: active ? clrs.text : 'var(--text-secondary)',
                          }}>
                          <span className={cn('w-2 h-2 rounded-full', PRIORITY_CONFIG[p].dotClass)} />
                          {PRIORITY_CONFIG[p].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status (edit only) */}
              {task && (
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => {
                      const cfg = STATUS_CONFIG[s];
                      return (
                        <button key={s} type="button" onClick={() => setStatus(s)}
                          className={cn('px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all', status === s && cn(cfg.bg, cfg.color))}
                          style={{ borderColor: status === s ? undefined : 'var(--border-default)', color: status === s ? undefined : 'var(--text-secondary)' }}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deadline */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Deadline <span style={{ color: 'var(--text-muted)' }}>(opsional)</span>
                </label>
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>

              {/* Alarm */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Alarm WhatsApp <span style={{ color: 'var(--text-muted)' }}>(opsional)</span>
                </label>
                <input type="datetime-local" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)}
                  className={inputCls} style={inputStyle} />
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  🤖 Bot WA akan mengirim pengingat ke nomor WhatsApp kamu
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:bg-[var(--bg-hover)]"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            Batal
          </button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 12px var(--accent-glow)' }}>
            {saving ? 'Menyimpan...' : task ? 'Simpan Perubahan' : 'Buat Tugas'}
          </button>
        </div>
      </div>
    </div>
  );
}
