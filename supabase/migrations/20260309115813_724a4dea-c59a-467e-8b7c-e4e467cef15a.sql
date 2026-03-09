CREATE POLICY "Users can cancel own pending orders"
ON public.orders
FOR UPDATE
TO public
USING (auth.uid() = user_id AND status = 'Pending')
WITH CHECK (status = 'Cancelled');