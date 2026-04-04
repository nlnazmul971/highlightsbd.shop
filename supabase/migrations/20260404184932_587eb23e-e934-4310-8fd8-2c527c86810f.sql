ALTER TABLE public.orders ADD COLUMN call_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN admin_notes text;