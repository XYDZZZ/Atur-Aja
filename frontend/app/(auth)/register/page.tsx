'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckSquare, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type FormKey = 'name' | 'email' | 'wa_number' | 'password' | 'confirmPassword';

interface Form {
  name: string;
  email: string;
  wa_number: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [form,    setForm]    = useState<Form>({ name: '', email: '', wa_number: '', password: '', confirmPassword: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key: FormKey) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) { setError('Konfirmasi password tidak cocok.'); return; }
    if (form.password.length < 8)               { setError('Password minimal 8 karakter.');     return; }

    const waClean = form.wa_number.replace(/\D/g, '');
    if (waClean.length < 9) { setError('Nomor WhatsApp tidak valid.'); return; }

    const waFormatted = waClean.startsWith('0') ? '62' + waClean.slice(1) : waClean;

    setLoading(true);

    const { error: authErr } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: {
          name:      form.name.trim(),
          wa_number: waFormatted,
        },
      },
    });

    if (authErr) {
      setError(
        authErr.message.toLowerCase().includes('already')
          ? 'Email sudah terdaftar. Coba login.'
          : 'Gagal mendaftar. Coba lagi.'
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const inputCls = cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-all duration-200',
    'placeholder:text-[var(--text-muted)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)]'
  );
  const inputStyle = {
    background: 'var(--bg-elevated)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  } as React.CSSProperties;

  if (success) {
    return (
      <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Pendaftaran berhasil!
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Cek email untuk konfirmasi akun, lalu login.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)' }}
          >
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4 py-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/5 w-64 h-64 rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(124,111,247,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-1/5 w-48 h-48 rounded-full blur-3xl animate-float"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border"
            style={{ background: 'linear-gradient(135deg, rgba(124,111,247,0.15), rgba(34,211,238,0.10))', borderColor: 'var(--border-default)' }}>
            <CheckSquare className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Daftar AturAja
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Buat akun gratis, langsung pakai
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          {error && (
            <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-sm text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nama Lengkap</label>
              <input type="text" value={form.name} onChange={set('name')} required placeholder="Nama kamu" className={inputCls} style={inputStyle} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="kamu@email.com" className={inputCls} style={inputStyle} />
            </div>

            {/* WA Number */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nomor WhatsApp
              </label>
              <input type="tel" value={form.wa_number} onChange={set('wa_number')} required placeholder="08xxxxxxxxxx" className={inputCls} style={inputStyle} />
              <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Digunakan untuk pengiriman alarm otomatis
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 8 karakter" className={cn(inputCls, 'pr-11')} style={inputStyle} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--accent)]" style={{ color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Konfirmasi Password</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required placeholder="Ulangi password" className={inputCls} style={inputStyle} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', boxShadow: '0 4px 20px var(--accent-glow)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Mendaftar...
                </span>
              ) : 'Daftar Sekarang'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
