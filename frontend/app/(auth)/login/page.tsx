'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      setError('Email atau password salah. Coba lagi.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const inputCls = cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all duration-200',
    'placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)]',
    'focus:border-[var(--accent)]'
  );

  const inputStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/5 w-56 h-56 rounded-full blur-3xl animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border"
            style={{
              background: 'linear-gradient(135deg, rgba(124,111,247,0.15) 0%, rgba(34,211,238,0.10) 100%)',
              borderColor: 'var(--border-default)',
            }}
          >
            <CheckSquare className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            AturAja
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Masuk ke akunmu
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 shadow-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          {error && (
            <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
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
                className={inputCls}
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs transition-colors hover:text-[var(--accent)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 karakter"
                  className={cn(inputCls, 'pr-11')}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 transition-colors hover:text-[var(--accent)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={remember}
                onClick={() => setRemember(!remember)}
                className={cn(
                  'w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0',
                  remember ? 'border-[var(--accent)]' : 'border-[var(--border-strong)]'
                )}
                style={{ background: remember ? 'var(--accent)' : 'var(--bg-elevated)' }}
              >
                {remember && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Ingat saya
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'var(--accent)' : 'var(--accent)',
                boxShadow: '0 4px 20px var(--accent-glow)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Masuk...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
