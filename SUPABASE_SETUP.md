# ════════════════════════════════════════════════════════
#  CHECKLIST KONFIGURASI SUPABASE (wajib sebelum coba app)
# ════════════════════════════════════════════════════════

## 1. Tambahkan Redirect URL di Supabase Dashboard

Buka: https://app.supabase.com
→ Project kamu → Authentication → URL Configuration

Tambahkan URL berikut ke kolom "Redirect URLs":

  LOKAL (development):
    http://localhost:3000/auth/callback

  PRODUKSI (saat deploy nanti):
    https://domain-kamu.vercel.app/auth/callback

Klik "Save".

────────────────────────────────────────────────────────

## 2. Set Site URL

Masih di Authentication → URL Configuration:
  
  Development : http://localhost:3000
  Production  : https://domain-kamu.vercel.app

────────────────────────────────────────────────────────

## 3. (Opsional) Matikan Email Confirmation untuk Dev

Jika ingin langsung login tanpa klik link email dulu:
Authentication → Providers → Email
→ Matikan "Confirm email"
→ Klik Save

Aktifkan lagi saat production!

────────────────────────────────────────────────────────

## 4. Verifikasi Schema SQL

Pastikan schema.sql sudah dijalankan:
SQL Editor → New Query → paste isi schema.sql → Run

Cek di Table Editor bahwa tabel 'users' dan 'tasks' sudah ada.

════════════════════════════════════════════════════════
