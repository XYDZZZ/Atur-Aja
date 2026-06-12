'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckSquare, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authErr } = await supabase.auth.resetPasswordForEmail(email, {
      // PKCE flow: Supabase redirect ke /auth/callback?code=xxx
      // lalu callback mengexchange code & redirect ke /reset-password
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (authErr) {
      setError('Gagal mengirim email. Pastikan email kamu terdaftar.');
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] animate-fade-in-up">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm mb-7 transition-colors hover:text-[var(--accent)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Login
        </Link>

        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border"
            style={{ background: 'linear-gradient(135deg, rgba(124,111,247,0.15), rgba(34,211,238,0.10))', borderColor: 'var(--border-default)' }}>
            <CheckSquare className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Lupa Password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Masukkan email untuk reset password
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl p-8 text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              Email terkirim!
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Cek inbox kamu dan klik link untuk reset password.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-6 border shadow-2xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            {error && (
              <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="kamu@email.com"
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all',
                    'placeholder:text-[var(--text-muted)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)]'
                  )}
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                  </span>
                ) : 'Kirim Link Reset'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
