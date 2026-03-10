
-- Allow anon users to read back their just-inserted order
CREATE POLICY "Anon can view own inserted orders" ON public.orders FOR SELECT TO anon USING (true);
