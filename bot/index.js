'use strict';

require('dotenv').config();

// ── Fix "fetch failed" di Railway/Docker ──
// Banyak environment container hanya support IPv4, tapi Node 20 default
// mencoba IPv6 dulu untuk DNS lookup, menyebabkan undici fetch gagal.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode  = require('qrcode-terminal');
const fs      = require('fs');
const path    = require('path');
const { startScheduler } = require('./scheduler');

// ── Fix "profile in use" error setelah volume remount ──
// Chromium meninggalkan file lock (SingletonLock dll) jika container
// dimatikan secara paksa. File ini menyebabkan Chromium baru menolak
// start karena mengira profile masih dipakai proses lain.
function cleanupChromiumLocks() {
  const authDir = path.join(__dirname, '.wwebjs_auth');
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

  function removeLocksRecursive(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeLocksRecursive(fullPath);
      } else if (lockFiles.includes(entry.name)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`🧹 Removed stale lock: ${fullPath}`);
        } catch (err) {
          console.warn(`⚠️  Failed to remove ${fullPath}:`, err.message);
        }
      }
    }
  }

  removeLocksRecursive(authDir);
}

cleanupChromiumLocks();

// ─────────────────────────────────────────────────
//  Inisialisasi Client
// ─────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'aturaja-bot',
    dataPath: './.wwebjs_auth',   // sesi tersimpan di sini
  }),
  puppeteer: {
    headless: true,
    // Di Docker/Railway, executablePath diset via env PUPPETEER_EXECUTABLE_PATH
    // Di lokal (tanpa env ini), Puppeteer pakai Chromium bawaannya sendiri
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',        // diperlukan di banyak VPS Linux
      '--disable-gpu',
      // ── Hemat memori (penting untuk Railway free tier ~512MB) ──
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-features=TranslateUI,BlinkGenPropertyTrees',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--enable-features=NetworkServiceInProcess2',
      '--memory-pressure-off',
      '--js-flags=--max-old-space-size=128',
    ],
  },
});

// ─────────────────────────────────────────────────
//  Event handlers
// ─────────────────────────────────────────────────

client.on('qr', (qr) => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   Scan QR Code ini dengan WhatsApp   ║');
  console.log('╚══════════════════════════════════════╝\n');
  qrcode.generate(qr, { small: true });
  console.log('\nBuka WhatsApp → Perangkat Tertaut → Tautkan Perangkat\n');

  // ── Fallback untuk Railway/log viewer yang memotong ASCII QR ──
  // Buka link ini di browser untuk lihat QR sebagai gambar
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
  console.log('📱 Jika QR di atas rusak/terpotong, buka link ini di browser:');
  console.log(qrImageUrl);
  console.log('');
});

client.on('loading_screen', (percent, message) => {
  process.stdout.write(`\r⏳ Loading... ${percent}% — ${message}   `);
});

client.on('authenticated', () => {
  console.log('\n🔐 Autentikasi berhasil!');
});

client.on('auth_failure', (msg) => {
  console.error('\n❌ Autentikasi gagal:', msg);
  console.error('Hapus folder .wwebjs_auth dan coba lagi.\n');
  process.exit(1);
});

client.on('ready', () => {
  console.log('\n');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   ✅  AturAja WhatsApp Bot Aktif!    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\nNomor bot: ${client.info.wid.user}`);
  console.log('Bot siap mengirim pengingat otomatis.\n');

  startScheduler(client);
});

client.on('disconnected', (reason) => {
  console.warn('\n⚠️  Bot terputus:', reason);
  console.warn('Restart bot untuk menyambung kembali.\n');
  process.exit(1);
});

client.on('message', async (msg) => {
  // Auto-reply sederhana jika ada yang chat ke bot
  if (msg.body.toLowerCase() === 'ping') {
    await msg.reply('🤖 AturAja Bot aktif! Pengingat dikirim otomatis.');
  }
  if (msg.body.toLowerCase() === 'status') {
    await msg.reply('✅ AturAja Bot berjalan normal.\nPengingat tugas dikirim sesuai jadwal.');
  }
});

// ─────────────────────────────────────────────────
//  Graceful shutdown
// ─────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n👋 Menerima ${signal}, menutup bot...`);
  try {
    await client.destroy();
    console.log('Bot ditutup dengan bersih.');
  } catch {
    // ignore
  }
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Jangan crash — biarkan berjalan terus
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// ─────────────────────────────────────────────────
//  Start
// ─────────────────────────────────────────────────
console.log('🚀 Memulai AturAja WhatsApp Bot...\n');
client.initialize();
