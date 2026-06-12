'use client';

import { useState, useRef, useCallback } from 'react';
import { Sparkles, Send, Calendar, Clock, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { parseSmartInput } from '@/lib/nlp';
import { cn, CATEGORY_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';
import type { Task, TaskCategory } from '@/types';

type CreatePayload = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'alarm_sent'>;

interface SmartInputProps {
  onTaskCreate: (payload: CreatePayload) => Promise<boolean>;
  defaultCategory: TaskCategory;
}

const EXAMPLES = [
  'tugas rpl, dl 9 juni pagi, alarm nanti malam jam 7',
  'beli kado mama, besok jam 3 sore, penting',
  'presentasi pkl, minggu depan selasa, urgent',
  'olahraga pagi, alarm besok jam 6 pagi',
];

function fmtDate(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

export function SmartInput({ onTaskCreate, defaultCategory }: SmartInputProps) {
  const [input,       setInput]       = useState('');
  const [parsed,      setParsed]      = useState<ReturnType<typeof parseSmartInput> | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((val: string) => {
    setInput(val);
    if (val.trim().length > 3) {
      const res = parseSmartInput(val);
      const hasMeta = res.deadline || res.alarm_time || res.category || res.priority;
      setParsed(hasMeta ? res : null);
    } else {
      setParsed(null);
    }
  }, []);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setSubmitting(true);

    const res = parseSmartInput(trimmed);

    const ok = await onTaskCreate({
      title:       res.title || trimmed,
      description: null,
      category:    res.category  || defaultCategory,
      status:      'akan_dilakukan',
      priority:    res.priority  || 'sedang',
      deadline:    res.deadline  ? res.deadline.toISOString()  : null,
      alarm_time:  res.alarm_time ? res.alarm_time.toISOString() : null,
    });

    if (ok !== false) { setInput(''); setParsed(null); }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const hasParsed = parsed && (parsed.deadline || parsed.alarm_time || parsed.category || parsed.priority);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
          Smart Input
        </span>
        <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
          — ketik natural, AI ekstrak info tugas otomatis
        </span>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="ml-auto flex items-center gap-1 text-xs transition-colors hover:text-[var(--accent)]"
          style={{ color: 'var(--text-muted)' }}
        >
          Contoh
          {showExamples ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Example chips */}
      {showExamples && (
        <div
          className="flex flex-wrap gap-2 px-4 py-2.5 border-b"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                handleChange(ex);
                setShowExamples(false);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className="px-2.5 py-1 rounded-lg text-xs border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Textarea + Send */}
      <div className="flex items-start gap-3 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik tugas... contoh: 'tugas rpl, dl 9 juni pagi, alarm malam jam 7'"
          rows={2}
          className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || submitting}
          className={cn(
            'mt-0.5 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white',
            'transition-all disabled:opacity-40 disabled:cursor-not-allowed',
            'shrink-0'
          )}
          style={{ background: 'var(--accent)', boxShadow: '0 2px 12px var(--accent-glow)' }}
        >
          {submitting ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Parsed preview */}
      {hasParsed && (
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>
            Terdeteksi:
          </span>

          {parsed.category && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border border-[var(--accent)]/20 text-[var(--accent)] bg-[var(--accent-subtle)]">
              <Tag className="w-3 h-3" />
              {CATEGORY_CONFIG[parsed.category].icon} {CATEGORY_CONFIG[parsed.category].label}
            </span>
          )}

          {parsed.priority && (
            <span
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border',
                parsed.priority === 'tinggi'
                  ? 'border-red-500/20 text-red-400 bg-red-500/10'
                  : parsed.priority === 'sedang'
                  ? 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                  : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', PRIORITY_CONFIG[parsed.priority].dotClass)} />
              {PRIORITY_CONFIG[parsed.priority].label}
            </span>
          )}

          {parsed.deadline && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border border-cyan-500/20 text-cyan-400 bg-cyan-500/10">
              <Calendar className="w-3 h-3" />
              DL: {fmtDate(parsed.deadline)}
            </span>
          )}

          {parsed.alarm_time && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border border-amber-500/20 text-amber-400 bg-amber-500/10">
              <Clock className="w-3 h-3" />
              Alarm: {fmtDate(parsed.alarm_time)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
