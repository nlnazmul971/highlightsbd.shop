
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value integer NOT NULL DEFAULT 0,
  min_order_amount integer NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons viewable by everyone" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
