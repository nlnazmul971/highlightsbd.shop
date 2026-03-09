-- Create checkout payment settings table (publicly readable, admin writable)
CREATE TABLE IF NOT EXISTS public.checkout_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  number text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT checkout_payment_settings_provider_unique UNIQUE (provider)
);

ALTER TABLE public.checkout_payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read payment instructions/numbers on checkout
DO $$ BEGIN
  CREATE POLICY "Checkout payment settings are viewable by everyone"
  ON public.checkout_payment_settings
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can manage
DO $$ BEGIN
  CREATE POLICY "Admins can insert checkout payment settings"
  ON public.checkout_payment_settings
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update checkout payment settings"
  ON public.checkout_payment_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete checkout payment settings"
  ON public.checkout_payment_settings
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_checkout_payment_settings_updated_at ON public.checkout_payment_settings;
CREATE TRIGGER update_checkout_payment_settings_updated_at
BEFORE UPDATE ON public.checkout_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_checkout_payment_settings_provider ON public.checkout_payment_settings(provider);
