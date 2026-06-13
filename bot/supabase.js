'use strict';

require('dotenv').config();

// Fix "fetch failed" di Railway — paksa IPv4 untuk DNS lookup
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient } = require('@supabase/supabase-js');
const ws    = require('ws');
const fetch = require('node-fetch');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Gunakan node-fetch sebagai pengganti undici (built-in fetch Node 20)
    // karena undici sering menghasilkan "TypeError: fetch failed" tanpa
    // pesan error yang jelas di environment container seperti Railway.
    global: {
      fetch: fetch,
    },
    // Bot tidak memakai realtime subscription, tapi Supabase client
    // tetap menginisialisasi RealtimeClient yang butuh WebSocket polyfill
    // di Node.js < 22 (Node tidak punya global WebSocket sebelum v22)
    realtime: {
      transport: ws,
    },
  }
);

module.exports = { supabase };
