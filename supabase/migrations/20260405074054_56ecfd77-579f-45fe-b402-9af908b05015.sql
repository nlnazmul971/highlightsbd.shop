
CREATE TABLE public.fraud_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Unknown',
  score INTEGER NOT NULL DEFAULT 0,
  total_parcel INTEGER NOT NULL DEFAULT 0,
  success_parcel INTEGER NOT NULL DEFAULT 0,
  cancel_parcel INTEGER NOT NULL DEFAULT 0,
  response JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'LIVE',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud checks" ON public.fraud_checks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert fraud checks" ON public.fraud_checks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update fraud checks" ON public.fraud_checks FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
