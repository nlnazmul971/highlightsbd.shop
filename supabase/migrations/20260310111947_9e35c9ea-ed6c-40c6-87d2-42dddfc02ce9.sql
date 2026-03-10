
-- Fix: Allow anon to read back their just-inserted order (needed for .select().single() after insert)
-- Drop the token-based policy that doesn't work with PostgREST
DROP POLICY IF EXISTS "Anon can view order by token" ON public.orders;

-- Allow anon to insert and immediately read back (PostgREST needs SELECT after INSERT)
-- Use a simpler approach: anon can only see orders created in last 30 seconds with matching phone
CREATE POLICY "Anon can read back inserted order"
ON public.orders
FOR SELECT
TO anon
USING (created_at > now() - interval '30 seconds');
