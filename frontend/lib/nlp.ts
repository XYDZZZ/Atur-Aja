/**
 * AturAja — NLP Local (Smart Input Parser)
 * ─────────────────────────────────────────────────
 * Mengekstrak Judul, Deadline, Alarm, Kategori & Prioritas
 * dari teks natural berbahasa Indonesia.
 *
 * Contoh input:
 *   "tugas rpl, dl 9 juni pagi, alarm nanti malam jam 7"
 *   "beli kado mama, besok jam 3 sore, penting"
 *   "presentasi pkl minggu depan selasa"
 */

import * as chrono from 'chrono-node';
import type { ParsedTaskInput, TaskCategory, TaskPriority } from '@/types';

// ─────────────────────────────────────────────────
//  Lookup tables
// ─────────────────────────────────────────────────

const MONTHS_ID: Record<string, number> = {
  jan: 1,  januari: 1,
  feb: 2,  februari: 2,
  mar: 3,  maret: 3,
  apr: 4,  april: 4,
  mei: 5,  may: 5,
  jun: 6,  juni: 6,
  jul: 7,  juli: 7,
  agu: 8,  agustus: 8,  agst: 8,
  sep: 9,  september: 9, sept: 9,
  okt: 10, oktober: 10,
  nov: 11, november: 11,
  des: 12, desember: 12,
};

const DAYS_ID: Record<string, number> = {
  minggu: 0, ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5, "jum'at": 5,
  sabtu: 6,
};

const TIME_PERIODS: Record<string, number> = {
  subuh: 4,
  pagi: 8,
  siang: 12,
  sore: 16,
  petang: 17,
  malam: 20,
  'tengah malam': 0,
};

// ─────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────

