'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // PKCE flow: /auth/callback sudah exchange code → session sudah aktif saat halaman ini load.
  // Implicit flow fallback: deteksi event dari hash fragment.
  useEffect(() => {
    // Cek session yang sudah ada (dari PKCE callback redirect)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
    });
    // Fallback: implicit flow
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8)    { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm)    { setError('Konfirmasi password tidak cocok.'); return; }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    if (updateErr) {
      setError('Gagal update password. Coba minta link reset baru.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.replace('/dashboard'), 2500);
  };

  const inputCls = cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all',
    'placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)]'
  );
  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border"
            style={{ background: 'linear-gradient(135deg,rgba(124,111,247,.15),rgba(34,211,238,.10))', borderColor: 'var(--border-default)' }}>
            <CheckSquare className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Buat Password Baru
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Masukkan password baru untuk akunmu
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl p-8 text-center border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Password berhasil diubah!
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Mengalihkan ke dashboard…
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-6 border shadow-2xl"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            {!hasSession && (
              <div className="mb-4 px-3.5 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#FCD34D' }}>
                ⚠️ Buka link ini langsung dari email reset password.
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Password Baru
                </label>
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
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--accent)]"
                    style={{ color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Konfirmasi Password
                </label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  required placeholder="Ulangi password baru"
                  className={inputCls} style={inputStyle} />
              </div>

              <button type="submit" disabled={loading || !hasSession}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)' }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan…
                  </span>
                ) : 'Simpan Password Baru'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
