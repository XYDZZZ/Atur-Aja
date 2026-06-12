-- =====================================================
--  AturAja — Database Schema (Supabase PostgreSQL)
--  Jalankan di: Supabase → SQL Editor → New Query
-- =====================================================

-- 1. Tabel profil pengguna (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID         NOT NULL PRIMARY KEY
             REFERENCES auth.users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  wa_number  VARCHAR(20)  NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Profil pengguna — ekstensi dari auth.users';

-- 2. Tabel tugas
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID         NOT NULL
              REFERENCES public.users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(20)  NOT NULL DEFAULT 'keseharian'
              CHECK (category IN ('keseharian', 'tugas', 'wishlist')),
  status      VARCHAR(20)  NOT NULL DEFAULT 'akan_dilakukan'
              CHECK (status IN ('akan_dilakukan','proses','jeda','tertunda','selesai')),
  priority    VARCHAR(10)  NOT NULL DEFAULT 'sedang'
              CHECK (priority IN ('tinggi','sedang','rendah')),
  deadline    TIMESTAMPTZ,
  alarm_time  TIMESTAMPTZ,
  alarm_sent  BOOLEAN      DEFAULT FALSE,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE public.tasks IS 'Tugas pengguna beserta status, prioritas, deadline & alarm';

-- 3. Fungsi & trigger auto-update updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 4. Fungsi & trigger auto-buat profil saat user mendaftar
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, name, wa_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Pengguna'),
    COALESCE(NEW.raw_user_meta_data->>'wa_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- 5. Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy — users
DROP POLICY IF EXISTS "users: read own"   ON public.users;
DROP POLICY IF EXISTS "users: update own" ON public.users;

CREATE POLICY "users: read own"   ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users: update own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 7. RLS Policy — tasks
DROP POLICY IF EXISTS "tasks: read own"   ON public.tasks;
DROP POLICY IF EXISTS "tasks: create own" ON public.tasks;
DROP POLICY IF EXISTS "tasks: update own" ON public.tasks;
DROP POLICY IF EXISTS "tasks: delete own" ON public.tasks;

CREATE POLICY "tasks: read own"   ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks: create own" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks: update own" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks: delete own" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_tasks_user_id  ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_created  ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_alarm
  ON public.tasks(alarm_time) WHERE alarm_sent = FALSE;

-- =====================================================
-- SELESAI — Skema berhasil dibuat
-- =====================================================
