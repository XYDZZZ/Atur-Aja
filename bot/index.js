'use strict';

require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode  = require('qrcode-terminal');
const { startScheduler } = require('./scheduler');

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
