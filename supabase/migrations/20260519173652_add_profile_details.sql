-- Add age, place, and interested_sports columns to public.profiles
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS place text,
  ADD COLUMN IF NOT EXISTS interested_sports text[];
