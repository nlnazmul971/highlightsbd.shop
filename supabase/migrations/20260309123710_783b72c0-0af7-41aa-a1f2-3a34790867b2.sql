
-- Allow admins to view all wishlist items
CREATE POLICY "Admins can view all wishlist items" ON public.wishlist_items
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
