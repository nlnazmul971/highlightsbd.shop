ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS consignment_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tracking_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS courier_provider text DEFAULT NULL;