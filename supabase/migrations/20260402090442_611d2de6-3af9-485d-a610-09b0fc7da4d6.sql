
-- Size-wise stock tracking
CREATE TABLE public.product_size_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  total_stock INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  cancelled_count INTEGER NOT NULL DEFAULT 0,
  returned_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, size)
);

ALTER TABLE public.product_size_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock viewable by everyone" ON public.product_size_stock FOR SELECT USING (true);
CREATE POLICY "Admins can insert stock" ON public.product_size_stock FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update stock" ON public.product_size_stock FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stock" ON public.product_size_stock FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Stock change logs
CREATE TABLE public.stock_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'manual',
  quantity INTEGER NOT NULL DEFAULT 0,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock logs" ON public.stock_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert stock logs" ON public.stock_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert stock logs" ON public.stock_logs FOR INSERT TO anon WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_product_size_stock_updated_at
  BEFORE UPDATE ON public.product_size_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
