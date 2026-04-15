-- ============================================================
-- BeerTracker — Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  gender      TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS: users can only read/write their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow all users to read profiles (needed for leaderboard)
CREATE POLICY "profiles: read all for leaderboard"
  ON public.profiles FOR SELECT
  USING (true);


-- ── Beer Logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.beer_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beer_name    TEXT,
  volume_ml    NUMERIC(7,1) NOT NULL CHECK (volume_ml > 0),
  abv_percent  NUMERIC(5,2) NOT NULL CHECK (abv_percent >= 0),
  units        NUMERIC(6,3) NOT NULL CHECK (units >= 0),
  logged_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient time-range queries
CREATE INDEX IF NOT EXISTS beer_logs_user_logged_at_idx
  ON public.beer_logs (user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS beer_logs_logged_at_idx
  ON public.beer_logs (logged_at DESC);

-- RLS: users can only manage their own logs
ALTER TABLE public.beer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beer_logs: select own"
  ON public.beer_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "beer_logs: insert own"
  ON public.beer_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "beer_logs: update own"
  ON public.beer_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "beer_logs: delete own"
  ON public.beer_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Allow reading all beer_logs for the leaderboard (aggregated, not personal)
-- Leaderboard joins with profiles so only logged-in users can see it
CREATE POLICY "beer_logs: read all for leaderboard"
  ON public.beer_logs FOR SELECT
  USING (auth.role() = 'authenticated');


-- ── Auto-create profile on signup ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── Storage: avatars bucket ────────────────────────────────
-- Run this separately if the bucket doesn't exist:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT DO NOTHING;

-- Storage RLS policies for avatars bucket
-- (Create these in Supabase Dashboard → Storage → Policies)
-- Or run:
/*
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars: own update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
*/
