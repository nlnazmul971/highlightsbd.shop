-- Add transaction_id column to orders table for manual payment tracking
ALTER TABLE public.orders 
ADD COLUMN transaction_id text;