function setTime(date: Date, h: number, m = 0): Date {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function getNextWeekday(weekday: number, ref = new Date()): Date {
  const today = ref.getDay();
  let diff = weekday - today;
  if (diff <= 0) diff += 7;
  const d = new Date(ref);
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Ekastrak jam dari string: "jam 7", "jam 3 sore", "19:00", "pagi" */
function extractTime(s: string, base: Date): Date | null {
  const norm = s.toLowerCase();

  // HH:MM
  const hhmm = norm.match(/\b(\d{1,2})[.:](\d{2})\b/);
  if (hhmm) return setTime(base, +hhmm[1], +hhmm[2]);

  // jam X (period)?
  const jamX = norm.match(/jam\s+(\d{1,2})(?:\s+(pagi|siang|sore|malam|petang|subuh))?/);
  if (jamX) {
    let h = +jamX[1];
    const period = jamX[2];
    if (period) {
      const base12 = TIME_PERIODS[period] ?? 0;
      if (base12 >= 12 && h < 12) h += 12;
      if (base12 < 12 && h === 12) h = 0;
    }
    return setTime(base, h);
  }

  // standalone period
  for (const [period, h] of Object.entries(TIME_PERIODS)) {
    if (norm.includes(period)) return setTime(base, h);
  }

  return null;
}

/** Ekastrak tanggal dari ekspresi Indonesia + fallback chrono-node */
function parseDate(expr: string, ref = new Date()): Date | null {
  const norm = expr.toLowerCase().trim();

  // hari ini
  if (/\bhari ini\b/.test(norm)) {
    return extractTime(norm, ref) ?? setTime(ref, 8);
  }

  // besok
  if (/\bbesok\b/.test(norm)) {
    const base = addDays(ref, 1);
    return extractTime(norm, base) ?? setTime(base, 8);
  }

  // lusa
  if (/\blusa\b/.test(norm)) {
    const base = addDays(ref, 2);
    return extractTime(norm, base) ?? setTime(base, 8);
  }

  // minggu depan
  if (/\bminggu depan\b/.test(norm)) {
    return setTime(addDays(ref, 7), 8);
  }

  // bulan depan
  if (/\bbulan depan\b/.test(norm)) {
    const d = new Date(ref);
    d.setMonth(d.getMonth() + 1);
    return setTime(d, 8);
  }

  // nanti malam/sore/pagi
  const nanti = norm.match(/\bnanti\s+(malam|sore|siang|pagi|petang)\b/);
  if (nanti) {
    const h = TIME_PERIODS[nanti[1]] ?? 20;
    return setTime(ref, h);
  }

  // "senin depan" / "sabtu depan"
  for (const [dayName, dayNum] of Object.entries(DAYS_ID)) {
    const nextPat = new RegExp(`\\b${dayName}\\s+depan\\b`);
    const thisPat = new RegExp(`\\b${dayName}\\b`);
    if (nextPat.test(norm)) {
      const base = getNextWeekday(dayNum, addDays(ref, 1)); // force next week
      return extractTime(norm, base) ?? setTime(base, 8);
    }
    if (thisPat.test(norm)) {
      const base = getNextWeekday(dayNum, ref);
      return extractTime(norm, base) ?? setTime(base, 8);
    }
  }

  // "9 juni" / "25 desember 2025"
  for (const [mName, mNum] of Object.entries(MONTHS_ID)) {
    const pat = new RegExp(`(\\d{1,2})\\s+${mName}(?:\\s+(\\d{4}))?`);
    const m = norm.match(pat);
    if (m) {
      const day  = +m[1];
      const year = m[2] ? +m[2] : ref.getFullYear();
      const base = new Date(year, mNum - 1, day);
      if (isNaN(base.getTime())) continue;
      if (base < ref && !m[2]) base.setFullYear(year + 1);
      return extractTime(norm, base) ?? setTime(base, 8);
    }
  }

  // Fallback: chrono-node (handles English dates)
  return chrono.parseDate(expr, ref, { forwardDate: true });
}

// ─────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────

export function parseSmartInput(input: string): ParsedTaskInput {
  const ref  = new Date();
  let   text = input.trim();

  let deadline:   Date | null = null;
  let alarm_time: Date | null = null;
  let category:   TaskCategory  | null = null;
  let priority:   TaskPriority  | null = null;

  // ── 1. Ekstrak segmen DEADLINE ─────────────────
  //  Pattern: "dl X", "deadline X", "tenggat X", "batas X"
  const dlRx = /(?:(?:^|,\s*)(?:dl|deadline|tenggat|batas(?:\s+waktu)?)[\s:]*)((?:[^,;])+)/i;
  const dlM  = text.match(dlRx);
  if (dlM) {
    deadline = parseDate(dlM[1].trim(), ref);
    text = text.replace(dlM[0].trim(), '').replace(/^[,\s]+|[,\s]+$/g, '').trim();
  }

  // ── 2. Ekstrak segmen ALARM ────────────────────
  //  Pattern: "alarm X", "reminder X", "ingatkan X", "remind X"
  const alarmRx = /(?:(?:^|,\s*)(?:alarm|remind(?:er)?|ingatkan|notif(?:ikasi)?)[\s:]*)((?:[^,;])+)/i;
  const alarmM  = text.match(alarmRx);
  if (alarmM) {
    alarm_time = parseDate(alarmM[1].trim(), ref);
    text = text.replace(alarmM[0].trim(), '').replace(/^[,\s]+|[,\s]+$/g, '').trim();
  }

  // ── 3. Fallback: tanggal/waktu tanpa keyword ──
  if (!alarm_time) {
    const loosePat = /\b(besok|lusa|nanti\s+\w+|\d{1,2}\s+(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember))\b/i;
    const looseM   = text.match(loosePat);
    if (looseM) {
      // ambil seluruh segmen di sekitar match
      const segStart = Math.max(0, looseM.index! - 5);
      const segment  = text.slice(segStart);
      const parsed   = parseDate(segment, ref);
      if (parsed) {
        alarm_time = parsed;
        text = text.replace(looseM[0], '').trim();
      }
    }
  }

  // ── 4. Deteksi PRIORITAS ───────────────────────
  if (/\b(penting|urgent|segera|asap|kritis|darurat|prioritas\s*tinggi|high\s*priority)\b/i.test(text)) {
    priority = 'tinggi';
    text = text.replace(/\b(penting|urgent|segera|asap|kritis|darurat|prioritas\s*tinggi|high\s*priority)\b/gi, '').trim();
  } else if (/\b(sedang|biasa|normal|medium)\b/i.test(text)) {
    priority = 'sedang';
    text = text.replace(/\b(sedang|biasa|normal|medium)\b/gi, '').trim();
  } else if (/\b(santai|rendah|low|opsional|optional)\b/i.test(text)) {
    priority = 'rendah';
    text = text.replace(/\b(santai|rendah|low|opsional|optional)\b/gi, '').trim();
  }

  // ── 5. Deteksi KATEGORI ────────────────────────
  if (/\b(tugas|pr|laporan|presentasi|makalah|skripsi|coding|project|projek|ujian|quiz|kuliah|rpl|pbo|tbd|semester)\b/i.test(text)) {
    category = 'tugas';
  } else if (/\b(lomba|kompetisi|wishlist|impian|keinginan|bucket|goal|ingin|cita)\b/i.test(text)) {
    category = 'wishlist';
  } else if (/\b(belanja|makan|olahraga|tidur|bersih|masak|cuci|bayar|beli|jalan|nonton|main|gym)\b/i.test(text)) {
    category = 'keseharian';
  }

  // ── 6. Bangun judul dari sisa teks ────────────
  const segments = text
    .split(/,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  let title = segments[0] || text;
  title = title.replace(/\s+/g, ' ').trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, deadline, alarm_time, category, priority };
}
