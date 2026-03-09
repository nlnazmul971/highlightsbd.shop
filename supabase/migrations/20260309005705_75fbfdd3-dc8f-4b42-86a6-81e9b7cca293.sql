ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_sender_number TEXT;