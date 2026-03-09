
CREATE TABLE public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert store settings" ON public.store_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update store settings" ON public.store_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete store settings" ON public.store_settings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Seed default footer values
INSERT INTO public.store_settings (key, value) VALUES
  ('footer_brand_name', 'HIGHLIGHTS'),
  ('footer_address', 'HOUSE 12, ROAD 5, SECTOR 3, UTTARA, DHAKA'),
  ('footer_phone', '+880 1234 567890'),
  ('footer_email', 'INFO@HIGHLIGHTS.COM'),
  ('footer_facebook', ''),
  ('footer_instagram', ''),
  ('footer_copyright', '© 2026 HIGHLIGHTS. All rights reserved.')
ON CONFLICT (key) DO NOTHING;
