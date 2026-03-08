CREATE TABLE public.tracking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tracking_settings"
ON public.tracking_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tracking_settings (key, value) VALUES
  ('ga4_measurement_id', ''),
  ('gtm_container_id', ''),
  ('meta_pixel_id', ''),
  ('meta_capi_access_token', '');