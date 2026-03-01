-- Add sort_order column for manual ordering of reviews
-- Lower sort_order = appears first (top). Default to 0.
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Initialize sort_order based on current date ordering (newest = lowest number = top)
-- This ensures existing reviews keep their current visual order
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY date DESC, created_at DESC) as rn
  FROM public.reviews
)
UPDATE public.reviews
SET sort_order = ordered.rn
FROM ordered
WHERE public.reviews.id = ordered.id;

-- Index for fast ordering
CREATE INDEX IF NOT EXISTS idx_reviews_sort_order ON public.reviews(sort_order);
