# AturAja — Manajemen Tugas Cerdas 📋

> To-do list & task manager tingkat lanjut dengan **Smart Input NLP lokal** dan **pengingat WhatsApp otomatis** — 100% gratis menggunakan layanan free-tier.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Bot-25D366?logo=whatsapp)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🧠 **Smart Input** | Ketik natural — `"tugas rpl, dl 9 juni pagi, alarm malam jam 7"` → otomatis ekstrak judul, deadline & alarm |
| 🤖 **WA Bot** | Bot kirim pengingat ke nomor WA pengguna sesuai waktu alarm yang ditentukan |
| 📊 **Dashboard** | CRUD tugas dengan kategori, status (5 state), prioritas (3 level), filter & sort |
| 📜 **Histori** | Rekapan tugas berdasarkan rentang waktu (Kemarin s/d Kustom) |
| 🌙 **Dark/Light Mode** | Tema elegan, responsif mobile/tablet/desktop |
| 🔐 **Auth** | Register, Login, Lupa Password via Supabase Auth |

---

## 🗂 Struktur Proyek

```
aturaja/
├── schema.sql              ← Jalankan ini di Supabase SQL Editor
├── frontend/               ← Next.js 14 App (port 3000)
│   ├── app/
│   │   ├── (auth)/         ← Login, Register, Forgot Password
│   │   └── dashboard/      ← Halaman utama
│   ├── components/dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskModal.tsx
│   │   ├── SmartInput.tsx  ← NLP input component
│   │   ├── FilterBar.tsx
│   │   └── HistoryPanel.tsx
│   ├── lib/
│   │   ├── nlp.ts          ← Parser NLP lokal (chrono-node + regex)
│   │   ├── utils.ts
│   │   └── supabase/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTasks.ts
│   └── types/index.ts
└── bot/                    ← Node.js WhatsApp Bot (proses terpisah)
    ├── index.js            ← Entry point
    ├── scheduler.js        ← Cron job — cek & kirim alarm
    └── supabase.js
```

---

## 🔧 Prasyarat

Pastikan sudah terinstall di sistem (Zorin OS / Ubuntu):

```bash
# Cek versi (minimal Node 18, npm 9)
node --version
npm --version

# Install Node.js 20 LTS jika belum ada
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependensi Puppeteer (untuk whatsapp-web.js)
sudo apt-get install -y \
  chromium-browser \
  libgbm-dev \
  libxshmfence-dev \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libasound2
```

---

## 🚀 Langkah Setup

### 1 · Buat Proyek Supabase

1. Buka **https://app.supabase.com** dan buat proyek baru (gratis)
2. Catat **Project URL** dan **Anon Key** (Settings → API)
3. Catat juga **Service Role Key** (akan dipakai oleh bot)
4. Buka **SQL Editor → New Query**, paste isi file `schema.sql`, lalu klik **Run**

> **Aktifkan Email Confirmation** (opsional):
> Authentication → Providers → Email → matikan "Confirm email" jika ingin login langsung tanpa konfirmasi (cocok untuk development)

---

### 2 · Setup Frontend (Next.js)

```bash
# Masuk ke direktori frontend
cd aturaja/frontend

# Install dependensi
npm install

# Buat file environment
cp .env.local.example .env.local
```

Edit `.env.local` dengan VSCode:

```bash
code .env.local
```

Isi dengan nilai dari Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Jalankan development server:

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

---

### 3 · Setup WhatsApp Bot

Buka terminal baru di VSCode (`Ctrl+Shift+\`` atau Terminal → New Terminal):

```bash
# Masuk ke direktori bot
cd aturaja/bot

# Install dependensi
npm install

# Buat file environment
cp .env.example .env
```

Edit `.env`:

```bash
code .env
```

