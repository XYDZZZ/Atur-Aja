'use strict';

const cron = require('node-cron');
const { supabase } = require('./supabase');

// ─────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────

/** Format nomor WA ke format internasional */
function normalizeWaNumber(raw) {
  let num = raw.replace(/\D/g, '');
  if (num.startsWith('0')) num = '62' + num.slice(1);
  if (!num.startsWith('62')) num = '62' + num;
  return num + '@c.us';
}

/** Format tanggal ke bahasa Indonesia */
function fmtDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: process.env.TZ || 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Label status bahasa Indonesia */
function statusLabel(s) {
  return {
    akan_dilakukan: 'Akan Dilakukan',
    proses:         'Dalam Proses',
    jeda:           'Jeda',
    tertunda:       'Tertunda',
    selesai:        'Selesai',
  }[s] ?? s;
}

/** Label prioritas bahasa Indonesia */
function priorityEmoji(p) {
  return { tinggi: '🔴 Tinggi', sedang: '🟡 Sedang', rendah: '🟢 Rendah' }[p] ?? p;
}

/** Label kategori */
function categoryLabel(c) {
  return { keseharian: '🏠 Keseharian', tugas: '📚 Tugas', wishlist: '⭐ Wishlist' }[c] ?? c;
}

// ─────────────────────────────────────────────────
//  Buat teks pesan WhatsApp
// ─────────────────────────────────────────────────
function buildMessage(task, userName) {
  const deadline = task.deadline ? fmtDateTime(task.deadline) : null;
  const lines = [
    `⏰ *PENGINGAT TUGAS — AturAja*`,
    ``,
    `Halo *${userName}*! 👋`,
    ``,
    `📋 *${task.title}*`,
    ``,
    `${categoryLabel(task.category)}`,
    `${priorityEmoji(task.priority)}`,
    `📊 Status: *${statusLabel(task.status)}*`,
  ];

  if (task.description) {
    lines.push(`📝 Catatan: ${task.description}`);
  }

  if (deadline) {
    lines.push(``, `📅 Deadline: *${deadline}*`);
  }

  lines.push(
    ``,
    `_Dikirim otomatis oleh AturAja_ ✨`,
    `_Segera tandai selesai setelah dikerjakan!_`
  );

  return lines.join('\n');
}

// ─────────────────────────────────────────────────
//  Cek database & kirim alarm
// ─────────────────────────────────────────────────
async function checkAndSendAlarms(client) {
  try {
    const now = new Date().toISOString();

    // Ambil tugas dengan alarm_time <= now dan belum terkirim
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id, title, description, category, status, priority,
        deadline, alarm_time,
        users!inner ( name, wa_number )
      `)
      .eq('alarm_sent', false)
      .lte('alarm_time', now)
      .neq('status', 'selesai')
      .limit(50); // safety limit per tick

    if (error) {
      console.error('[Scheduler] DB error:', error.message);
      return;
    }

    if (!tasks || tasks.length === 0) return;

    console.log(`[Scheduler] ${new Date().toLocaleTimeString('id-ID')} — Processing ${tasks.length} alarm(s)...`);

    for (const task of tasks) {
      const user = task.users;
      if (!user?.wa_number) {
        console.warn(`[Scheduler] Skipped task ${task.id}: no wa_number`);
        continue;
      }

      try {
        const waNumber = normalizeWaNumber(user.wa_number);
        const message  = buildMessage(task, user.name);

        await client.sendMessage(waNumber, message);
        console.log(`[Scheduler] ✅ Sent alarm → ${user.wa_number}  | "${task.title}"`);

        // Tandai alarm sudah terkirim
        const { error: updateErr } = await supabase
          .from('tasks')
          .update({ alarm_sent: true })
          .eq('id', task.id);

        if (updateErr) {
          console.error(`[Scheduler] Failed to mark alarm_sent for ${task.id}:`, updateErr.message);
        }

        // Delay kecil antar pesan agar tidak diblokir WA
        await new Promise((r) => setTimeout(r, 1200));

      } catch (sendErr) {
        console.error(
          `[Scheduler] ❌ Failed to send to ${user.wa_number} for task "${task.title}":`,
          sendErr.message
        );
      }
    }
  } catch (err) {
    console.error('[Scheduler] Unexpected error:', err);
  }
}

// ─────────────────────────────────────────────────
//  Start scheduler
// ─────────────────────────────────────────────────
function startScheduler(client) {
  // Jalankan setiap menit
  cron.schedule('* * * * *', () => {
    checkAndSendAlarms(client);
  });

  console.log('⏱️  Scheduler aktif — cek alarm setiap 1 menit');

  // Langsung cek saat pertama kali bot ready
  setTimeout(() => checkAndSendAlarms(client), 3000);
}

module.exports = { startScheduler };
