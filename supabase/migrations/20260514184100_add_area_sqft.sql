-- Add area_sqft to venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS area_sqft integer;

-- Add description placeholder if null
UPDATE public.venues SET description = 'Premium venue with state-of-the-art facilities.' WHERE description IS NULL;