Isi dengan nilai dari Supabase:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TZ=Asia/Jakarta
```

Jalankan bot:

```bash
npm start
```

**Pertama kali jalan**, akan muncul QR code di terminal. Buka WhatsApp di HP kamu:
- **Android**: ⋮ Menu → Perangkat Tertaut → Tautkan Perangkat
- **iPhone**: Settings → Perangkat Tertaut → Tautkan Perangkat

Scan QR code. Setelah berhasil, sesi tersimpan di folder `.wwebjs_auth` — kamu tidak perlu scan ulang setiap restart.

---

## 🖥️ Menjalankan Proyek Secara Lokal

Buka **2 terminal** di VSCode (split terminal dengan `Ctrl+Shift+5`):

**Terminal 1 — Frontend:**
```bash
cd aturaja/frontend
npm run dev
```

**Terminal 2 — Bot:**
```bash
cd aturaja/bot
npm start
```

| Service | URL / Info |
|---|---|
| Frontend | http://localhost:3000 |
| Bot | Berjalan sebagai background process |

---

## 📱 Cara Penggunaan

### Smart Input
Ketik di kotak Smart Input dan tekan **Enter** atau klik tombol kirim:

```
# Ekstrak judul + deadline + alarm
tugas rpl, dl 9 juni pagi, alarm nanti malam jam 7

# Judul + besok + jam
beli kado mama, besok jam 3 sore, penting

# Judul + hari depan + prioritas
presentasi pkl, minggu depan selasa, urgent

# Judul + alarm spesifik
olahraga pagi, alarm besok jam 5:30 pagi

# Wishlist
ikut lomba web design, dl 15 agustus, remind besok jam 9
```

Sistem akan otomatis mendeteksi:
- **Judul** — segmen pertama sebelum koma
- **Deadline** — setelah kata `dl`, `deadline`, `tenggat`
- **Alarm** — setelah kata `alarm`, `reminder`, `ingatkan`
- **Kategori** — dari kata kunci (tugas, lomba, belanja, dll)
- **Prioritas** — dari kata kunci (penting, urgent, santai, dll)

### Status Tugas
Klik ikon lingkaran di kartu tugas untuk siklus status:
**Akan Dilakukan** → **Proses** → **Jeda** → **Tertunda** → **Selesai** → ...

---

## 🔔 Cara Kerja WA Bot

1. Pengguna membuat tugas dengan **Waktu Alarm** (via Smart Input atau form modal)
2. Bot mengecek database setiap **1 menit** menggunakan cron job
3. Jika `alarm_time <= now` dan `alarm_sent = false`, bot kirim pesan WA ke nomor pengguna
4. Setelah terkirim, `alarm_sent` ditandai `true` agar tidak dikirim ulang

**Format nomor WA yang diterima:** `08xxx`, `628xxx`, `+628xxx` — semua otomatis dinormalisasi.

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key Supabase |

### Bot (`bot/.env`)

| Variable | Keterangan |
|---|---|
| `SUPABASE_URL` | URL proyek Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service Role Key** (bukan Anon Key!) |
| `TZ` | Timezone, default `Asia/Jakarta` |

---

## 🛠️ Build untuk Produksi

```bash
# Build frontend
cd frontend
npm run build
npm start    # port 3000

# Jalankan bot dengan PM2 (auto-restart)
npm install -g pm2
cd bot
pm2 start index.js --name aturaja-bot
pm2 save
pm2 startup  # agar auto-start saat reboot
```

---

## 🐛 Troubleshooting

### Bot gagal start: "error while loading shared libraries"
```bash
sudo apt-get install -y chromium-browser libgbm-dev
```

### QR code muncul terus (tidak bisa scan)
```bash
# Hapus sesi lama dan scan ulang
rm -rf bot/.wwebjs_auth
cd bot && npm start
```

### Pesan WA tidak terkirim
- Pastikan nomor WA terdaftar dan aktif
- Pastikan format nomor benar: awali `08` atau `628`
- Cek log bot di terminal untuk pesan error

### Error "supabase schema not found"
- Pastikan `schema.sql` sudah dijalankan di Supabase SQL Editor
- Pastikan trigger `trg_on_auth_user_created` berhasil dibuat

### Frontend error "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Pastikan file `.env.local` ada di folder `frontend/`
- Restart `npm run dev` setelah edit `.env.local`

---

## 📦 Tech Stack Detail

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Auth & DB | Supabase (PostgreSQL + GoTrue Auth) |
| NLP | chrono-node v2 + custom Indonesian regex parser |
| WA Bot | whatsapp-web.js + LocalAuth + node-cron |
| Font | Plus Jakarta Sans (Google Fonts) |
| Icons | Lucide React |

---

## 📄 Lisensi

MIT — bebas digunakan dan dimodifikasi.

---

*Dibuat dengan ❤️ menggunakan Next.js & Supabase — 100% gratis*
